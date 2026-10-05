import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../services/chat.service');
import { JwtService } from '@nestjs/jwt';

import { UserService } from '@/features/user/services/user.service';

import { ChatService } from '../services/chat.service';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: {
    saveMessage: jest.Mock;
    filterJoinableRoomIds: jest.Mock;
  };

  beforeEach(async () => {
    chatService = {
      saveMessage: jest.fn(),
      filterJoinableRoomIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: chatService,
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleSendMessage', () => {
    const savedMessage = { id: 1, content: '안녕하세요' };
    const user = { id: 10 };
    const client = { data: { user } };
    let emit: jest.Mock;

    beforeEach(() => {
      emit = jest.fn();
      gateway.server = { to: jest.fn(() => ({ emit })) } as never;
      chatService.saveMessage.mockResolvedValue(savedMessage);
    });

    it('상관 ID를 브로드캐스트와 응답에 그대로 되돌려준다', async () => {
      const result = await gateway.handleSendMessage(
        { roomId: 3, content: '안녕하세요', clientMessageId: 'cid-1' },
        client as never,
      );

      expect(emit).toHaveBeenCalledWith('newMessage', {
        ...savedMessage,
        clientMessageId: 'cid-1',
      });
      expect(result).toEqual({
        status: 'ok',
        message: { ...savedMessage, clientMessageId: 'cid-1' },
      });
      // 저장에는 관여하지 않는 일회성 필드
      expect(chatService.saveMessage).toHaveBeenCalledWith(
        '안녕하세요',
        3,
        user,
        undefined,
      );
    });

    it('상관 ID가 없으면 메시지에 필드를 붙이지 않는다', async () => {
      await gateway.handleSendMessage(
        { roomId: 3, content: '안녕하세요' },
        client as never,
      );

      expect(emit).toHaveBeenCalledWith('newMessage', savedMessage);
    });

    it('허용 길이를 넘는 상관 ID는 무시한다', async () => {
      await gateway.handleSendMessage(
        {
          roomId: 3,
          content: '안녕하세요',
          clientMessageId: 'x'.repeat(65),
        },
        client as never,
      );

      expect(emit).toHaveBeenCalledWith('newMessage', savedMessage);
    });
  });
  describe('handleJoinRooms', () => {
    const user = { id: 10 };

    it('참여자인 방에만 소켓을 조인시킨다', async () => {
      const join = jest.fn();
      const client = { id: 'sock-1', data: { user }, join, rooms: new Set() };
      chatService.filterJoinableRoomIds.mockResolvedValue([3]);

      const result = await gateway.handleJoinRooms([3, 99], client as never);

      expect(chatService.filterJoinableRoomIds).toHaveBeenCalledWith(
        [3, 99],
        10,
      );
      expect(join).toHaveBeenCalledWith(['3']);
      expect(result).toEqual({ status: 'ok', joinedRooms: [3] });
    });

    it('참여 중인 방이 하나도 없으면 조인하지 않는다', async () => {
      const join = jest.fn();
      const client = { id: 'sock-1', data: { user }, join, rooms: new Set() };
      chatService.filterJoinableRoomIds.mockResolvedValue([]);

      const result = await gateway.handleJoinRooms([99], client as never);

      expect(join).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok', joinedRooms: [] });
    });

    it('정수가 아닌 방 ID는 조회 전에 걸러낸다', async () => {
      const client = {
        id: 'sock-1',
        data: { user },
        join: jest.fn(),
        rooms: new Set(),
      };
      chatService.filterJoinableRoomIds.mockResolvedValue([]);

      await gateway.handleJoinRooms(
        [3, '4' as never, 1.5, NaN],
        client as never,
      );

      expect(chatService.filterJoinableRoomIds).toHaveBeenCalledWith([3], 10);
    });
  });

  describe('handleStartTyping', () => {
    const user = { id: 10, nickname: '홍길동' };

    it('참여하지 않은 방에는 입력중 표시를 보내지 않는다', () => {
      const to = jest.fn();
      const client = { data: { user }, rooms: new Set<string>(), to };

      gateway.handleStartTyping({ roomId: 7 }, client as never);

      expect(to).not.toHaveBeenCalled();
    });

    it('참여한 방에는 입력중 표시를 보낸다', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      const client = { data: { user }, rooms: new Set(['7']), to };

      gateway.handleStartTyping({ roomId: 7 }, client as never);

      expect(to).toHaveBeenCalledWith('7');
      expect(emit).toHaveBeenCalledWith('typing', {
        roomId: 7,
        nickname: '홍길동',
        isTyping: true,
      });
    });
  });
  describe('emitNewMessage', () => {
    it('서버 메시지를 방에 직렬화해 브로드캐스트한다', () => {
      const emit = jest.fn();
      const to = jest.fn(() => ({ emit }));
      gateway.server = { to } as never;
      const message = { id: 5, content: '거래 완료' };

      gateway.emitNewMessage(7, message as never);

      expect(to).toHaveBeenCalledWith('7');
      expect(emit).toHaveBeenCalledWith('newMessage', message);
    });

    it('게이트웨이 초기화 전이면 건너뛴다', () => {
      gateway.server = undefined as never;

      expect(() => gateway.emitNewMessage(7, { id: 5 } as never)).not.toThrow();
    });
  });
});
