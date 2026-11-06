import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  QueryRunner,
  RemoveEvent,
  TransactionCommitEvent,
  TransactionRollbackEvent,
  UpdateEvent,
} from 'typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { UsedBookSaleService } from '@/features/used-book-sale/services/used-book-sale.service';

@Injectable()
export class UsedBookSaleCacheSubscriber
  implements EntitySubscriberInterface<UsedBookSale>, OnModuleInit
{
  private readonly pending = new WeakSet<QueryRunner>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly saleService: UsedBookSaleService,
  ) {}

  onModuleInit(): void {
    this.dataSource.subscribers.push(this);
  }

  listenTo(): typeof UsedBookSale {
    return UsedBookSale;
  }

  afterInsert({ queryRunner }: Pick<InsertEvent<UsedBookSale>, 'queryRunner'>) {
    return this.saleChanged(queryRunner);
  }

  afterUpdate(
    event: Pick<
      UpdateEvent<UsedBookSale>,
      'entity' | 'queryRunner' | 'updatedColumns' | 'updatedRelations'
    >,
  ) {
    const properties = event.updatedColumns.length
      ? event.updatedColumns.map((column) => column.propertyName)
      : Object.keys(event.entity ?? {});
    if (
      event.updatedRelations.length === 0 &&
      properties.length > 0 &&
      properties.every((key) => key === 'viewCount' || key === 'updatedAt')
    ) {
      return;
    }
    return this.saleChanged(event.queryRunner);
  }

  afterRemove({ queryRunner }: Pick<RemoveEvent<UsedBookSale>, 'queryRunner'>) {
    return this.saleChanged(queryRunner);
  }

  afterTransactionCommit({ queryRunner }: TransactionCommitEvent) {
    if (!queryRunner.isTransactionActive && this.pending.delete(queryRunner)) {
      return this.saleService.invalidateMarketCache();
    }
  }

  afterTransactionRollback({ queryRunner }: TransactionRollbackEvent): void {
    if (!queryRunner.isTransactionActive) this.pending.delete(queryRunner);
  }

  private saleChanged(queryRunner: QueryRunner) {
    if (queryRunner.isTransactionActive) {
      this.pending.add(queryRunner);
      return;
    }
    return this.saleService.invalidateMarketCache();
  }
}
