import { User } from '../features/user/entities/user.entity';

// JwtStrategy의 validate 메서드가 반환하는 타입을 명시합니다.
type AuthenticatedUser = User;

declare global {
  namespace Express {
    export interface Request {
      // AuthGuard('jwt')를 통과하면 req.user는 항상 AuthenticatedUser 타입입니다.
      user?: AuthenticatedUser;
    }
  }
}
