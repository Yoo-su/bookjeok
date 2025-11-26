export const API_PATHS = {
  auth: {
    login: (provider: "naver" | "kakao") => `/auth/${provider}`,
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    profile: "/user/profile",
  },
  book: {
    list: "/book-list",
    detail: "/book-detail",
    sales: "/book/sales",
    sale: "/book/sale",
    mySales: "/user/my-sales",
    saleStatus: (saleId: number) => `/book/sales/${saleId}/status`,
    saleDetail: (saleId: string) => `/book/sales/${saleId}`,
    relatedSales: (isbn: string) => `/book/${isbn}/sales`,
    updateSale: (saleId: number) => `/book/sales/${saleId}`,
    deleteSale: (saleId: number) => `/book/sales/${saleId}`,
    recentSales: "/book/sales/recent",
    summary: "/llm/book-summary",
  },
  art: {
    list: "/art-list",
    detail: (artId: string) => `/art-detail/${artId}`,
  },
  chat: {
    rooms: "/chat/rooms",
    room: (roomId: number) => `/chat/rooms/${roomId}`,
    messages: (roomId: number) => `/chat/rooms/${roomId}/messages`,
    read: (roomId: number) => `/chat/rooms/${roomId}/read`,
  },
};
