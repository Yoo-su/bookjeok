import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Column, // Column 추가
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatRoom } from './chat-room.entity';

@Entity({ name: 'chat_participants' })
@Unique(['user', 'chatRoom'])
export class ChatParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.chatParticipants)
  user: User;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.participants, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;

  // 사용자의 채팅방 참여 상태 (true: 참여중, false: 나감)
  @Column({ default: true })
  isActive: boolean;
}
