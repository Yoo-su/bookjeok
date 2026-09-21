import { useTranslations } from "next-intl";

import { Logo } from "@/layouts/common/logo";
import { ArrowLeft } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export default function NotFound() {
  const t = useTranslations("error_pages.not_found");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50/50 px-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10" />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 scale-125">
          <Logo size="md" />
        </div>

        <div className="space-y-6 max-w-md mx-auto p-12 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-stone-200/50">
          <div className="space-y-2">
            <h1 className="text-8xl font-serif font-bold text-stone-900/10 select-none">
              {t("title")}
            </h1>
            <h2 className="text-2xl font-bold text-stone-800">
              {t("subtitle")}
            </h2>
          </div>

          <p
            className="text-stone-600 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: t.raw("description") }}
          />

          <div className="pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20 transition-all hover:-translate-y-0.5"
            >
              <Link href={PATHS.HOME} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t("home_button")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-stone-400 text-xs">
        © Bookjeok. All rights reserved.
      </div>
    </div>
  );
}
