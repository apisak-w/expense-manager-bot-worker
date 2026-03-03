import { Hono } from "hono";
import { Env } from "./types/env";
import { handleTelegramWebhook } from "./handlers/telegram.handler";
import { handleGetPermissions } from "./handlers/user.handler";

const app = new Hono<{ Bindings: Env }>();

app.get("/users/:userId/permissions", handleGetPermissions);

app.post("/", handleTelegramWebhook);

export default app;
