import { privateApiClient } from "@bookjeok/api-client";
import {
  API_PATHS,
  type ReadingLog,
  readingLogKeys,
  type ReceivedKongsResponse,
} from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosAdapter } from "axios";
import { useState, useSyncExternalStore } from "react";

import { OverlayProvider } from "@/shared/hooks/use-overlay";

import { SAMPLE_LOGS } from "../reading-log-demo";
import { ReadingLogCalendar } from "./index";

/** 스토리에서 새로 기록한 것. 다시 받아도 사라지지 않게 어댑터가 함께 돌려준다 */
const addedLogs: ReadingLog[] = [];

/** 어댑터가 받은 요청. 같은 해 안에서 달을 넘길 때 늘지 않는지 화면에서 센다 */
const requests = {
  list: [] as string[],
  listeners: new Set<() => void>(),
  add(entry: string) {
    this.list = [...this.list, entry];
    this.listeners.forEach((l) => l());
  },
  reset() {
    this.list = [];
    this.listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    requests.listeners.add(listener);
    return () => requests.listeners.delete(listener);
  },
};

/**
 * 로컬에 API가 없어 요청을 받는 어댑터를 갈아 끼움. 지연을 줘서 다른 해를 받는 동안을 본다
 * - 서버처럼 year만 받으면 그해 전체를 날짜 오름차순으로 돌려준다
 */
const fakeReadingLogAdapter =
  (latency: number): AxiosAdapter =>
  async (config) => {
    // 받은 콩: 7월 앞쪽 기록 몇 개가 받은 것으로. 기록 요청 수에는 세지 않는다
    if (config.url === API_PATHS.readingLog.kongsReceived) {
      return {
        data: storyKongs(),
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }
    const { year } = config.params ?? {};
    requests.add(`${config.url}?year=${year}`);
    await new Promise((r) => setTimeout(r, latency));
    const data = [...SAMPLE_LOGS, ...addedLogs]
      .filter((l) => l.date.startsWith(`${year}-`))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };

function storyKongs(): ReceivedKongsResponse {
  const july = SAMPLE_LOGS.filter((l) => l.date.startsWith("2026-07"));
  const logs = july.slice(0, 3).map((log, i) => ({
    logId: log.id,
    date: log.date,
    book: log.book,
    count: 3 - i,
    senders: ["책벌레", "하루", "민지"].slice(0, 3 - i).map((nickname, j) => ({
      userId: j + 10,
      nickname,
      handle: `reader_${j}`,
      profileImageUrl: null,
    })),
    lastReceivedAt: `${log.date}T09:00:00.000Z`,
  }));
  return { total: logs.reduce((a, l) => a + l.count, 0), logs };
}

function CalendarPlayground({ withRecord }: { withRecord: boolean }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date(2026, 6, 1));
  const sent = useSyncExternalStore(
    requests.subscribe,
    () => requests.list,
    () => requests.list,
  );

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
            // 같은 해는 바로 넘어가고, 미리 받지 않은 해로 건너뛰면 받는 동안 이전 달이 흐려진다
            [
              { label: "2026년 1월", to: new Date(2026, 0, 1) },
              { label: "2026년 9월", to: new Date(2026, 8, 1) },
              { label: "2024년 6월(다른 해)", to: new Date(2024, 5, 1) },
            ].map(({ label, to }) => (
              <button
                key={label}
                type="button"
                onClick={() => setDate(to)}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-stone-600"
              >
                {label}로 건너뛰기
              </button>
            ))
          )}
          <span
            data-testid="request-count"
            className="ml-auto self-center tabular-nums text-stone-500"
          >
            요청 {sent.length}회
            {sent.length > 0 && ` · 마지막 ${sent[sent.length - 1]}`}
          </span>
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
  // 날짜를 누르면 여는 하루 상세가 앱 라우터를 쓴다
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
  args: { latency: 1200, withRecord: false },
  argTypes: {
    latency: { control: { type: "range", min: 0, max: 3000, step: 100 } },
    withRecord: { table: { disable: true } },
  },
  beforeEach: ({ args }) => {
    addedLogs.length = 0;
    requests.reset();
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
 * 달을 넘기면 넘긴 쪽에서 미끄러져 들어온다. 기록은 해 단위로 한 번 받아 같은 해 안에서는 요청이 없다(오른쪽 위 요청 수).
 * 1월·12월에서는 이웃 해를 미리 받고, 미리 받지 않은 해로 건너뛰면 받는 동안 이전 달이 흐려진 채 기다린다
 */
export const MonthSlide: Story = {};

/** 응답이 느린 경우. 다른 해로 건너뛰어도 스켈레톤으로 깜빡이지 않고 이전 달을 흐리게 유지한다 */
export const SlowNetwork: Story = { args: { latency: 2500 } };

/**
 * 기록하면 그 칸에만 표지가 위에서 내려와 꽂힌다. 다른 칸과 달 넘김·첫 화면은 그대로다
 */
export const NewRecordPlants: Story = {
  args: { latency: 300, withRecord: true },
};
