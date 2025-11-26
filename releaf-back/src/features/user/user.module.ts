import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './services/user.service';
import { User } from './entities/user.entity';
import { UserController } from './controllers/user.controller';
import { UsedBookSale } from '../book/entities/used-book-sale.entity';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Book } from '../book/entities/book.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UsedBookSale,
      ChatParticipant,
      Wishlist,
      Book,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
