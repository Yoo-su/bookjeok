"use client";

import { MainArtSlider } from "@/features/art/components/art-slider/main-art-slider";
import { MAIN_ARTS } from "@/features/art/constants";
import { MainBookSlider } from "@/features/book/components/book-slider/main-book-slider";
import { RecentSalesSlider } from "@/features/book/components/book-slider/recent-sale-slider";

export const MainView = () => {
  return (
    <div className="flex flex-col gap-8">
      <MainBookSlider />

      <RecentSalesSlider />

      <div>
        <MainArtSlider
          title="Spotlight: 오늘의 무대"
          subtitle="도시의 밤을 밝히는 가장 뜨거운 공연들을 만나보세요."
          chips={MAIN_ARTS}
          queryOptions={{ prfstate: "02" }} // "공연중"
        />

        <MainArtSlider
          title="Coming Soon: 설레는 기다림"
          subtitle="곧 막을 올릴 기대작들을 미리 만나보는 시간."
          chips={MAIN_ARTS}
          queryOptions={{ prfstate: "01" }} // "공연예정"
        />
      </div>
    </div>
  );
};

export default MainView;
