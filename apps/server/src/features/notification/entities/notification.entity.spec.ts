import { NotificationType } from '@bookjeok/core';
import { getMetadataArgsStorage } from 'typeorm';

import { Notification } from '@/features/notification/entities/notification.entity';

it('notifications.type은 core enum을 같은 DB enum 컬럼 정의로 사용한다', () => {
  const column = getMetadataArgsStorage().columns.find(
    (entry) => entry.target === Notification && entry.propertyName === 'type',
  );
  expect(column?.options).toEqual({ type: 'enum', enum: NotificationType });
});
