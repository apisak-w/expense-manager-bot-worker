import { describe, it, expect, vi, beforeEach } from "vitest";
import { SheetsClient } from "./sheets";

describe("SheetsClient", () => {
  const serviceAccountJson = JSON.stringify({
    client_email: "test@example.com",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7\n-----END PRIVATE KEY-----",
  });
  const sheetId = "fake-sheet-id";
  let client: SheetsClient;

  beforeEach(() => {
    client = new SheetsClient(serviceAccountJson, sheetId);
    vi.stubGlobal("fetch", vi.fn());
    // Mock crypto.subtle for JWT signing if needed, but we can also mock getAccessToken or high level fetch
    // To keep it simple and focus on the API logic, we'll mock the internal fetch calls.
  });

  it("should initialize with credentials", () => {
    expect(client).toBeDefined();
  });

  // Since getAccessToken is private and complex involves crypto,
  // we'll mock the whole getAccessToken by making it public for tests or mocking fetch for token

  it("should handle error if Google Sheets API returns non-ok response", async () => {
    // Mock token request
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "fake-token", expires_in: 3600 }),
      })
      // Mock getValues request error
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "Permission denied",
      });

    vi.stubGlobal("fetch", mockFetch);
    // Mock crypto.subtle.importKey and sign to avoid actual RSA ops which are slow/complex in minimal tests
    vi.stubGlobal("crypto", {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    });

    await expect(client.getValues("A1:B2")).rejects.toThrow(
      "Google Sheets API error: 403 Permission denied"
    );
  });

  it("should return empty array if getValues has no values in response", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "fake-token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("crypto", {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    });

    const values = await client.getValues("A1:B2");
    expect(values).toEqual([]);
  });

  it("should correctly format records in getAllRecords", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "fake-token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          values: [["Name", "Age"], ["Alice", 30], ["Bob"]],
        }),
      });

    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("crypto", {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    });

    const records = await client.getAllRecords();
    expect(records).toEqual([
      { Name: "Alice", Age: 30 },
      { Name: "Bob", Age: "" },
    ]);
  });
});
