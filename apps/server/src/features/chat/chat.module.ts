import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/features/auth/auth.module';
import { BookModule } from '@/features/book/book.module';
import { Order } from '@/features/order/entities/order.entity';
import { UsedBookSaleModule } from '@/features/used-book-sale/used-book-sale.module';
import { UserModule } from '@/features/user/user.module';

import { ChatController } from './controllers/chat.controller';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatCleanupListener } from './listeners/chat-cleanup.listener';
import { ChatService } from './services/chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatParticipant, ChatMessage, Order]),
    AuthModule,
    UserModule,
    BookModule,
    UsedBookSaleModule,
  ],
  providers: [ChatGateway, ChatService, ChatCleanupListener],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
