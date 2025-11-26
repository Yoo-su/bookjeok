// src/app/api/art-detail/[id]/route.ts
import { XMLParser } from "fast-xml-parser";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // 동적 경로의 파라미터를 가져옵니다.

    if (!id) {
      throw new Error("공연 ID가 필요합니다.");
    }

    const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr/${id}?service=${process.env.CULTURE_SERVICE_KEY}`;

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
    const parser = new XMLParser();
    const jsonData = parser.parse(xmlData);

    // KOPIS API는 결과가 없을 때 에러 대신 빈 응답을 줄 수 있습니다.
    if (!jsonData.dbs || !jsonData.dbs.db) {
      return Response.json(
        { success: false, message: "해당 ID의 공연 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: jsonData.dbs.db,
    });
  } catch (error) {
    console.error("공연 상세 조회 실패:", error);
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "공연 정보를 가져올 수 없습니다.",
      },
      { status: 500 }
    );
  }
}
