import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types/env";
import { handleTelegramWebhook } from "./handlers/telegram.handler";
import { handleGetPermissions } from "./handlers/user.handler";

const app = new Hono<{ Bindings: Env }>();

// FIXME: Turn this into environment variable
app.use("*", cors());

app.get("/users/:userId/permissions", handleGetPermissions);

app.post("/", handleTelegramWebhook);

export default app;
