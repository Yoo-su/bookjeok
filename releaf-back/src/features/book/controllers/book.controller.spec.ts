import { Test, TestingModule } from '@nestjs/testing';

import { BookService } from '../services/book.service';
import { BookController } from './book.controller';

describe('BookController', () => {
  let controller: BookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: {
            createUsedBookSale: jest.fn(),
            searchSales: jest.fn(),
            updateSaleStatus: jest.fn(),
            findRecentSales: jest.fn(),
            findSaleById: jest.fn(),
            findSalesByIsbn: jest.fn(),
            updateUsedBookSale: jest.fn(),
            deleteUsedBookSale: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
