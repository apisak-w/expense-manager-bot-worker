import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types/env";
import { handleTelegramWebhook } from "./handlers/telegram.handler";
import { handleGetPermissions } from "./handlers/user.handler";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowedOrigins = c.env.CORS_ORIGIN.split(",");
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      return allowedOrigins[0];
    },
  })
);

app.get("/users/:userId/permissions", handleGetPermissions);

app.post("/", handleTelegramWebhook);

export default app;
