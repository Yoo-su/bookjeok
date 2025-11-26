import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmController } from './controllers/llm.controller';
import { LlmService } from './services/llm.service';

@Module({
  imports: [ConfigModule],
  controllers: [LlmController],
  providers: [LlmService],
})
export class LlmModule {}
