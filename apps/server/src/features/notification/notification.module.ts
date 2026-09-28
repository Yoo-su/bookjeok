import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '@/features/user/user.module';

import { NotificationController } from './controllers/notification.controller';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './gateways/notification.gateway';
import { NotificationCleanupListener } from './listeners/notification-cleanup.listener';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), UserModule, JwtModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationCleanupListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
