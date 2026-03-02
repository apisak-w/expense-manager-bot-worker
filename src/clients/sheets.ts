interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

/**
 * Lightweight Google Sheets client for Cloudflare Workers.
 * Uses the native Web Crypto API for RS256 JWT signing — no pyodide/js bridge needed.
 * Port of sheets_light.py.
 */
export class SheetsClient {
  private readonly creds: ServiceAccountCredentials;
  private readonly sheetId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(serviceAccountJson: string, sheetId: string) {
    this.creds = JSON.parse(serviceAccountJson) as ServiceAccountCredentials;
    this.sheetId = sheetId;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private base64UrlEncode(data: string | object): string {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (const b of bytes) {
      binary += String.fromCharCode(b);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && now < this.tokenExpiry - 60) {
      return this.accessToken;
    }

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: this.creds.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const unsignedJwt = `${this.base64UrlEncode(header)}.${this.base64UrlEncode(payload)}`;

    // Strip PEM headers / newlines and decode base64
    const pkContent = this.creds.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s/g, "");

    const pkBinary = atob(pkContent);
    const pkBytes = new Uint8Array(pkBinary.length);
    for (let i = 0; i < pkBinary.length; i++) {
      pkBytes[i] = pkBinary.charCodeAt(i);
    }

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pkBytes,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const dataToSign = new TextEncoder().encode(unsignedJwt);
    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      dataToSign
    );

    const sigBytes = new Uint8Array(signatureBuffer);
    let sigBinary = "";
    for (const b of sigBytes) {
      sigBinary += String.fromCharCode(b);
    }
    const signature = btoa(sigBinary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const signedJwt = `${unsignedJwt}.${signature}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    this.accessToken = tokenData.access_token;
    this.tokenExpiry = now + (tokenData.expires_in ?? 3600);
    return this.accessToken;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Append a single row to the sheet. */
  async appendRow(rowData: unknown[]): Promise<void> {
    const token = await this.getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/A1:append?valueInputOption=USER_ENTERED`;

    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [rowData] }),
    });
  }

  /** Fetch raw values from a specific range/sheet name. */
  async getValues(rangeName: string): Promise<unknown[][]> {
    const token = await this.getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${encodeURIComponent(rangeName)}?valueRenderOption=UNFORMATTED_VALUE`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Sheets API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Google Sheets API error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { values?: unknown[][] };
    return data.values ?? [];
  }

  /** Fetch all data from the first sheet and return as list of records. */
  async getAllRecords(): Promise<Record<string, unknown>[]> {
    const values = await this.getValues("A:Z");
    if (values.length === 0) return [];

    const header = values[0] as string[];
    const records: Record<string, unknown>[] = [];

    for (const row of values.slice(1)) {
      const record: Record<string, unknown> = {};
      const typedRow = row as unknown[];
      for (let i = 0; i < header.length; i++) {
        const val = i < typedRow.length ? typedRow[i] : "";
        record[header[i]] = val ?? "";
      }
      records.push(record);
    }

    return records;
  }
}
