import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { BookModule } from '../book/book.module';
import { UsedBookSale } from '../book/entities/used-book-sale.entity';
import { ReadReceipt } from './entities/read-receipt.entity';
import { SocketAuthGuard } from './guards/socket-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      ChatParticipant,
      ChatMessage,
      UsedBookSale,
      ReadReceipt,
    ]),
    AuthModule,
    UserModule,
    BookModule,
  ],
  providers: [ChatGateway, ChatService, SocketAuthGuard],
  controllers: [ChatController],
})
export class ChatModule {}
