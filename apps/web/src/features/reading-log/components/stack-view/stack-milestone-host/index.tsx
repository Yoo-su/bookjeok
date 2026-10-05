"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useReadingLogViewStore } from "../../../stores/use-reading-log-view-store";
import { useStackMilestoneStore } from "../../../stores/use-stack-milestone-store";

// 장면·사물 그림은 무겁고 넘은 기록에서만 쓰므로 필요할 때 받는다
const StackMilestoneDialog = dynamic(
  () => import("../stack-milestone-dialog").then((m) => m.StackMilestoneDialog),
  { ssr: false },
);
const StackObjectCollection = dynamic(
  () =>
    import("../stack-object-collection").then((m) => m.StackObjectCollection),
  { ssr: false },
);

/** 기록으로 사물·몸 부위·내 키를 넘었을 때 장면을 띄우고, 거기서 도감을 연다 */
export function StackMilestoneHost() {
  const scene = useStackMilestoneStore((s) => s.scene);
  const open = useStackMilestoneStore((s) => s.open);
  const close = useStackMilestoneStore((s) => s.close);
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);
  const router = useRouter();
  const [collectionOpen, setCollectionOpen] = useState(false);

  if (!scene) return null;
  // 독서기록 페이지는 올해를 열므로 지난해 기록에는 바로가기를 두지 않는다
  const isThisYear = scene.year === new Date().getFullYear();

  return (
    <>
      <StackMilestoneDialog
        key={scene.logId}
        open={open}
        onOpenChange={(next) => !next && close()}
        books={scene.books}
        logId={scene.logId}
        milestone={scene.milestone}
        userMm={scene.userMm}
        character={scene.character}
        onOpenCollection={() => {
          close();
          setCollectionOpen(true);
        }}
        onViewStack={
          isThisYear
            ? () => {
                close();
                setViewMode("stack");
                router.push(PATHS.READING_LOG);
              }
            : undefined
        }
      />
      <StackObjectCollection
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        year={scene.year}
        books={scene.books}
      />
    </>
  );
}
