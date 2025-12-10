import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  // NestJS에 내장된 Logger를 사용합니다. 'HTTP'는 로그의 컨텍스트(출처)를 나타냅니다.
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req; // 요청 메서드와 URL을 가져옵니다.
    const userAgent = req.get('user-agent') || '';

    // 응답이 끝났을 때(finish) 로그를 기록합니다.
    // 이렇게 해야 응답 상태 코드(statusCode)까지 기록할 수 있습니다.
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`${method} ${originalUrl} ${statusCode} - ${userAgent}`);
    });

    // 다음 미들웨어나 컨트롤러로 요청을 전달합니다.
    next();
  }
}
