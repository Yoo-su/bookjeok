import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { MODEL_NAME } from '../constants';
import { getPromptText } from '../utils/get-prompt-text';

@Injectable()
export class LlmService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  // ConfigService를 주입받아 API 키를 안전하게 사용합니다.
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
    });
  }

  /**
   * 책 제목과 저자를 기반으로 AI 요약 및 후기를 생성합니다.
   * @param title - 책 제목
   * @param author - 저자
   * @returns 생성된 요약 텍스트
   */
  async generateBookSummary(title: string, author: string): Promise<string> {
    try {
      // LLM에게 보낼 프롬프트를 구체적으로 작성합니다.
      const prompt = getPromptText(title, author);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API 호출에 실패했습니다:', error);
      throw new InternalServerErrorException(
        'AI 요약 정보를 생성하는 데 실패했습니다.',
      );
    }
  }
}
