import { Hono } from "hono";
import { Env } from "./types/env";
import { handleTelegramWebhook } from "./handlers/telegram.handler";
import { handleGetPermissions } from "./handlers/user.handler";

const app = new Hono<{ Bindings: Env }>();

// --- Routes ---

// 1. Permissions Endpoint
app.get("/users/:userId/permissions", handleGetPermissions);

// 2. Telegram Webhook (POST)
app.post("/", handleTelegramWebhook);

export default app;
