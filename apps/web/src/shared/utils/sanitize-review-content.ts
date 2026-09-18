import sanitizeHtml from "sanitize-html";

// 리뷰 본문은 Tiptap 에디터가 생성한 HTML이지만 API로 직접 POST하면 임의의 HTML을
// 저장할 수 있으므로 렌더링 직전에 항상 sanitize
//
// jsdom 기반 sanitizer(isomorphic-dompurify)는 서버 번들에 jsdom을 포함시켜
// Vercel 런타임에서 ERR_REQUIRE_ESM으로 SSR 실패. sanitize-html은 DOM 없이 동작

// Tiptap 확장(StarterKit, Link, Underline, Highlight, TextStyle+Color, TextAlign,
// ImageResize)이 실제로 생성하는 태그만 허용
const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "u",
  "mark",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "span",
  "div",
];

// ImageResize는 리사이즈 결과를 img의 containerstyle/wrapperstyle/width 속성에 직렬화
// (제거 시 기존 리뷰의 이미지 크기가 전부 초기화됨)
const IMAGE_ATTRIBUTES = [
  "src",
  "alt",
  "title",
  "width",
  "height",
  "style",
  "containerstyle",
  "wrapperstyle",
];

// style은 아래 속성만 허용해 CSS를 통한 공격 표면 축소
const SAFE_LENGTH = /^\d+(?:\.\d+)?(?:px|em|rem|%)$/;
const SAFE_COLOR =
  /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|hsl)a?\([^()]*\)|[a-z]+)$/i;

export interface ReviewHeading {
  id: string;
  text: string;
  level: number;
}

const sanitizeContent = (
  content: string,
  headings?: ReviewHeading[],
  preview = false,
): string => {
  let headingIndex = 0;
  return sanitizeHtml(content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class", "style", "data-*"],
      a: ["href", "title", "target", "rel"],
      img: IMAGE_ATTRIBUTES,
      ...(headings &&
        Object.fromEntries(
          [1, 2, 3, 4, 5, 6].map((level) => [`h${level}`, ["id", "tabindex"]]),
        )),
    },
    allowedStyles: {
      "*": {
        color: [SAFE_COLOR],
        "background-color": [SAFE_COLOR],
        "text-align": [/^(left|right|center|justify|start|end)$/],
        width: [SAFE_LENGTH],
        height: [SAFE_LENGTH, /^auto$/],
      },
    },
    // dompurify 기본 정책과 동일하게 data:/javascript: URL 차단
    allowedSchemes: ["http", "https", "mailto"],
    // Only the local draft preview may display not-yet-uploaded object URLs.
    ...(preview && { allowedSchemesByTag: { img: ["http", "https", "blob"] } }),
    allowedSchemesAppliedToAttributes: ["href", "src"],
    // 새 탭으로 열리는 링크는 opener 차단
    transformTags: {
      "*": (tagName, attribs) => {
        if (headings && /^h[1-6]$/.test(tagName)) {
          return {
            tagName,
            attribs: {
              ...attribs,
              id: `review-section-${++headingIndex}`,
              tabindex: "-1",
            },
          };
        }
        return { tagName, attribs };
      },
      a: (tagName, attribs) =>
        attribs.target === "_blank"
          ? {
              tagName,
              attribs: { ...attribs, rel: "noopener noreferrer nofollow" },
            }
          : { tagName, attribs },
    },
    exclusiveFilter: (frame) => {
      if (headings && /^h[1-6]$/.test(frame.tag)) {
        const text = frame.text.replace(/\s+/g, " ").trim();
        if (text)
          headings.push({
            id: frame.attribs.id,
            text,
            level: Number(frame.tag[1]),
          });
      }
      return false;
    },
  });
};

export const sanitizeReviewContent = (content: string): string =>
  sanitizeContent(content);

// Build both outputs in the same DOM-free pass, including during SSR.
export function prepareReviewContent(content: string, preview = false) {
  const headings: ReviewHeading[] = [];
  const html = sanitizeContent(content, headings, preview);
  return { html, headings };
}
