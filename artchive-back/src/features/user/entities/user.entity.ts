import { UsedBookSale } from '@/features/book/entities/used-book-sale.entity';
import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ReadReceipt } from '@/features/chat/entities/read-receipt.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'users' })
@Unique(['provider', 'providerId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column({ name: 'providerId' })
  providerId: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ name: 'profileImageUrl', nullable: true })
  profileImageUrl: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @OneToMany(() => UsedBookSale, (sale) => sale.user)
  usedBookSales: UsedBookSale[];

  @OneToMany(() => ChatParticipant, (participant) => participant.user)
  chatParticipants: ChatParticipant[];

  @OneToMany(() => ReadReceipt, (receipt) => receipt.user)
  readReceipts: ReadReceipt[];
}
