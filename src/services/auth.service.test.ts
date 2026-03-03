import { describe, it, expect, vi } from "vitest";
import { AuthService } from "./auth.service";
import { UserRepository, User } from "../domain/user";

describe("AuthService", () => {
  it("should return the user from repository", async () => {
    const mockUser: User = {
      userId: 123,
      isAuthorized: true,
    };
    const mockRepo: UserRepository = {
      getById: vi.fn().mockResolvedValue(mockUser),
    };

    const authService = new AuthService(mockRepo);
    const result = await authService.authenticate(123);

    expect(result).toEqual(mockUser);
    expect(mockRepo.getById).toHaveBeenCalledWith(123);
  });

  it("should return unauthorized user if repository returns unauthorized", async () => {
    const mockUser: User = {
      userId: 456,
      isAuthorized: false,
    };
    const mockRepo: UserRepository = {
      getById: vi.fn().mockResolvedValue(mockUser),
    };

    const authService = new AuthService(mockRepo);
    const result = await authService.authenticate(456);

    expect(result.isAuthorized).toBe(false);
  });
});
