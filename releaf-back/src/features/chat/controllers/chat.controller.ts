import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from '../services/chat.service';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 내 채팅방 목록 조회
  @Get('rooms')
  async getMyChatRooms(@CurrentUser() user: User) {
    const userId = user.id;
    return await this.chatService.getChatRooms(userId);
  }

  // 특정 채팅방 메시지 조회 (페이지네이션)
  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return await this.chatService.getChatMessages(roomId, page, limit);
  }

  /**
   * 특정 판매글에 대한 채팅방을 찾거나 생성하는 API
   */
  @Post('rooms')
  async getChatRoom(
    @Body('saleId', ParseIntPipe) saleId: number,
    @CurrentUser() user: User,
  ) {
    const buyerId = user.id;
    return await this.chatService.getChatRoom(saleId, buyerId);
  }

  /**
   * 특정 채팅방의 메시지를 모두 읽음으로 처리하는 API
   */
  @Patch('rooms/:roomId/read')
  async markAsRead(
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    return await this.chatService.markMessagesAsRead(roomId, userId);
  }

  /**
   * 특정 채팅방을 나가는 API
   */
  @Delete('rooms/:roomId')
  async leaveRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    return await this.chatService.leaveRoom(roomId, userId);
  }
}
