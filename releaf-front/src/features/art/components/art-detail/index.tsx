// src/features/art/components/art-detail/index.tsx
"use client";

import { Calendar, Clock, MapPin, Ticket, Users } from "lucide-react";
import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";

import { ArtDetailItem } from "../../types";

interface ArtDetailProps {
  art: ArtDetailItem;
}

const InfoCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="bg-white/5 border-white/10 text-gray-200">
    <CardHeader className="flex flex-row items-center gap-4 pb-2">
      <Icon className="w-6 h-6 text-emerald-400" />
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-sm break-words">{children}</CardContent>
  </Card>
);

export const ArtDetail = ({ art }: ArtDetailProps) => {
  const introImages = art.styurls?.styurl
    ? Array.isArray(art.styurls.styurl)
      ? art.styurls.styurl
      : [art.styurls.styurl]
    : [];

  const hasSynopsis = !!art.sty;

  return (
    <div className="bg-gray-900 text-white w-full">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] w-full flex items-end">
        <Image
          src={art.poster}
          alt={art.prfnm}
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 p-8 md:p-12 max-w-5xl mx-auto w-full">
          <Badge
            variant="secondary"
            className="bg-white/10 text-white border-white/20 mb-4"
          >
            {art.genrenm}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight drop-shadow-lg break-words">
            {art.prfnm}
          </h1>
          <p className="mt-2 text-lg text-gray-300 drop-shadow-md break-words">
            {art.fcltynm}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8 md:p-12 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-12">
          {introImages.length > 0 && (
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-4 text-emerald-300">
                공연 장면
              </h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={10}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                className="rounded-lg overflow-hidden"
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

          {hasSynopsis ? (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-emerald-300">
                줄거리
              </h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {art.sty}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden xl:grid">
              <InfoCard icon={Calendar} title="공연 기간">
                <p>
                  {art.prfpdfrom} ~ {art.prfpdto}
                </p>
                <Badge
                  className={`mt-2 ${
                    art.prfstate === "공연중" ? "bg-emerald-500" : "bg-gray-500"
                  }`}
                >
                  {art.prfstate}
                </Badge>
              </InfoCard>
              <InfoCard icon={Clock} title="공연 시간">
                <p>{art.prfruntime}</p>
                <p className="mt-1 text-gray-400 text-xs">{art.dtguidance}</p>
              </InfoCard>
              <InfoCard icon={MapPin} title="장소">
                <p>{art.fcltynm}</p>
                <p className="mt-1 text-gray-400 text-xs">{art.area}</p>
              </InfoCard>
              <InfoCard icon={Ticket} title="티켓 정보">
                <p>{art.pcseguidance}</p>
                <p className="mt-1">
                  <strong>연령:</strong> {art.prfage}
                </p>
              </InfoCard>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {hasSynopsis || (
            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-6 xl:hidden">
              <InfoCard icon={Calendar} title="공연 기간">
                <p>
                  {art.prfpdfrom} ~ {art.prfpdto}
                </p>
                <Badge
                  className={`mt-2 ${
                    art.prfstate === "공연중" ? "bg-emerald-500" : "bg-gray-500"
                  }`}
                >
                  {art.prfstate}
                </Badge>
              </InfoCard>
              <InfoCard icon={Clock} title="공연 시간">
                <p>{art.prfruntime}</p>
                <p className="mt-1 text-gray-400 text-xs">{art.dtguidance}</p>
              </InfoCard>
              <InfoCard icon={MapPin} title="장소">
                <p>{art.fcltynm}</p>
                <p className="mt-1 text-gray-400 text-xs">{art.area}</p>
              </InfoCard>
              <InfoCard icon={Ticket} title="티켓 정보">
                <p>{art.pcseguidance}</p>
                <p className="mt-1">
                  <strong>연령:</strong> {art.prfage}
                </p>
              </InfoCard>
            </div>
          )}

          <InfoCard icon={Users} title="출연/제작">
            {art.prfcast && (
              <p>
                <strong>출연:</strong> {art.prfcast}
              </p>
            )}
            {art.prfcrew && (
              <p className="mt-1">
                <strong>제작:</strong> {art.prfcrew}
              </p>
            )}
          </InfoCard>

          {art.relates?.relate && (
            <div>
              <h3 className="text-lg font-semibold mb-2">예매처 바로가기</h3>
              <div className="flex flex-col gap-2">
                {(Array.isArray(art.relates.relate)
                  ? art.relates.relate
                  : [art.relates.relate]
                ).map(
                  (link, i) =>
                    link.relateurl && (
                      <Button
                        asChild
                        variant="outline"
                        key={i}
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                      >
                        <a
                          href={link.relateurl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.relatenm || `예매처 ${i + 1}`}
                        </a>
                      </Button>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
