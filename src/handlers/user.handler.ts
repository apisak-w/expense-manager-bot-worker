import { Context } from "hono";
import { Env } from "../types/env";
import { KvUserRepository } from "../infrastructure/kvUserRepository";
import { AuthService } from "../services/auth.service";

export const handleGetPermissions = async (
  c: Context<{ Bindings: Env }>
): Promise<Response> => {
  const userIdStr = c.req.param("userId");
  const userId = parseInt(userIdStr, 10);

  if (isNaN(userId)) {
    return c.text("Invalid User ID", 400);
  }

  if (!c.env.BOT_USERS_KV) {
    console.error("Missing BOT_USERS_KV binding");
    return c.text("Internal Server Error: missing configuration", 500);
  }

  try {
    const userRepo = new KvUserRepository(c.env.BOT_USERS_KV);
    const authService = new AuthService(userRepo);
    const user = await authService.authenticate(userId);

    return c.json(user);
  } catch (err) {
    console.error(`Error fetching permissions for user ${userId}:`, err);
    return c.text("Internal Server Error", 500);
  }
};
