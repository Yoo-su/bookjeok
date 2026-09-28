type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * 구조화 데이터(JSON-LD) 주입 공통 컴포넌트
 * - JSON.stringify는 "<"를 이스케이프하지 않아, 사용자 입력의 "</script>"가 스크립트 태그를 탈출
 * - 컴포넌트별로 치환을 반복하면 JSON-LD 추가 시 누락되므로 주입 지점을 단일화
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // 백슬래시를 이중으로 써야 6글자 JSON 이스케이프가 된다. 하나면 JS가 "<"로 읽어 치환이 무효
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
