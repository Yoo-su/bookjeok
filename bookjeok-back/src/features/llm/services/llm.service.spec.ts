import { Test, TestingModule } from '@nestjs/testing';

import { LlmService } from './llm.service';
import { ConfigService } from '@nestjs/config';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
