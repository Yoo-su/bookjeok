import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 클라이언트에서 보낸 쿼리 파라미터를 추출합니다.
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const display = searchParams.get("display");
    const start = searchParams.get("start");
    const sort = searchParams.get("sort");

    const response = await axios.get(
      "https://openapi.naver.com/v1/search/book.json",
      {
        params: {
          query,
          display,
          start,
          sort,
        },
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    // 성공적으로 데이터를 받으면 클라이언트에 반환합니다.
    // axios는 응답 데이터를 data 속성에 담아서 반환합니다.
    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    // 서버 측에서 발생한 에러를 콘솔에 기록합니다.
    console.error("책 목록 조회 실패:", error);

    // 클라이언트에 에러 메시지를 포함한 응답을 보냅니다.
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
