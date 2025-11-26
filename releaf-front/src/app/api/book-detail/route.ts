import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 클라이언트에서 보낸 쿼리 파라미터를 추출합니다.
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get("isbn");

    const response = await axios.get(
      `https://openapi.naver.com/v1/search/book_adv.json?d_isbn=${isbn}`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("책 상세정보 조회 실패:", error);

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
