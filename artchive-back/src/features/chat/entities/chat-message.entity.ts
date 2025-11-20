import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatRoom } from './chat-room.entity';
import { ReadReceipt } from './read-receipt.entity';

@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  sender: User | null;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;

  @OneToMany(() => ReadReceipt, (receipt) => receipt.message)
  readReceipts: ReadReceipt[];
}
