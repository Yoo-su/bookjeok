export const PATHS = {
  HOME: "/home",
  LOGIN: "/login",
  BOOK_SEARCH: "/book/search",
  BOOK_DETAIL: (isbn: string) => `/book/${isbn}/detail`,
  BOOK_SELL: (isbn: string) => `/book/${isbn}/sell`,
  BOOK_SALE_DETAIL: (id: string) => `/book/sale/${id}`,
  ART_DETAIL: (id: string) => `/art/${id}`,
  MY_PAGE_SALES: "/my-page/sales",
  MY_PAGE_SALES_EDIT: (id: string) => `/my-page/sales/${id}/edit`,
} as const;
