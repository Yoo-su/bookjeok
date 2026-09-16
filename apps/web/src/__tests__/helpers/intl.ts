import koMessages from "@/shared/i18n/messages/ko.json";

/**
 * 실제 ko 카탈로그를 그대로 태우는 next-intl 목.
 *
 * 키 맵을 테스트마다 손으로 복사하면 카탈로그와 어긋나도 테스트가 통과합니다.
 * 이 목은 없는 키를 키 문자열 그대로 돌려주므로 오타나 누락이 바로 드러납니다.
 *
 * ```ts
 * vi.mock("next-intl", async () => {
 *   const { createIntlMock } = await import("@/__tests__/helpers/intl");
 *   return createIntlMock();
 * });
 * ```
 */
export const createIntlMock = (locale = "ko") => ({
  useLocale: () => locale,
  useTranslations: (namespace?: string) => {
    const translate = (key: string, values?: Record<string, unknown>) => {
      const path = [
        ...(namespace ? namespace.split(".") : []),
        ...key.split("."),
      ];
      const message = path.reduce<unknown>(
        (node, segment) => (node as Record<string, unknown>)?.[segment],
        koMessages,
      );

      if (typeof message !== "string") return key;

      return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
        values?.[name] === undefined ? placeholder : String(values[name]),
      );
    };

    translate.rich = (key: string, values?: Record<string, unknown>) =>
      translate(key, values);

    return translate;
  },
});
