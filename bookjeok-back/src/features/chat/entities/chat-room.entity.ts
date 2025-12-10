import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { UsedBookSale } from '@/features/book/entities/used-book-sale.entity';
import { ChatParticipant } from './chat-participant.entity';
import { ChatMessage } from './chat-message.entity';

@Entity({ name: 'chat_rooms' })
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UsedBookSale, (sale) => sale.chatRooms, {
    onDelete: 'CASCADE',
  })
  usedBookSale: UsedBookSale;

  @OneToMany(() => ChatParticipant, (participant) => participant.chatRoom)
  participants: ChatParticipant[];

  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[];

  @UpdateDateColumn()
  updatedAt: Date;
}
