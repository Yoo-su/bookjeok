import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { ChatRoom } from './chat-room.entity';

export enum ChatMessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  TRADE_STATUS = 'TRADE_STATUS',
  TRADE_ACTION = 'TRADE_ACTION',
  IMAGE = 'IMAGE',
}

// 방별 최신순 조회(마지막 메시지, 커서 페이지네이션, 안 읽음 집계)가
// 모든 채팅 쿼리의 기본 접근 경로이므로 복합 인덱스 적용
@Index('idx_chat_messages_room_created_at', ['chatRoom', 'createdAt'])
// 안 읽음 집계는 내가 보내지 않은 메시지를 방 단위로 스캔
// (참여자의 lastReadMessageId 워터마크 이후 메시지를 세는 경로)
@Index('idx_chat_messages_room_sender', ['chatRoom', 'sender'])
// 위 인덱스는 senderId가 선행이 아니라 탈퇴 시 외래키 검사를 받아주지 못한다.
@Index('IDX_chat_messages_senderId', ['sender'])
@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ChatMessageType,
    default: ChatMessageType.TEXT,
  })
  type: ChatMessageType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  sender: User | null;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;
}
