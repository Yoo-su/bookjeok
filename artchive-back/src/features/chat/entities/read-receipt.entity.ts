import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity({ name: 'read_receipts' })
@Unique(['user', 'message']) // 한 유저는 한 메시지에 대해 하나의 읽음 기록만 가질 수 있습니다.
export class ReadReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.readReceipts)
  user: User;

  @ManyToOne(() => ChatMessage, (message) => message.readReceipts, {
    onDelete: 'CASCADE',
  })
  message: ChatMessage;
}
