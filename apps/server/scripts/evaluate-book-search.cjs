/**
 * 공개 검색 API의 상위 10건을 고정 검색어로 기록합니다. GET만 순차 호출합니다.
 * 사용법: node apps/server/scripts/evaluate-book-search.cjs <API origin> [output.json]
 * 지연시간은 네트워크·서버·캐시를 포함하며 DB 실행시간이나 콜드/웜 측정이 아닙니다.
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { API_PATHS } = require('@bookjeok/core');

const titleTarget = (title, author) => ({ title, author });
const cases = [
  ...[
    '채식주의자',
    '채식 주의자',
    '한강 채식주의자',
    '채식주의자 한강',
    '한강의 채식주의자',
    '채식주의자 책',
    '채식주이자',
  ].map((query) => ({
    query,
    group: '특정 도서',
    target: titleTarget('채식주의자', '한강'),
  })),
  ...[
    '사탄탱고',
    '사탄 탱고',
    '탱고 사탄',
    '라슬로 사탄',
    '사탄 탱고 라슬로',
  ].map((query) => ({
    query,
    group: '띄어쓰기·조합',
    target: titleTarget('사탄탱고', '라슬로'),
  })),
  ...['어린 왕자', '어린왕자', '왕자 어린'].map((query) => ({
    query,
    group: '띄어쓰기·순서',
    target: titleTarget('어린왕자', ['생텍쥐페리', '생택쥐페리']),
  })),
  ...['해리포터', '해리 포터', '포터 해리', '헤리포터'].map((query) => ({
    query,
    group: '시리즈·오타',
    target: titleTarget('해리포터', '롤링'),
  })),
  { query: '김영하', group: '저자', target: { author: '김영하' } },
  { query: '민음사', group: '출판사', target: { publisher: '민음사' } },
  { query: '그리스 신화', group: '단어 간격 (수동 평가)' },
  ...[
    'SF 입문',
    '에스에프 소설',
    '불안을 다루는 심리학 책',
    '상실을 극복하는 소설',
    '철학 입문',
    '우주 과학',
  ].map((query) => ({
    query,
    group: '주제 (수동 평가)',
  })),
  { query: '북적검색평가없는책제목가나다라', group: '미존재 검색어' },
  { query: '!!!', group: '빈 검색어 방어' },
];

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{Nd}]+/gu, '');
const matches = (book, target) =>
  Object.entries(target).every(([field, value]) =>
    (Array.isArray(value) ? value : [value]).some((variant) =>
      ['publisher', 'isbn'].includes(field)
        ? normalize(book[field]) === normalize(variant)
        : normalize(book[field]).includes(normalize(variant)),
    ),
  );

async function main() {
  const [origin, output = '.tmp/book-search-baseline.json'] =
    process.argv.slice(2);
  if (!origin) throw new Error('API origin 인수가 필요합니다.');
  const base = new URL(origin);
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname !== '/'
  ) {
    throw new Error('자격증명·경로·쿼리가 없는 API origin을 입력하세요.');
  }
  if (!['https:', 'http:'].includes(base.protocol))
    throw new Error('HTTP(S)만 지원합니다.');

  const rows = [];
  // 첫 정상 제목 검색에서 찾은 ISBN으로, 같은 책의 ISBN 검색도 평가합니다.
  const pending = [...cases];
  for (const entry of pending) {
    const url = new URL(API_PATHS.book.list, base);
    url.search = new URLSearchParams({
      query: entry.query,
      display: '10',
      start: '1',
      sort: 'sim',
    }).toString();
    const started = performance.now();
    let row;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const envelope = await response.json();
      const result = envelope.success === true ? envelope.data : envelope;
      if (!Array.isArray(result?.items) || !Number.isFinite(result.total)) {
        throw new Error('검색 응답 형식이 예상과 다릅니다.');
      }
      const items = result.items.map(({ isbn, title, author, publisher }) => ({
        isbn,
        title,
        author,
        publisher,
      }));
      const index = entry.target
        ? items.findIndex((item) => matches(item, entry.target))
        : -1;
      row = {
        ...entry,
        total: result.total,
        targetRank: entry.target ? (index < 0 ? null : index + 1) : undefined,
        elapsedMs: Math.round(performance.now() - started),
        items,
      };
      if (entry.query === '채식주의자' && index >= 0) {
        pending.push({
          query: items[index].isbn,
          group: 'ISBN',
          target: { isbn: items[index].isbn },
          catalogEvidenceQuery: entry.query,
        });
      }
    } catch (error) {
      row = {
        ...entry,
        error: error.message,
        elapsedMs: Math.round(performance.now() - started),
      };
    }
    rows.push(row);
    console.log(
      JSON.stringify({
        query: row.query,
        total: row.total,
        targetRank: row.targetRank,
        error: row.error,
      }),
    );
    await delay(300);
  }

  const targetKey = (target) => JSON.stringify(target);
  const confirmed = new Set(
    rows.filter((row) => row.targetRank).map((row) => targetKey(row.target)),
  );
  for (const row of rows) {
    if (row.target)
      row.targetObservedInSuite =
        Boolean(row.catalogEvidenceQuery) ||
        confirmed.has(targetKey(row.target));
  }
  const successful = rows.filter((row) => !row.error);
  const evaluated = successful.filter((row) => row.targetObservedInSuite);
  const report = {
    measuredAt: new Date().toISOString(),
    origin: base.origin,
    note:
      '초기 후보 평가. 기대 도서는 작품·저자 문자열로 판정하며 Recall@10이 아닙니다. ' +
      'targetObservedInSuite=false이면 DB 부재와 검색 실패를 구분할 수 없습니다. ' +
      '응답시간은 캐시 상태를 통제하지 않은 HTTP 측정입니다. 주제 검색은 수동 평가 대상입니다.',
    summary: {
      requests: rows.length,
      errors: rows.length - successful.length,
      zeroResults: successful.filter((row) => row.total === 0).length,
      targetCasesWithCatalogEvidence: evaluated.length,
      targetHitAt10: evaluated.filter((row) => row.targetRank).length,
    },
    cases: rows,
  };
  const path = resolve(output);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.summary));
  console.log(`결과: ${path}`);
  if (report.summary.errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
