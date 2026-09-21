# Frontend Feature: Insights (서비스 인사이트 대시보드)

`/insights`에서 서비스 전체의 독서·거래 데이터를 시각화합니다. 개인 통계는 [`user`](../user/README.md) 기능입니다.

## 1. 폴더 구조

```
insights/
├── constants/ui.ts                   # 차트 색상·레이아웃 상수
└── components/
    ├── common/
    │   ├── insights-header/
    │   └── insight-card/             # 차트를 감싸는 공통 카드
    ├── charts/
    │   ├── location-heatmap/         # 지역별 중고 거래 분포
    │   ├── price-histogram/          # 가격대 분포
    │   ├── category-chart/           # 카테고리별 분포
    │   ├── reaction-donut-chart/     # 리액션 비율
    │   └── activity-trend-chart/     # 활동 추이
    └── lists/
        └── popular-tags-list/        # 인기 태그 순위 (리뷰 목록 `?tag=`로 링크)
```

## 2. 데이터

| 컴포넌트           | 엔드포인트                     |
| ------------------ | ------------------------------ |
| 대부분의 차트·목록 | `GET /insights`                |
| `location-heatmap` | `GET /insights/location-sales` |

`activity-trend-chart`는 최근 30일간의 일별 판매글 수·리뷰 수를 보여줍니다. 서버가 `used_book_sales`와 `reviews` 테이블에서 직접 집계합니다.

## 3. 차트 구현 메모

- **ApexCharts**(`react-apexcharts`)를 사용합니다. **SSR을 지원하지 않으므로** 차트 컴포넌트는 클라이언트 전용으로 동적 로드하고 스켈레톤을 함께 둡니다.
- 색상·간격은 `constants/ui.ts` 한 곳에서 관리합니다. 차트별로 색을 직접 박아 넣으면 다크 모드에서 어긋납니다.
- 페이지는 ISR로 서빙되며, 관리자 포털의 캐시 제어 센터에서 온디맨드로 갱신할 수 있습니다.
- 동일한 통계를 `apps/admin`의 대시보드도 소비합니다(`@bookjeok/core`의 `InsightsResponse` 공유).

## 4. 관련

- 서버: [`features/insights`](../../../../server/src/features/insights/README.md)
- 뷰: `insights-view`
