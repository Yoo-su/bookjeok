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

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('채팅 (Chat)')
@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 내 채팅방 목록 조회
  @Get('rooms')
  @ApiOperation({
    summary: '내 채팅방 목록 조회',
    description: '참여 중인 모든 채팅방 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '채팅방 목록을 반환합니다.' })
  async getMyChatRooms(@CurrentUser() user: User) {
    const userId = user.id;
    return await this.chatService.getChatRooms(userId);
  }

  // 특정 채팅방 메시지 조회 (페이지네이션)
  @Get('rooms/:roomId/messages')
  @ApiOperation({
    summary: '채팅 메시지 조회',
    description: '특정 채팅방의 메시지 목록을 페이지네이션으로 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 메시지 수 (기본값: 20)',
  })
  @ApiResponse({ status: 200, description: '메시지 목록을 반환합니다.' })
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
  /**
   * 특정 판매글에 대한 채팅방을 찾거나 생성하는 API
   */
  @Post('rooms')
  @ApiOperation({
    summary: '채팅방 생성 또는 조회',
    description: '특정 판매글에 대한 채팅방을 찾거나, 없으면 새로 생성합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        saleId: { type: 'number', example: 1, description: '판매글 ID' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '채팅방 정보를 반환합니다.' })
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
  /**
   * 특정 채팅방의 메시지를 모두 읽음으로 처리하는 API
   */
  @Patch('rooms/:roomId/read')
  @ApiOperation({
    summary: '메시지 읽음 처리',
    description: '특정 채팅방의 모든 메시지를 읽음 상태로 변경합니다.',
  })
  @ApiResponse({ status: 200, description: '성공적으로 처리되었습니다.' })
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
  /**
   * 특정 채팅방을 나가는 API
   */
  @Delete('rooms/:roomId')
  @ApiOperation({
    summary: '채팅방 나가기',
    description: '채팅방에서 나갑니다.',
  })
  @ApiResponse({ status: 200, description: '성공적으로 나갔습니다.' })
  async leaveRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    return await this.chatService.leaveRoom(roomId, userId);
  }
}
