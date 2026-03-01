export interface User {
  userId: number;
  isAuthorized: boolean;
}

export interface UserRepository {
  getById(userId: number): Promise<User>;
}

export function createUnauthorizedUser(userId: number): User {
  return { userId, isAuthorized: false };
}

export function userFromKvData(userId: number, data: Record<string, unknown>): User {
  return {
    userId,
    isAuthorized: data["is_authorized"] === true,
  };
}
