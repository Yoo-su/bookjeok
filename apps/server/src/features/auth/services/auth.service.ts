import * as crypto from 'node:crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';

import { User } from '@/features/user/entities/user.entity';
import { UserService } from '@/features/user/services/user.service';
import { NicknameGenerator } from '@/features/user/utils/nickname-generator';
import { BusinessException } from '@/shared/exceptions';
import { MailService } from '@/shared/mail/mail.service';

import { TOKEN_EXPIRY } from '../auth.constants';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * 계정이 없을 때도 비교 비용을 치르기 위한 더미 해시.
 * 값 자체는 의미가 없고, bcrypt 비교 시간을 맞추는 용도다.
 */
const DUMMY_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService,
  ) {
    // 설정 누락은 요청이 아니라 기동 시점에 드러나야 한다. 요청 중에 던지면
    // 로그인 시도 전까지 배포가 멀쩡해 보인다.
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error(
        'JWT_SECRET 또는 JWT_REFRESH_SECRET이 설정되지 않았습니다.',
      );
    }

    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
  }

  /**
   * 소셜 로그인 정보를 검증하고 유저를 생성하거나 반환합니다.
   * - 기존 유저: 누락된 소셜 정보 보강 후 반환
   * - 신규 유저: 랜덤 닉네임 + 기본 프로필 이미지 번호 + 소셜 프로필 정보(이름, 성별, 연령대, 이메일 인증)로 생성
   * @param socialLoginDto 소셜 로그인 정보
   * @returns 유저 정보
   */
  async validateUser(socialLoginDto: {
    provider: string;
    providerId: string;
    nickname: string;
    profileImg?: string;
    name?: string;
    email?: string;
    gender?: string;
    ageRange?: string;
  }) {
    const { provider, providerId, email } = socialLoginDto;
    const user = await this.userService.findByProviderId(provider, providerId);

    // 탈퇴 계정이면 여기서 끊는다. 지금은 withdraw()가 providerId를
    // `deleted_{id}_{ts}`로 덮어써 위 조회가 탈퇴 계정을 찾지 못하지만,
    // 그 익명화에 기대면 아래 신규 생성 경로로 흘러 (provider, providerId)
    // 유니크 제약을 때린다. 조건이 아니라 분기로 막아 둔다.
    if (user?.deletedAt) {
      throw new BusinessException('WITHDRAWN_USER', HttpStatus.UNAUTHORIZED);
    }

    if (user) {
      return user;
    }

    // 신규 유저인 경우: 랜덤 닉네임 생성 (중복 시 재시도) + 기본 프로필 이미지 번호 부여
    let randomNickname = NicknameGenerator.generate();
    let isUnique = false;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    while (!isUnique && retryCount < MAX_RETRIES) {
      if (retryCount > 0) {
        // 첫 시도 실패 시 뒤에 랜덤 숫자(1000~9999)를 붙여 중복 확률 최소화
        const suffix = Math.floor(1000 + Math.random() * 9000);
        randomNickname = `${NicknameGenerator.generate()}${suffix}`;
      }

      const existingUser =
        await this.userService.findByNickname(randomNickname);
      if (!existingUser) {
        isUnique = true;
      } else {
        retryCount++;
      }
    }

    if (!isUnique) {
      // 5번 재시도 후에도 중복이면 타임스탬프를 붙여서 강제 유니크 생성
      randomNickname = `${NicknameGenerator.generate()}${Date.now().toString().slice(-4)}`;
    }

    const profileNumber = NicknameGenerator.getRandomProfileNumber();

    // 이메일 중복 체크 (다른 계정에서 이미 사용 중인 이메일인 경우 소셜 계정에 연결하지 않고 생성)
    let safeEmail = email;
    if (safeEmail) {
      const existingEmailUser = await this.userService.findByEmail(safeEmail);
      if (existingEmailUser) {
        safeEmail = undefined;
      }
    }

    const newUser = await this.userService.createUser({
      ...socialLoginDto,
      email: safeEmail,
      nickname: randomNickname,
      isEmailVerified: !!safeEmail,
      profileImageUrl: `default_profile${profileNumber}`,
    });
    return newUser;
  }

  /**
   * 유저 ID와 닉네임, 권한, 토큰 버전을 기반으로 Access Token과 Refresh Token을 생성합니다.
   * @param userId 유저 ID
   * @param userNickname 유저 닉네임
   * @param role 유저 권한
   * @param tokenVersion 토큰 버전 (무효화용)
   * @returns Access Token과 Refresh Token
   */
  async getTokens(
    userId: number,
    userNickname: string,
    role: 'USER' | 'ADMIN',
    tokenVersion: number = 0,
  ) {
    // 두 토큰 모두 tokenVersion을 싣는다. 액세스 토큰에 없으면 로그아웃 뒤에도
    // 만료(15분)까지 API·소켓 요청이 통과한다
    const payload: JwtPayload = {
      sub: userId,
      nickname: userNickname,
      role,
      tokenVersion,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * 인증에 성공한 유저에게 세션(토큰 쌍)을 발급합니다.
   * 소셜 로그인과 이메일 로그인이 함께 씁니다.
   * @param user 유저 엔티티
   * @returns 토큰과 유저 정보
   */
  private async issueSession(user: User) {
    const { accessToken, refreshToken } = await this.getTokens(
      user.id,
      user.nickname,
      user.role,
      user.tokenVersion ?? 0,
    );

    // 마지막 활동 시간 업데이트
    await this.userService.updateLastActiveAt(user.id);

    return { accessToken, refreshToken, user };
  }

  /**
   * 소셜 로그인 완료 후 URL에 JWT를 노출하지 않기 위해 1회용 인증 티켓(Code)을 생성합니다.
   * @param user 인증된 유저 엔티티
   * @returns 60초간 유효한 1회용 티켓 문자열
   */
  async createAuthTicket(user: User): Promise<string> {
    const {
      accessToken,
      refreshToken,
      user: loggedInUser,
    } = await this.issueSession(user);

    const safeUser = {
      id: loggedInUser.id,
      nickname: loggedInUser.nickname,
      name: loggedInUser.name,
      email: loggedInUser.email,
      handle: loggedInUser.handle,
      profileImageUrl: loggedInUser.profileImageUrl,
      role: loggedInUser.role,
      isReadingLogPublic: loggedInUser.isReadingLogPublic,
      isEmailVerified: loggedInUser.isEmailVerified,
    };

    const ticket = crypto.randomUUID();
    const payload = {
      accessToken,
      refreshToken,
      user: safeUser,
    };

    // 60초 TTL로 임시 저장
    await this.cacheManager.set(`auth_ticket:${ticket}`, payload, 60000);
    return ticket;
  }

  /**
   * 1회용 인증 티켓을 검증하고 즉시 소모(삭제)하여 토큰 정보를 교환합니다.
   * @param ticket 1회용 인증 티켓
   */
  async exchangeTicket(ticket: string) {
    if (!ticket) {
      throw new BusinessException(
        'INVALID_OR_EXPIRED_TICKET',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const cacheKey = `auth_ticket:${ticket}`;
    const payload = await this.cacheManager.get<{
      accessToken: string;
      refreshToken: string;
      user: Record<string, unknown>;
    }>(cacheKey);

    if (!payload) {
      throw new BusinessException(
        'INVALID_OR_EXPIRED_TICKET',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 1회용 소모 (재사용 방지를 위해 즉시 삭제)
    await this.cacheManager.del(cacheKey);
    return payload;
  }

  /**
   * Refresh Token을 사용하여 새로운 토큰을 발급합니다.
   * @param userId 유저 ID
   * @param nickname 유저 닉네임
   * @param role 유저 권한
   * @param tokenVersion 현재 유저의 토큰 버전
   * @returns 새로운 Access Token과 Refresh Token
   */
  async refresh(
    userId: number,
    nickname: string,
    role: 'USER' | 'ADMIN',
    tokenVersion: number = 0,
  ) {
    // 토큰 갱신 시 마지막 활동 시간도 업데이트
    await this.userService.updateLastActiveAt(userId);
    return await this.getTokens(userId, nickname, role, tokenVersion);
  }

  /**
   * 사용자의 토큰 버전을 증가시켜 기존 발급된 모든 토큰(액세스·리프레시)을 즉시 무효화(로그아웃)합니다.
   * @param userId 유저 ID
   */
  async logout(userId: number): Promise<void> {
    await this.userService.incrementTokenVersion(userId);
  }

  /**
   * 이메일 회원가입을 처리합니다.
   * @param registerDto 회원가입 정보
   * @returns 생성된 유저
   */
  async register(registerDto: {
    email: string;
    password: string;
    nickname: string;
    name: string;
    gender?: string;
    ageRange?: string;
  }) {
    const { email, password, nickname, name, gender, ageRange } = registerDto;

    // 1. 이메일 중복 체크
    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new BusinessException('EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
    }

    // 2. 닉네임 중복 체크
    const isNicknameAvailable =
      await this.userService.checkNicknameAvailability(nickname);
    if (!isNicknameAvailable) {
      throw new BusinessException(
        'NICKNAME_ALREADY_EXISTS',
        HttpStatus.CONFLICT,
      );
    }

    // 3. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 인증 토큰 생성
    const verificationToken = crypto.randomUUID();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 5. 유저 생성 (미인증 상태로 생성)
    const newUser = await this.userService.createEmailUser(
      email,
      hashedPassword,
      nickname,
      name,
      gender,
      ageRange,
      verificationToken,
      verificationExpiresAt,
    );

    // 6. 인증 메일 비동기 발송
    this.mailService
      .sendVerificationEmail(email, nickname, verificationToken)
      .catch((err) => this.logger.error('회원가입 인증 메일 발송 실패:', err));

    return newUser;
  }

  /**
   * 이메일 인증 토큰을 검증합니다.
   * @param token 인증 토큰
   */
  async verifyEmail(token: string) {
    const user = await this.userService.verifyEmailToken(token);
    return {
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  /**
   * 인증 메일을 재발송합니다.
   * @param userId 사용자 ID
   */
  async resendVerificationEmail(userId: number) {
    await this.userService.resendVerificationEmail(userId);
    return {
      success: true,
      message: '인증 메일이 발송되었습니다.',
    };
  }

  /**
   * 이메일 로그인을 처리합니다.
   * @param loginDto 로그인 정보
   * @returns 토큰과 유저 정보
   */
  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);

    // 1. 계정이 없거나 탈퇴한 계정이어도 해시 비교를 한 번 돌린다. 곧바로 던지면 응답 시간
    //    차이만으로 가입된 이메일인지 알아낼 수 있다.
    if (!user?.password || user.deletedAt) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

      // 소셜 계정은 비밀번호 로그인 자체가 불가능하므로 안내가 필요하다.
      // (이 경우에만 계정 존재가 드러나지만, 대안이 "로그인 불가"뿐이다)
      if (user && !user.password && !user.deletedAt) {
        throw new BusinessException(
          'SOCIAL_LOGIN_USER',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new BusinessException(
        'INVALID_CREDENTIALS',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 2. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BusinessException(
        'INVALID_CREDENTIALS',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 3. 토큰 발급
    return await this.issueSession(user);
  }
}
