import { privateApiClient } from "@bookjeok/api-client";
import { type ReadingLog, readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosAdapter } from "axios";
import { useState } from "react";

import { OverlayProvider } from "@/shared/hooks/use-overlay";

import { SAMPLE_LOGS } from "../reading-log-demo";
import { ReadingLogCalendar } from "./index";

/** 스토리에서 새로 기록한 것. 다시 받아도 사라지지 않게 어댑터가 함께 돌려준다 */
const addedLogs: ReadingLog[] = [];

/**
 * 로컬에 API가 없어 요청을 받는 어댑터를 갈아 끼움. 지연을 줘서 다른 달을 받는 동안을 본다
 */
const fakeReadingLogAdapter =
  (latency: number): AxiosAdapter =>
  async (config) => {
    await new Promise((r) => setTimeout(r, latency));
    const { year, month } = config.params ?? {};
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const all = [...SAMPLE_LOGS, ...addedLogs];
    const monthly = all.filter((l) => l.date.startsWith(prefix));
    const yearly = all.filter((l) => l.date.startsWith(`${year}`));
    const data =
      config.url === "/reading-logs/stats"
        ? { monthlyCount: monthly.length, yearlyCount: yearly.length }
        : monthly;
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };

function CalendarPlayground({ withRecord }: { withRecord: boolean }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date(2026, 6, 1));

  /** 이 달의 빈 날 하나에 기록을 더하고, 기록 저장 뒤처럼 목록을 다시 받는다 */
  const record = () => {
    const prefix = `2026-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const taken = new Set(
      [...SAMPLE_LOGS, ...addedLogs]
        .filter((l) => l.date.startsWith(prefix))
        .map((l) => l.date),
    );
    const day = Array.from({ length: 28 }, (_, i) => i + 1)
      .map((d) => `${prefix}-${String(d).padStart(2, "0")}`)
      .find((d) => !taken.has(d));
    if (!day) return;
    const source = SAMPLE_LOGS[addedLogs.length % SAMPLE_LOGS.length];
    addedLogs.push({ ...source, id: `story-${addedLogs.length}`, date: day });
    queryClient.invalidateQueries({ queryKey: readingLogKeys.list._def });
  };

  return (
    <OverlayProvider>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {withRecord ? (
            <button
              type="button"
              onClick={record}
              className="rounded-full bg-stone-900 px-3 py-1.5 text-white"
            >
              빈 날에 기록하기
            </button>
          ) : (
            // 월 선택으로 멀리 건너뛰는 경우. 미리 받지 않은 달이라 받는 동안 이전 달이 흐려진다
            [1, 9].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDate(new Date(2026, m - 1, 1))}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-stone-600"
              >
                {m}월로 건너뛰기
              </button>
            ))
          )}
        </div>
        <ReadingLogCalendar currentDate={date} onDateChange={setDate} />
      </div>
    </OverlayProvider>
  );
}

/** latency: 가짜 응답 지연(ms) */
type Args = { latency: number; withRecord: boolean };

const meta: Meta<Args> = {
  title: "Features/ReadingLog/ReadingLogCalendar",
  render: ({ withRecord }) => <CalendarPlayground withRecord={withRecord} />,
  parameters: { layout: "padded" },
  args: { latency: 1200, withRecord: false },
  argTypes: {
    latency: { control: { type: "range", min: 0, max: 3000, step: 100 } },
    withRecord: { table: { disable: true } },
  },
  beforeEach: ({ args }) => {
    addedLogs.length = 0;
    const original = privateApiClient.defaults.adapter;
    privateApiClient.defaults.adapter = fakeReadingLogAdapter(args.latency);
    return () => {
      privateApiClient.defaults.adapter = original;
    };
  },
};

export default meta;
type Story = StoryObj<Args>;

/**
 * 달을 넘기면 넘긴 쪽에서 미끄러져 들어온다(앞뒤 달은 미리 받아 둠).
 * 위 건너뛰기 버튼으로 먼 달로 가면 받는 동안 이전 달이 흐려진 채 기다린다
 */
export const MonthSlide: Story = {};

/** 응답이 느린 경우. 스켈레톤으로 깜빡이지 않고 이전 달을 흐리게 유지한다 */
export const SlowNetwork: Story = { args: { latency: 2500 } };

/**
 * 기록하면 그 칸에만 표지가 위에서 내려와 꽂힌다. 다른 칸과 달 넘김·첫 화면은 그대로다
 */
export const NewRecordPlants: Story = {
  args: { latency: 300, withRecord: true },
};
