// app/api/art-list/route.ts
import { XMLParser } from "fast-xml-parser";
import { NextRequest } from "next/server";

import { CityCode, Genre, PrfState } from "@/features/art/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const cpage = searchParams.get("cpage");
    const rows = searchParams.get("rows");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const genreCode = searchParams.get("genreCode") as Genre;
    const prfstate = searchParams.get("prfstate") as PrfState;
    const signgucode = searchParams.get("signgucode") as CityCode;

    // 외부 API 호출
    const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${process.env.CULTURE_SERVICE_KEY}&stdate=${startDate}&eddate=${endDate}&cpage=${cpage}&rows=${rows}&prfstate=${prfstate}&signgucode=${signgucode}&shcate=${genreCode}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const xmlData = await response.text();

    // XML → JSON 변환
    const parser = new XMLParser();
    const jsonData = parser.parse(xmlData);

    const result = jsonData.dbs?.db ?? [];

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("공연 목록 조회 실패:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "공연 목록을 가져올 수 없습니다.",
      },
      { status: 500 }
    );
  }
}
