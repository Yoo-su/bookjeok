"use client";

import { BookInfo, HOME_PUBLISHERS } from "@bookjeok/core";
import { useBookListQuery } from "@bookjeok/react-query";
import {
  animate,
  motion,
  MotionValue,
  PanInfo,
  useMotionValue,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { BookOpen } from "@/shared/components/icons/iconsax";
import { TextAnimate } from "@/shared/components/magicui/text-animate";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { BookSliderSkeleton } from "./skeleton";

// 3D 실린더 카드 컴포넌트
const BookCard = memo(
  ({
    book,
    index,
    rotationY,
    angleStep,
    radius,
    onCardClick,
  }: {
    book: BookInfo;
    index: number;
    rotationY: MotionValue<number>;
    angleStep: number;
    radius: number;
    onCardClick: (e: React.MouseEvent) => void;
  }) => {
    const cardAngle = index * angleStep;

    // 중앙 전면과의 상대 각도 계산
    const relativeAngle = useTransform(rotationY, (r: number) => {
      const total = (((cardAngle + r) % 360) + 360) % 360;
      return total > 180 ? total - 360 : total;
    });

    // 전면 상대 각도 기준 동적 스타일 매핑 (360도 전체 범위)
    const scale = useTransform(
      relativeAngle,
      [-180, -120, -60, 0, 60, 120, 180],
      [0.65, 0.75, 0.9, 1.05, 0.9, 0.75, 0.65],
    );

    const opacity = useTransform(
      relativeAngle,
      [-180, -120, -60, 0, 60, 120, 180],
      [0.15, 0.25, 0.6, 1, 0.6, 0.25, 0.15],
    );

    const zIndex = useTransform(relativeAngle, (a: number) =>
      Math.round(200 - Math.abs(a)),
    );

    const overlayOpacity = useTransform(
      relativeAngle,
      [-180, -120, -60, 0, 60, 120, 180],
      [0.7, 0.55, 0.3, 0, 0.3, 0.55, 0.7],
    );

    // 3D 회전 시 뒤편(후면)에 위치한 카드의 포인터 이벤트 차단
    const pointerEvents = useTransform(relativeAngle, (a: number) =>
      Math.abs(a) > 85 ? "none" : "auto",
    );

    return (
      // 1. 외곽 레이어: 정적 3D 실린더 배치 및 3D 후면 숨김 처리
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          pointerEvents,
        }}
        className="cursor-pointer"
      >
        {/* 2. 중간 레이어: 동적 크기, 투명도, z-index 정렬 및 고정 호버 영역 감지 담당 */}
        <motion.div
          initial="rest"
          whileHover="hover"
          animate="rest"
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            scale,
            opacity,
            zIndex,
          }}
          className="w-full h-full cursor-pointer"
        >
          {/* 3. 내부 레이어: 마우스 호버 애니메이션 담당 */}
          <motion.div
            variants={{
              rest: { scale: 1, y: 0 },
              hover: { scale: 1.06, y: -12 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full h-full rounded-2xl cursor-pointer"
          >
            <Link
              href={PATHS.BOOK_DETAIL(book.isbn)}
              prefetch={false}
              passHref
              onClick={onCardClick}
              onDragStart={(e) => e.preventDefault()} // 드래그 제스처 방해 방지를 위해 브라우저 기본 링크 드래그 차단
              className="block w-full h-full group pointer-events-auto cursor-pointer"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_12px_24px_-8px_rgba(0,0,0,0.35)] group-hover:shadow-[0_28px_40px_-10px_rgba(0,0,0,0.45)] transition-shadow duration-700 ease-out border border-stone-200/40 cursor-pointer">
                <Image
                  src={book.image || "/images/placeholder-book.svg"}
                  alt={book.title}
                  fill
                  priority={true}
                  unoptimized={true}
                  draggable={false} // 마우스 먹통 방지를 위해 브라우저 기본 이미지 드래그 차단
                  sizes="(max-width: 768px) 130px, 230px"
                  className="object-cover transition-transform duration-1000 group-hover:scale-102 cursor-pointer"
                />
                {/* 입체적인 조명 효과를 위한 베벨 링 */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />

                {/* 카드가 측면으로 회전할 때 어두워지는 그림자 오버레이 */}
                <motion.div
                  style={{ opacity: overlayOpacity }}
                  className="absolute inset-0 bg-stone-950/90 pointer-events-none transition-opacity duration-300"
                />

                {/* 마우스 호버 시 밝아지는 하이라이트 오버레이 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  },
);

BookCard.displayName = "BookCard";

// 활성 도서 정보 텍스트 컴포넌트 (부모 전체의 불필요한 리렌더링 방지를 위해 격리)
const ActiveBookInfo = memo(
  ({
    rotationY,
    books,
    angleStep,
  }: {
    rotationY: MotionValue<number>;
    books: BookInfo[];
    angleStep: number;
  }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const N = books.length;

    useEffect(() => {
      if (N === 0) return;
      const unsubscribe = rotationY.on("change", (latest: number) => {
        const approxIndex = Math.round(-latest / angleStep);
        const normIndex = ((approxIndex % N) + N) % N;
        setActiveIndex(normIndex);
      });
      return () => unsubscribe();
    }, [rotationY, angleStep, N]);

    const activeBook = books[activeIndex];

    return (
      <div className="container mx-auto mt-16 flex flex-col items-center text-center h-[80px]">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-1.5 select-none pointer-events-none"
        >
          <h3 className="text-stone-900 font-bold text-xl md:text-3xl leading-tight px-4 max-w-2xl line-clamp-1">
            {activeBook?.title}
          </h3>
          <p className="text-stone-500 text-sm md:text-base font-medium tracking-wide">
            {activeBook?.author}
          </p>
        </motion.div>
      </div>
    );
  },
);

ActiveBookInfo.displayName = "ActiveBookInfo";

// 화면 너비별 반응형 치수 계산 헬퍼 함수
const getSliderDimensions = (width?: number) => {
  const w =
    width ?? (typeof window !== "undefined" ? window.innerWidth : 1200);
  if (w > 1024) {
    return { radius: 580, cardWidth: 180, cardHeight: 270 };
  } else if (w > 768) {
    return { radius: 480, cardWidth: 150, cardHeight: 225 };
  } else if (w > 480) {
    return { radius: 420, cardWidth: 130, cardHeight: 195 };
  } else {
    return { radius: 350, cardWidth: 110, cardHeight: 165 };
  }
};

export const MainBookSlider = () => {
  const t = useTranslations("home.sections.main_books");
  const tError = useTranslations("home.errors");
  const [activePublisher, setActivePublisher] = useState(HOME_PUBLISHERS[0]);

  // 풍성하고 촘촘한 실린더를 표현하기 위해 출판사당 18개 도서 조회
  const {
    data: books,
    isLoading,
    isError,
  } = useBookListQuery({ query: activePublisher, display: 18 });

  // 반응형 치수가 확정되기 전까지 슬라이더를 숨겨 레이아웃 점프(FOUC) 방지
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // 화면 크기별 반응형 파라미터 (클라이언트 마운트 시 즉시 현재 창 크기 반영)
  const [dimensions, setDimensions] = useState(getSliderDimensions);
  const { radius, cardWidth, cardHeight } = dimensions;

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getSliderDimensions(window.innerWidth));
    };

    handleResize();
    // 반응형 치수 계산 완료 후 레이아웃 준비 상태로 전환
    setIsLayoutReady(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 실린더에 최소 15개 이상 카드를 확보하도록 데이터 복제
  const displayBooks = useMemo<BookInfo[]>(() => {
    if (!Array.isArray(books) || books.length === 0) return [];

    const minCount = 15;
    if (books.length >= minCount) return books;

    const multiplier = Math.ceil(minCount / books.length);
    return Array(multiplier)
      .fill(books)
      .flat()
      .slice(0, Math.max(minCount, books.length * 3));
  }, [books]);

  const N = displayBooks.length;
  const angleStep = 360 / (N || 1);

  // Framer Motion 상태 값
  const rotationY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSnappingRef = useRef(false);
  const dragDistanceRef = useRef(0);

  // 모바일 사선 스와이프 시 전체 세로 스크롤과 슬라이더 드래그의 충돌을 방지하는 이벤트 바인딩
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let isHorizontalDrag = false;
    let isFirstMove = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isHorizontalDrag = false;
        isFirstMove = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;

      if (isFirstMove) {
        const diffX = Math.abs(e.touches[0].clientX - startX);
        const diffY = Math.abs(e.touches[0].clientY - startY);

        // 수평 드래그 거리가 더 크고 최소 변위가 있으면 수평 드래그로 판정하여 세로 스크롤 방지
        if (diffX > diffY && diffX > 4) {
          isHorizontalDrag = true;
        }
        isFirstMove = false;
      }

      if (isHorizontalDrag) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // 자동 회전(롤링) 기능 구현
  const startAutoplay = () => {
    stopAutoplay();
    autoplayIntervalRef.current = setInterval(() => {
      if (isDragging || isSnappingRef.current) return;

      // 소수점 오차 누적으로 각도가 어긋나지 않도록 현재 각도값을 카드 정렬단위로 정규화 후 한 칸 넘김
      const current = rotationY.get();
      const nextAngle = Math.round(current / angleStep) * angleStep - angleStep;

      isSnappingRef.current = true;
      animate(rotationY, nextAngle, {
        type: "spring",
        stiffness: 60,
        damping: 18,
        onComplete: () => {
          isSnappingRef.current = false;
        },
      });
    }, 2000); // 2초 대기 후 한 칸씩 롤링
  };

  const stopAutoplay = () => {
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = null;
    }
  };

  // 사용자 호버, 포커스 또는 드래그 상태에 따른 자동 스크롤 제어
  useEffect(() => {
    if (isHovered || isDragging || isFocused) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
    return () => stopAutoplay();
  }, [isHovered, isDragging, isFocused, N, angleStep]);

  // 출판사 변경 시 회전 상태 초기화 및 자동 스크롤 재개
  useEffect(() => {
    stopAutoplay();
    rotationY.set(0);
    dragDistanceRef.current = 0;
    if (!isHovered && !isDragging && !isFocused) {
      startAutoplay();
    }
  }, [activePublisher]);

  // Framer Motion pan 이벤트를 활용한 드래그 제스처 핸들러
  const handlePanStart = () => {
    setIsDragging(true);
    stopAutoplay();
  };

  const handlePan = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    dragDistanceRef.current += Math.abs(info.delta.x);
    const screenWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    // 모바일 기기는 터치 드래그 반응성을 높이기 위해 더 높은 민감도 적용
    const sensitivity = screenWidth < 768 ? 0.22 : 0.12;
    rotationY.set(rotationY.get() + info.delta.x * sensitivity);
  };

  const handlePanEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setIsDragging(false);

    const velocity = info.velocity.x;
    const current = rotationY.get();

    const screenWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const sensitivity = screenWidth < 768 ? 0.22 : 0.12;

    // 마우스 튕기는 속도 관성에 따른 예상 회전 안착각 계산
    const projectedChange = velocity * 0.18 * sensitivity;
    const projectedRotation = current + projectedChange;

    const targetIndex = Math.round(-projectedRotation / angleStep);
    const targetAngle = -targetIndex * angleStep;

    isSnappingRef.current = true;
    animate(rotationY, targetAngle, {
      type: "spring",
      stiffness: 70,
      damping: 18,
      mass: 0.9,
      velocity: velocity * sensitivity,
      onComplete: () => {
        isSnappingRef.current = false;
        // 드래그 직후 클릭 이벤트 오작동을 방지하기 위해 리셋 지연
        setTimeout(() => {
          dragDistanceRef.current = 0;
        }, 50);
        if (!isHovered && !isDragging) {
          startAutoplay();
        }
      },
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 드래그 누적 거리가 5px 이상이면 클릭 이동 차단
    if (dragDistanceRef.current > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="w-full bg-transparent py-16 md:py-24 overflow-hidden select-none">
      <div className="container mx-auto w-full px-4 md:px-0 mb-12 flex flex-col items-center text-center">
        <TextAnimate
          as="h2"
          animation="blurInUp"
          by="character"
          className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-stone-900 pb-2"
        >
          {t("title")}
        </TextAnimate>
        <p className="mt-4 text-base md:text-lg text-stone-500 font-light max-w-xl tracking-wide">
          {t("subtitle")}
        </p>
      </div>

      {/* 출판사 필터 칩 목록 */}
      <div className="container mx-auto w-full px-4 md:px-0 mb-16 flex justify-center">
        <div className="inline-flex items-center gap-0.5 md:gap-1 p-1 md:p-1.5 bg-white/60 backdrop-blur-xl rounded-full shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-white/40 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {HOME_PUBLISHERS.map((publisher) => (
            <button
              key={publisher}
              onClick={() => setActivePublisher(publisher)}
              className={`relative px-3.5 md:px-7 py-1.5 md:py-2.5 rounded-full text-xs md:text-base transition-all duration-500 whitespace-nowrap ${
                activePublisher === publisher
                  ? "text-stone-900 font-semibold shadow-sm"
                  : "text-stone-400 hover:text-stone-700 font-medium"
              }`}
            >
              {activePublisher === publisher && (
                <span className="absolute inset-0 bg-white rounded-full shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)] -z-10 animate-in zoom-in-95 duration-300" />
              )}
              {publisher}
            </button>
          ))}
        </div>
      </div>

      {/* 레이아웃 준비 전이거나 데이터 로딩 중이면 스켈레톤 표시 */}
      {(!isLayoutReady || isLoading) && (
        <BookSliderSkeleton
          radius={radius}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
        />
      )}

      {isLayoutReady &&
        !isLoading &&
        (isError || !Array.isArray(books) || books.length === 0) && (
          <div className="text-center py-20 text-stone-400">
            <BookOpen className="mx-auto h-10 w-10 opacity-20" />
            <p className="mt-4 font-light">{tError("load_books")}</p>
          </div>
        )}

      {isLayoutReady && !isLoading && books && books.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full relative flex flex-col items-center"
        >
          <motion.div
            ref={viewportRef}
            style={{
              perspective: 1200,
              perspectiveOrigin: "center 30%",
            }}
            className="relative flex items-center justify-center w-full h-[220px] sm:h-[260px] md:h-[310px] lg:h-[360px] overflow-visible cursor-grab active:cursor-grabbing touch-pan-y"
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsFocused(false);
              }
            }}
          >
            <motion.div
              style={{
                transformStyle: "preserve-3d",
                rotateY: rotationY,
                z: -radius, // 3D 원근법 확대 왜곡을 보정하기 위해 좌표축 공간을 뒤로 이동
                width: cardWidth,
                height: cardHeight,
              }}
              className="cylinder-carousel-wheel relative"
            >
              {displayBooks.map((book, index) => (
                <BookCard
                  key={`${book.isbn}-${index}`}
                  book={book}
                  index={index}
                  rotationY={rotationY}
                  angleStep={angleStep}
                  radius={radius}
                  onCardClick={handleCardClick}
                />
              ))}
            </motion.div>

            {/* 하단 입체감을 위한 부드러운 바닥 그림자 */}
            <div className="absolute bottom-[-35px] left-1/2 -translate-x-1/2 w-[85%] h-[35px] bg-stone-900/10 rounded-full blur-2xl -z-10 pointer-events-none" />
          </motion.div>

          {/* 활성 도서 정보 텍스트 (격리된 리렌더링 서브 컴포넌트) */}
          <ActiveBookInfo
            key={activePublisher}
            rotationY={rotationY}
            books={displayBooks}
            angleStep={angleStep}
          />
        </motion.div>
      )}
    </div>
  );
};
