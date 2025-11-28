import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { UsedBookSale } from '@/features/book/entities/used-book-sale.entity';
import { ReadReceipt } from '../entities/read-receipt.entity';
import { UserService } from '@/features/user/services/user.service';
import { BookService } from '@/features/book/services/book.service';
import { ChatGateway } from '../gateways/chat.gateway';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatRoom),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: BookService,
          useValue: {},
        },
        {
          provide: ChatGateway,
          useValue: {
            emitUserRejoined: jest.fn(),
            joinRoom: jest.fn(),
            notifyNewRoom: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                save: jest.fn(),
                findOne: jest.fn(),
              },
            }),
          },
        },
        {
          provide: getRepositoryToken(UsedBookSale),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ReadReceipt),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
