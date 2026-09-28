import { EntityManager } from 'typeorm';

/**
 * 회원 탈퇴 이벤트. 도메인별 정리 리스너가 받습니다.
 * `emitAsync`로 동기 발행하므로 리스너는 `{ suppressErrors: false }`로 등록하고
 * 에러를 다시 던져야 탈퇴 트랜잭션이 롤백됩니다.
 */
export const USER_WITHDRAWN_EVENT = 'user.withdrawn';

export interface UserWithdrawnEvent {
  userId: number;
  /** 탈퇴 트랜잭션. 리스너는 이 매니저로만 DB를 건드린다 */
  entityManager: EntityManager;
}
