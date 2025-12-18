"use client";

import {
  AlertTriangle,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useArtDetailQuery } from "@/features/art/queries";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";

import { ArtDetailSkeleton } from "./skeleton";

interface ArtDetailProps {
  artId: string;
}

// 정보 카드 컴포넌트
const InfoCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="bg-white border-stone-100 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center gap-3 pb-2">
      <div className="p-2 bg-rose-50 rounded-lg">
        <Icon className="w-5 h-5 text-rose-500" />
      </div>
      <CardTitle className="text-base font-semibold text-stone-800">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-stone-600 wrap-break-word">
      {children}
    </CardContent>
  </Card>
);

export const ArtDetail = ({ artId }: ArtDetailProps) => {
  const { data: art, isLoading, isError } = useArtDetailQuery(artId);

  if (isLoading) {
    return <ArtDetailSkeleton />;
  }

  if (isError || !art) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-stone-50 text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          공연 정보를 불러올 수 없습니다.
        </h2>
        <p className="text-sm text-stone-500">
          삭제되었거나 유효하지 않은 정보일 수 있습니다.
        </p>
      </div>
    );
  }

  const introImages = art.styurls?.styurl
    ? Array.isArray(art.styurls.styurl)
      ? art.styurls.styurl
      : [art.styurls.styurl]
    : [];

  const hasSynopsis = !!art.sty;

  return (
    <div className="bg-stone-50 text-stone-900 w-full min-h-screen">
      {/* 히어로 섹션 - 포스터 전체 배경 */}
      <div className="relative min-h-[500px] lg:min-h-[600px] bg-white overflow-hidden">
        {/* 포스터 배경 이미지 */}
        <div className="absolute inset-0 lg:w-2/3">
          <Image
            src={art.poster}
            alt={art.prfnm}
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        {/* PC: 우측으로 페이드되는 그라디언트 오버레이 */}
        <div className="hidden lg:block absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-white" />
        <div className="hidden lg:block absolute inset-0 bg-linear-to-r from-transparent via-transparent to-white" />

        {/* 모바일: 하단 그라디언트 */}
        <div className="lg:hidden absolute inset-0 bg-linear-to-t from-white via-white/50 to-transparent" />

        {/* 콘텐츠 영역 */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 h-full">
          <div className="flex flex-col lg:flex-row lg:items-center min-h-[500px] lg:min-h-[600px]">
            {/* 좌측 여백 (포스터 영역) */}
            <div className="hidden lg:block lg:w-1/3" />

            {/* 정보 영역 - 우측 */}
            <div className="flex-1 py-10 lg:py-16 lg:pl-12">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-rose-100 text-rose-700 border-0 font-medium shadow-sm">
                    {art.genrenm}
                  </Badge>
                  <Badge
                    className={`border-0 font-medium shadow-sm ${
                      art.prfstate === "공연중"
                        ? "bg-emerald-100 text-emerald-700"
                        : art.prfstate === "공연예정"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {art.prfstate}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-stone-900 wrap-break-word mb-4">
                  {art.prfnm}
                </h1>

                <p className="text-lg text-stone-500 mb-6">{art.fcltynm}</p>

                {/* 간략 정보 */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 text-stone-600 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                    <Calendar className="w-5 h-5 text-rose-400" />
                    <div>
                      <p className="text-xs text-stone-400">공연 기간</p>
                      <p className="text-sm font-medium">
                        {art.prfpdfrom} ~ {art.prfpdto}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-stone-600 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                    <Clock className="w-5 h-5 text-rose-400" />
                    <div>
                      <p className="text-xs text-stone-400">러닝타임</p>
                      <p className="text-sm font-medium">{art.prfruntime}</p>
                    </div>
                  </div>
                </div>

                {/* 예매 버튼 */}
                {art.relates?.relate && (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(art.relates.relate)
                      ? art.relates.relate
                      : [art.relates.relate]
                    ).map(
                      (link, i) =>
                        link.relateurl && (
                          <Button
                            asChild
                            key={i}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-6 shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5"
                          >
                            <a
                              href={link.relateurl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                            >
                              {link.relatenm || `예매처 ${i + 1}`}
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽 컬럼 */}
        <div className="lg:col-span-2 space-y-10">
          {/* 공연 장면 슬라이더 */}
          {introImages.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-rose-500 rounded-full" />
                공연 장면
              </h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={12}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                className="rounded-2xl overflow-hidden shadow-sm"
              >
                {introImages.map((imgSrc, index) => (
                  <SwiperSlide key={index} className="aspect-video">
                    <a href={imgSrc} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={imgSrc}
                        alt={`${art.prfnm} 장면 ${index + 1}`}
                        fill
                        className="object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                      />
                    </a>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* 줄거리 */}
          {hasSynopsis && (
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-rose-500 rounded-full" />
                줄거리
              </h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {art.sty}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 컬럼 - 상세 정보 */}
        <div className="space-y-4">
          <InfoCard icon={Calendar} title="공연 기간">
            <p className="font-medium">
              {art.prfpdfrom} ~ {art.prfpdto}
            </p>
            <p className="mt-1 text-xs text-stone-400">{art.dtguidance}</p>
          </InfoCard>

          <InfoCard icon={Clock} title="공연 시간">
            <p className="font-medium">{art.prfruntime}</p>
          </InfoCard>

          <InfoCard icon={MapPin} title="장소">
            <p className="font-medium">{art.fcltynm}</p>
            <p className="mt-1 text-xs text-stone-400">{art.area}</p>
          </InfoCard>

          <InfoCard icon={Ticket} title="티켓 정보">
            <p className="font-medium">{art.pcseguidance}</p>
            <p className="mt-2 text-xs">
              <span className="text-stone-400">관람 연령:</span>{" "}
              <span className="text-stone-600">{art.prfage}</span>
            </p>
          </InfoCard>

          {(art.prfcast || art.prfcrew) && (
            <InfoCard icon={Users} title="출연/제작">
              {art.prfcast && (
                <p>
                  <span className="text-stone-400">출연:</span> {art.prfcast}
                </p>
              )}
              {art.prfcrew && (
                <p className="mt-1">
                  <span className="text-stone-400">제작:</span> {art.prfcrew}
                </p>
              )}
            </InfoCard>
          )}
        </div>
      </div>
    </div>
  );
};
