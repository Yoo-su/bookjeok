import { NextRequest, NextResponse } from "next/server";

import { fetchBookDetail } from "@/features/book/server/service";

export async function GET(request: NextRequest) {
  try {
    // 클라이언트에서 보낸 쿼리 파라미터를 추출합니다.
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get("isbn");

    if (!isbn) {
      return NextResponse.json(
        { success: false, message: "ISBN is required" },
        { status: 400 }
      );
    }

    const result = await fetchBookDetail(isbn);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "책 목록을 가져오는 데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
