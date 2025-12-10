import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../services/chat.service');
import { ChatService } from '../services/chat.service';
import { ChatGateway } from './chat.gateway';

import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/features/user/services/user.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: {},
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
});
