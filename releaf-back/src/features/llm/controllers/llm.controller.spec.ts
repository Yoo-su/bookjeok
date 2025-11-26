import { Test, TestingModule } from '@nestjs/testing';

import { LlmService } from '../services/llm.service';
import { LlmController } from './llm.controller';

describe('LlmController', () => {
  let controller: LlmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [LlmService],
    }).compile();

    controller = module.get<LlmController>(LlmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
