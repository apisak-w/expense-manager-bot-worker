import {
  User,
  UserRepository,
  createUnauthorizedUser,
  userFromKvData,
} from "../domain/user";

export class KvUserRepository implements UserRepository {
  private readonly kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getById(userId: number): Promise<User> {
    const raw = await this.kv.get(`user:${userId}`);

    if (!raw) {
      return createUnauthorizedUser(userId);
    }

    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      const user = userFromKvData(userId, data);
      console.log(
        `KvUserRepository: Parsed user ${userId}, authorized: ${user.isAuthorized}`
      );
      return user;
    } catch (err) {
      console.error(`KvUserRepository: Error parsing KV data for user ${userId}:`, err);
      return createUnauthorizedUser(userId);
    }
  }
}
