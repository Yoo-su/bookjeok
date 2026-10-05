import { cn } from "@/shared/utils";

/** 숫자 밑에 연필로 한 번 긋고 바로 아래를 한 번 더 스친 밑줄. 감싼 글자 폭에 맞춰 늘어난다 */
export function HandUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -bottom-[0.18em] left-[-3%] h-[0.24em] w-[106%] overflow-visible",
        className,
      )}
    >
      {/* 덧선은 오른쪽 끝에서 모인다 */}
      <path
        d="M2,6.4 C30,5.4 62,6.6 98,3.8"
        fill="none"
        stroke="#292524"
        strokeWidth={2.6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M8,10 C38,9.6 70,8.8 94,6.4"
        fill="none"
        stroke="#78716C"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.75}
      />
    </svg>
  );
}
