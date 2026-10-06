import { SceneData } from "@bookjeok/core";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { SCENES } from "@/features/intro/constants/data";

import { LogoScene } from "./logo-scene";
import { RecordScene } from "./record-scene";
import { ReviewScene } from "./review-scene";
import { ScrollGuide } from "./scroll-guide";
import { UsedScene } from "./used-scene";

// -----------------------------------------------------------------------------
// 컴포넌트: 홈 히어로 (HomeHero)
// -----------------------------------------------------------------------------
export const HomeHero = () => {
  const t = useTranslations("intro.scenes");
  const [currentIndex, setCurrentIndex] = useState(0);
  const sceneConfig = SCENES[currentIndex];

  const currentScene: SceneData = {
    ...sceneConfig,
    header: t(`${sceneConfig.id}.header`),
    sub: t(`${sceneConfig.id}.sub`),
    desc: t(`${sceneConfig.id}.desc`),
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCENES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="font-(family-name:--font-gowun-batang) relative flex min-h-[600px] w-full flex-col justify-center overflow-hidden bg-white pb-[10vh] md:min-h-[750px]">
      <div className="container relative mx-auto flex-1 w-full px-6 md:px-10">
        <AnimatePresence mode="wait">
          {currentScene.id === "record" && (
            <RecordScene key="record" data={currentScene} />
          )}
          {currentScene.id === "used" && (
            <UsedScene key="used" data={currentScene} />
          )}
          {currentScene.id === "review" && (
            <ReviewScene key="review" data={currentScene} />
          )}
          {currentScene.id === "logo" && (
            <LogoScene key="logo" data={currentScene} />
          )}
        </AnimatePresence>
      </div>

      {/* Visual Connector: The Kinetic Thread */}
      <ScrollGuide />
    </section>
  );
};
