import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // 라이브러리 타입 정의에 따라 필수 콜백 함수들을 추가합니다.
      // 토큰 생성 전 실행: 파일 경로명(pathname)을 그대로 사용하도록 설정하고, 허용할 파일 타입도 지정할 수 있습니다.
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
          pathname,
          // 예: 토큰에 추가적인 정보를 담아 onUploadCompleted에서 사용할 수 있습니다.
          // token: `user_123_${pathname}`,
        };
      },
      // 업로드 완료 후 실행: 서버 로그를 남기거나 DB를 업데이트할 수 있습니다.
      onUploadCompleted: async ({ blob, tokenPayload: token }) => {
        console.log("blob upload completed", blob, token);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
