import { beforeEach, describe, expect, it, vi } from "vitest";

// 책탑에서 독서 키재기로 이름을 바꾸며 기기에 남은 옛 저장값을 옮긴다
describe("독서 키재기 이름 변경 전 저장값", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("옛 키 설정 저장소를 새 이름으로 옮기고 옛 것은 지운다", async () => {
    localStorage.setItem(
      "reading-tower-settings",
      JSON.stringify({
        state: { heightCm: 170, character: "F", author: "kafka" },
        version: 0,
      }),
    );
    const { useStackSettingsStore } = await import(
      "@/features/reading-log/stores/use-stack-settings-store"
    );
    await useStackSettingsStore.persist.rehydrate();
    expect(useStackSettingsStore.getState()).toMatchObject({
      heightCm: 170,
      character: "F",
      author: "kafka",
    });
    expect(localStorage.getItem("reading-tower-settings")).toBeNull();
    expect(localStorage.getItem("reading-stack-settings")).not.toBeNull();
  });

  it("새 저장소가 이미 있으면 옛 값으로 덮지 않는다", async () => {
    localStorage.setItem(
      "reading-tower-settings",
      JSON.stringify({ state: { heightCm: 150 }, version: 0 }),
    );
    localStorage.setItem(
      "reading-stack-settings",
      JSON.stringify({ state: { heightCm: 181 }, version: 0 }),
    );
    const { useStackSettingsStore } = await import(
      "@/features/reading-log/stores/use-stack-settings-store"
    );
    await useStackSettingsStore.persist.rehydrate();
    expect(useStackSettingsStore.getState().heightCm).toBe(181);
  });

  it("마지막 보기 'tower'는 독서 키재기 보기로 연다", async () => {
    localStorage.setItem(
      "reading-log-view",
      JSON.stringify({ state: { viewMode: "tower" }, version: 0 }),
    );
    const { useReadingLogViewStore } = await import(
      "@/features/reading-log/stores/use-reading-log-view-store"
    );
    await useReadingLogViewStore.persist.rehydrate();
    expect(useReadingLogViewStore.getState().viewMode).toBe("stack");
  });

  it("옛 소개를 본 사람에게 새 이름의 소개를 다시 띄우지 않는다", async () => {
    localStorage.setItem(
      "announcements-seen",
      JSON.stringify({ state: { seen: ["reading-tower"] }, version: 0 }),
    );
    const { useAnnouncementStore } = await import(
      "@/features/announcement/stores/use-announcement-store"
    );
    await useAnnouncementStore.persist.rehydrate();
    expect(useAnnouncementStore.getState().seen).toEqual(["reading-stack"]);
  });
});
