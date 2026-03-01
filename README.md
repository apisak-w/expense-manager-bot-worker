# expense-manager-bot-worker

Telegram expense manager bot running on **Cloudflare Workers** (TypeScript).

## Stack

- **Runtime**: Cloudflare Workers (native, no compatibility flags)
- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm
- **Infrastructure**: Cloudflare KV (user access control)
- **Integrations**: Telegram Bot API, Google Sheets API (via Service Account JWT)

## Architecture

```
src/
├── worker.ts              # Entry point — fetch handler + command router
├── context.ts             # BotContext: shared per-request dependencies
├── types/
│   └── env.ts             # Cloudflare Worker environment bindings (Env interface)
├── domain/
│   └── user.ts            # User entity + UserRepository interface
├── infrastructure/
│   └── kvUserRepository.ts# KV-backed UserRepository
├── services/
│   └── authService.ts     # Authenticate users via UserRepository
├── clients/
│   ├── telegram.ts        # Telegram Bot API client (sendMessage, deleteMessage)
│   └── sheets.ts          # Google Sheets API client (JWT auth via crypto.subtle)
├── commands/
│   ├── start.ts           # /start
│   ├── report.ts          # /report [mm-yyyy]
│   ├── expense.ts         # /expense (disabled in router — enable when ready)
│   └── income.ts          # /income  (disabled in router — enable when ready)
└── utils/
    ├── expenseUtils.ts    # Expense/income message parsing + auto-categorisation
    └── reportUtils.ts     # Pivot table report data extraction
```

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure secrets

```bash
pnpm wrangler secret put TELEGRAM_BOT_TOKEN
pnpm wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
pnpm wrangler secret put GOOGLE_SHEET_ID
```

### 3. Run locally

```bash
pnpm dev
```

### 4. Type-check

```bash
pnpm typecheck
```

### 5. Deploy

```bash
pnpm deploy
```

## KV User Access Control

Users are authorised via the `BOT_USERS_KV` namespace. Each entry has the key `user:<telegram_user_id>` and the value:

```json
{ "is_authorized": true }
```

To add a user:

```bash
pnpm wrangler kv key put --binding=BOT_USERS_KV "user:123456789" '{"is_authorized":true}'
```

## Commands

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `/start`          | Show welcome message                           |
| `/report`         | Current month expense report                   |
| `/report mm-yyyy` | Specific month report (e.g. `/report 02-2026`) |
| `/expense`        | _(disabled)_ Record an expense                 |
| `/income`         | _(disabled)_ Record an income                  |
