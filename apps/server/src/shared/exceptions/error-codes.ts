/**
 * 북적 서비스 에러 코드 정의
 *
 * 에러 코드 체계:
 * - AUTH_xxx: 인증 관련 에러
 * - USER_xxx: 사용자 관련 에러
 * - BOOK_xxx: 책 관련 에러
 * - SALE_xxx: 판매글 관련 에러
 * - REVIEW_xxx: 리뷰 관련 에러
 * - COMMENT_xxx: 댓글 관련 에러
 * - CHAT_xxx: 채팅 관련 에러
 * - VALIDATION_xxx: 입력값 검증 관련 에러
 * - INTERNAL_xxx: 서버 내부 에러
 */
import { MAX_CHAT_IMAGES } from '@bookjeok/core';

export const ERROR_CODES = {
  // ============================================
  // 인증 관련 에러 (AUTH)
  // ============================================
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_002',
    message: '토큰이 만료되었습니다.',
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_003',
    message: '인증이 필요합니다.',
  },
  AUTH_FORBIDDEN: {
    code: 'AUTH_004',
    message: '접근 권한이 없습니다.',
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'AUTH_005',
    message: '이미 사용 중인 이메일 주소입니다.',
  },
  INVALID_OR_EXPIRED_VERIFICATION_TOKEN: {
    code: 'AUTH_006',
    message: '유효하지 않거나 만료된 인증 링크입니다.',
  },
  EXPIRED_VERIFICATION_TOKEN: {
    code: 'AUTH_007',
    message: '만료된 인증 링크입니다. 인증 메일을 재발송해주세요.',
  },
  ALREADY_VERIFIED: {
    code: 'AUTH_008',
    message: '이미 이메일 인증이 완료된 계정입니다.',
  },
  EMAIL_NOT_FOUND: {
    code: 'AUTH_009',
    message: '이메일 주소를 찾을 수 없습니다.',
  },
  SOCIAL_USER_EMAIL_CHANGE_NOT_ALLOWED: {
    code: 'AUTH_010',
    message: '소셜 로그인 계정은 이메일을 변경할 수 없습니다.',
  },
  EMAIL_NOT_VERIFIED: {
    code: 'AUTH_011',
    message:
      '이메일 인증이 완료되지 않은 계정입니다. 이메일 인증 후 이용해주세요.',
  },
  INVALID_CREDENTIALS: {
    code: 'AUTH_012',
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  },
  SOCIAL_LOGIN_USER: {
    code: 'AUTH_013',
    message: '소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.',
  },
  INVALID_OR_EXPIRED_TICKET: {
    code: 'AUTH_014',
    message: '만료되었거나 이미 사용된 인증 요청입니다. 다시 로그인해주세요.',
  },
  WITHDRAWN_USER: {
    code: 'AUTH_015',
    message: '탈퇴한 계정입니다. 새로 가입해주세요.',
  },

  // ============================================
  // 사용자 관련 에러 (USER)
  // ============================================
  USER_NOT_FOUND: {
    code: 'USER_001',
    message: '사용자를 찾을 수 없습니다.',
  },
  NICKNAME_ALREADY_EXISTS: {
    code: 'USER_003',
    message: '이미 사용 중인 닉네임입니다.',
  },
  USER_IN_TRADE_CANNOT_WITHDRAW: {
    code: 'USER_004',
    message:
      '진행 중인 거래가 있어 회원 탈퇴를 진행할 수 없습니다. 모든 거래를 완료하거나 취소한 후 다시 시도해주세요.',
  },

  // ============================================
  // 책 관련 에러 (BOOK)
  // ============================================
  BOOK_NOT_FOUND: {
    code: 'BOOK_001',
    message: '책을 찾을 수 없습니다.',
  },

  // ============================================
  // 판매글 관련 에러 (SALE)
  // ============================================
  SALE_NOT_FOUND: {
    code: 'SALE_001',
    message: '판매글을 찾을 수 없습니다.',
  },
  SALE_FORBIDDEN: {
    code: 'SALE_002',
    message: '판매글을 수정하거나 삭제할 권한이 없습니다.',
  },
  SALE_ALREADY_SOLD: {
    code: 'SALE_003',
    message: '이미 판매 완료된 상품입니다.',
  },
  SALE_ALREADY_WITHDRAWN: {
    code: 'SALE_004',
    message: '탈퇴한 회원의 판매글이므로 처리할 수 없습니다.',
  },
  SALE_IN_TRADE_CANNOT_UPDATE: {
    code: 'SALE_005',
    message: '진행 중인 거래가 있어 판매글을 수정할 수 없습니다.',
  },
  SALE_IN_TRADE_CANNOT_DELETE: {
    code: 'SALE_006',
    message: '진행 중인 거래가 있어 판매글을 삭제할 수 없습니다.',
  },
  SALE_IN_TRADE_CANNOT_CHANGE_STATUS: {
    code: 'SALE_007',
    message: '진행 중인 거래가 있어 판매글 상태를 수동으로 변경할 수 없습니다.',
  },
  SALE_INVALID_CURSOR: {
    code: 'SALE_008',
    message: '잘못된 페이지 커서입니다. 목록을 새로고침해주세요.',
  },

  // ============================================
  // 리뷰 관련 에러 (REVIEW)
  // ============================================
  REVIEW_NOT_FOUND: {
    code: 'REVIEW_001',
    message: '리뷰를 찾을 수 없습니다.',
  },
  REVIEW_FORBIDDEN: {
    code: 'REVIEW_002',
    message: '리뷰를 수정하거나 삭제할 권한이 없습니다.',
  },

  // ============================================
  // 댓글 관련 에러 (COMMENT)
  // ============================================
  COMMENT_NOT_FOUND: {
    code: 'COMMENT_001',
    message: '댓글을 찾을 수 없습니다.',
  },
  COMMENT_FORBIDDEN: {
    code: 'COMMENT_002',
    message: '댓글을 수정하거나 삭제할 권한이 없습니다.',
  },

  // ============================================
  // 독서 기록 관련 에러 (READING_LOG)
  // ============================================
  READING_LOG_NOT_FOUND: {
    code: 'READING_LOG_001',
    message: '독서 기록을 찾을 수 없습니다.',
  },
  READING_LOG_DUPLICATE: {
    code: 'READING_LOG_002',
    message: '그날 이미 기록한 책입니다.',
  },

  // ============================================
  // 채팅 관련 에러 (CHAT)
  // ============================================
  CHAT_ROOM_NOT_FOUND: {
    code: 'CHAT_001',
    message: '채팅방을 찾을 수 없습니다.',
  },
  CHAT_FORBIDDEN: {
    code: 'CHAT_002',
    message: '채팅방에 접근할 권한이 없습니다.',
  },
  CHAT_SELF_CHAT: {
    code: 'CHAT_003',
    message: '자기 자신과 채팅을 시작할 수 없습니다.',
  },
  CHAT_FAILED_RETRIEVE: {
    code: 'CHAT_004',
    message: '채팅방 정보를 불러오는데 실패했습니다.',
  },
  CHAT_ALREADY_LEFT: {
    code: 'CHAT_005',
    message: '이미 나간 채팅방입니다.',
  },
  CHAT_PARTICIPANT_WITHDRAWN: {
    code: 'CHAT_006',
    message: '대화 상대방이 탈퇴하여 메시지를 전송할 수 없습니다.',
  },
  CHAT_CANNOT_LEAVE_DURING_TRADE: {
    code: 'CHAT_007',
    message: '진행 중인 거래가 있어 채팅방을 나갈 수 없습니다.',
  },
  CHAT_PARTICIPANT_INACTIVE: {
    code: 'CHAT_008',
    message: '대화방을 나갔거나 탈퇴한 사용자에게는 주문을 생성할 수 없습니다.',
  },
  CHAT_IMAGE_LIMIT_EXCEEDED: {
    code: 'CHAT_009',
    message: `이미지는 한 번에 ${MAX_CHAT_IMAGES}장까지 첨부할 수 있습니다.`,
  },

  // ============================================
  // 위시리스트 관련 에러 (WISHLIST)
  // ============================================
  WISHLIST_NOT_FOUND: {
    code: 'WISHLIST_001',
    message: '위시리스트 항목을 찾을 수 없습니다.',
  },
  WISHLIST_INVALID_STATUS: {
    code: 'WISHLIST_002',
    message: '판매 중인 상품만 위시리스트에 추가할 수 있습니다.',
  },

  // ============================================
  // 주문/결제 관련 에러 (ORDER)
  // ============================================
  ORDER_NOT_FOUND: {
    code: 'ORDER_001',
    message: '주문을 찾을 수 없습니다.',
  },
  ORDER_INVALID_STATUS: {
    code: 'ORDER_002',
    message: '유효하지 않은 주문 상태입니다.',
  },
  ORDER_FORBIDDEN: {
    code: 'ORDER_003',
    message: '주문에 접근할 권한이 없습니다.',
  },
  ORDER_CONCURRENT_MODIFICATION: {
    code: 'ORDER_004',
    message: '다른 요청에 의해 주문 상태가 변경되었습니다. 다시 시도해주세요.',
  },
  ORDER_AMOUNT_MISMATCH: {
    code: 'ORDER_005',
    message: '결제 요청 금액이 주문 금액과 일치하지 않습니다.',
  },
  ORDER_ALREADY_EXISTS: {
    code: 'ORDER_006',
    message: '해당 판매글에 이미 진행 중인 거래가 존재합니다.',
  },
  ORDER_CANNOT_CANCEL_SHIPPED: {
    code: 'ORDER_007',
    message: '배송 중에는 주문을 취소할 수 없습니다.',
  },
  ORDER_CANNOT_SELECT_SELF: {
    code: 'ORDER_008',
    message: '자기 자신을 거래 상대로 선택할 수 없습니다.',
  },
  ORDER_PAYMENT_EXPIRED: {
    code: 'ORDER_009',
    message: '결제 유효 시간(24시간)이 만료된 주문입니다.',
  },
  ORDER_DIRECT_ONLY_NOT_ALLOWED: {
    code: 'ORDER_010',
    message: '직거래 전용 판매글에는 온라인 주문을 생성할 수 없습니다.',
  },

  // ============================================
  // 거래 완료 관련 에러 (TRADE)
  // ============================================
  TRADE_COMPLETION_NOT_FOUND: {
    code: 'TRADE_001',
    message: '거래 완료 기록을 찾을 수 없습니다.',
  },
  TRADE_COMPLETION_FORBIDDEN: {
    code: 'TRADE_002',
    message: '해당 거래의 당사자가 아닙니다.',
  },
  TRADE_BUYER_CANNOT_BE_SELLER: {
    code: 'TRADE_003',
    message: '자기 자신을 거래 상대로 지정할 수 없습니다.',
  },
  SALE_ALREADY_RESERVED_FOR_OTHER: {
    code: 'TRADE_004',
    message: '이미 다른 구매자와 예약된 판매글입니다.',
  },
  SALE_NOT_RESERVED: {
    code: 'TRADE_005',
    message: '예약중인 판매글이 아닙니다.',
  },
  SALE_COMPLETED_CANNOT_CHANGE_STATUS: {
    code: 'TRADE_006',
    message: '거래 기록이 있는 판매완료 글은 상태를 되돌릴 수 없습니다.',
  },
  SALE_ALREADY_COMPLETED: {
    code: 'TRADE_007',
    message: '이미 거래가 완료된 판매글입니다.',
  },
  SALE_COMPLETED_CANNOT_DELETE: {
    code: 'TRADE_008',
    message: '거래 기록이 있는 판매글은 삭제할 수 없습니다.',
  },
  SALE_COMPLETED_CANNOT_UPDATE: {
    code: 'TRADE_009',
    message: '거래 기록이 있는 판매글은 수정할 수 없습니다.',
  },
  TRADE_COUNTERPARTY_NOT_IN_CHAT: {
    code: 'TRADE_010',
    message:
      '이 판매글로 대화한 적 없는 상대는 거래 상대로 지정할 수 없습니다.',
  },
  TRADE_CHAT_ROOM_MISMATCH: {
    code: 'TRADE_011',
    message: '이 판매글의 채팅방이 아닙니다.',
  },

  // ============================================
  // 거래 후기 관련 에러 (TRADE_REVIEW)
  // ============================================
  TRADE_REVIEW_ALREADY_EXISTS: {
    code: 'TRADE_REVIEW_001',
    message: '이미 작성된 거래 후기가 존재합니다.',
  },
  TRADE_REVIEW_EXPIRED: {
    code: 'TRADE_REVIEW_002',
    message: '거래 후기 작성 기한(14일)이 만료되었습니다.',
  },
  TRADE_REVIEW_FORBIDDEN: {
    code: 'TRADE_REVIEW_003',
    message: '거래 후기를 작성할 권한이 없습니다.',
  },
  TRADE_REVIEW_NOT_FOUND: {
    code: 'TRADE_REVIEW_004',
    message: '거래 후기를 찾을 수 없습니다.',
  },
  TRADE_REVIEW_TAG_NOT_ALLOWED: {
    code: 'TRADE_REVIEW_005',
    message: '이 거래에 사용할 수 없는 후기 태그가 포함되어 있습니다.',
  },

  // ============================================
  // 검증 에러 (VALIDATION)
  // ============================================
  VALIDATION_ERROR: {
    code: 'VALIDATION_001',
    message: '입력값이 올바르지 않습니다.',
  },

  // ============================================
  // 서버 내부 에러 (INTERNAL)
  // ============================================
  INTERNAL_ERROR: {
    code: 'INTERNAL_001',
    message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  EXTERNAL_API_ERROR: {
    code: 'INTERNAL_002',
    message: '외부 서비스 연동 중 오류가 발생했습니다.',
  },
  REQUEST_IN_PROGRESS: {
    code: 'INTERNAL_003',
    message: '동일한 요청이 처리 중입니다. 잠시 후 다시 시도해주세요.',
  },
} as const;

/**
 * 에러 코드 타입
 * ERROR_CODES 객체의 키 값들로 구성된 유니온 타입
 */
export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * 에러 정보 타입
 * code와 message를 포함하는 객체
 */
export type ErrorInfo = (typeof ERROR_CODES)[ErrorCode];
