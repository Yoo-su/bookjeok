import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// PGlite의 Node 동적 import를 Jest VM 밖에서 실행한다.
it('실제 PostgreSQL에서 통합 검색 미리보기 SQL을 검증한다', () => {
  const result = spawnSync(
    process.execPath,
    [resolve(__dirname, '../../../../scripts/test-search-preview-sql.cjs')],
    { encoding: 'utf8', timeout: 45000 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
}, 50000);
