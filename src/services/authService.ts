import { User, UserRepository } from "../domain/user";

export class AuthService {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async authenticate(userId: number): Promise<User> {
    return this.userRepository.getById(userId);
  }
}
