import { checkNickname, updateProfile } from "@bookjeok/api-client";
import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Camera, Loader2, Lock } from "@/shared/components/icons/iconsax";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/shadcn/dialog";
import { Input } from "@/shared/components/shadcn/input";
import { Label } from "@/shared/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { compressImage } from "@/shared/utils/compress-image";
import { API_ERROR_CODES, getErrorCode } from "@/shared/utils/error-handler";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

// 프로필 이미지 업로드 최대 용량 (20MB)
const MAX_PROFILE_IMAGE_SIZE = 20 * 1024 * 1024;

// 기본 프로필 이미지 목록
const DEFAULT_PROFILE_IMAGES = [
  "default_profile1",
  "default_profile2",
  "default_profile3",
  "default_profile4",
  "default_profile5",
  "default_profile6",
  "default_profile7",
  "default_profile8",
  "default_profile9",
  "default_profile10",
];

interface ProfileEditModalProps {
  trigger?: React.ReactNode;
}

/**
 * 프로필 수정 모달
 * - 닉네임, 실명, 이메일(로컬 유저 전용), 성별, 연령대 변경
 * - 프로필 이미지 변경 (커스텀 업로드 또는 기본 이미지 선택)
 */
export const ProfileEditModal = ({ trigger }: ProfileEditModalProps) => {
  const t = useTranslations("my_page.edit_modal");
  const tSignup = useTranslations("auth.signup");
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const accessToken = useAuthStore((state) => state.accessToken);

  // 폼 상태
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<string>("U");
  const [ageRange, setAgeRange] = useState<string>("none");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(
    null,
  );

  // 닉네임 중복 검사 상태
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null,
  );
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nicknameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 모달 열릴 때 초기값 설정
  useEffect(() => {
    if (open && user) {
      setNickname(user.nickname);
      setName(user.name || "");
      setEmail(user.email || "");
      setGender(user.gender || "U");
      setAgeRange(user.ageRange || "none");
      setSelectedImage(user.profileImageUrl);
      setCustomImageFile(null);
      setCustomImagePreview(null);
      setNicknameAvailable(null);
      setNicknameError(null);
    }
  }, [open, user]);

  // 닉네임 변경 시 중복 검사 (debounce)
  useEffect(() => {
    if (!nickname || nickname === user?.nickname) {
      setNicknameAvailable(null);
      setNicknameError(null);
      return;
    }

    // 닉네임 유효성 검사
    if (nickname.length < 2) {
      setNicknameError(t("nickname_min"));
      setNicknameAvailable(null);
      return;
    }
    if (nickname.length > 20) {
      setNicknameError(t("nickname_max"));
      setNicknameAvailable(null);
      return;
    }

    setNicknameError(null);

    // 디바운스 처리
    if (nicknameCheckTimeoutRef.current) {
      clearTimeout(nicknameCheckTimeoutRef.current);
    }

    nicknameCheckTimeoutRef.current = setTimeout(async () => {
      setIsCheckingNickname(true);
      try {
        const result = await checkNickname(nickname);
        setNicknameAvailable(result.available);
        if (!result.available) {
          setNicknameError(t("nickname_taken"));
        }
      } catch {
        setNicknameError(t("nickname_error"));
      } finally {
        setIsCheckingNickname(false);
      }
    }, 500);

    return () => {
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }
    };
  }, [nickname, user?.nickname, t]);

  // 이미지 파일 선택 처리
  const handleImageSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 용량 검사 (20MB)
      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        toast.error(t("image_size_error"));
        return;
      }

      // 이미지 타입 검사
      if (!file.type.startsWith("image/")) {
        toast.error(t("image_type_error"));
        return;
      }

      try {
        // 이미지 압축 (500KB 이하로)
        const compressedFile = await compressImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 512, // 프로필 이미지용으로 작게
        });

        setCustomImageFile(compressedFile);
        setSelectedImage(null); // 기본 이미지 선택 해제

        // 미리보기 생성
        const reader = new FileReader();
        reader.onload = () => {
          setCustomImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch {
        toast.error(t("image_error"));
      }

      // 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [t],
  );

  // 기본 이미지 선택
  const handleDefaultImageSelect = useCallback((imageId: string) => {
    setSelectedImage(imageId);
    setCustomImageFile(null);
    setCustomImagePreview(null);
  }, []);

  // 저장 처리
  const handleSave = useCallback(async () => {
    if (!user) return;

    // 닉네임 변경 시 중복 검사 확인
    if (nickname !== user.nickname && !nicknameAvailable) {
      toast.error(t("nickname_check"));
      return;
    }

    setIsSaving(true);

    try {
      const updateData: {
        nickname?: string;
        name?: string | null;
        email?: string;
        gender?: string | null;
        ageRange?: string | null;
        profileImageUrl?: string;
      } = {};

      // 닉네임 변경
      if (nickname !== user.nickname) {
        updateData.nickname = nickname;
      }

      // 이름 변경
      if (name !== (user.name || "")) {
        updateData.name = name || null;
      }

      // 이메일 변경/등록 (로컬 유저, 카카오 유저, 또는 이메일 미등록 유저)
      const isAllowedToChangeEmail =
        user.provider === "local" || user.provider === "kakao" || !user.email;
      const isEmailChanged =
        isAllowedToChangeEmail && email && email !== user.email;
      if (isEmailChanged) {
        updateData.email = email;
      }

      // 성별 변경
      const mappedGender = gender === "U" || !gender ? null : gender;
      if (mappedGender !== (user.gender || null)) {
        updateData.gender = mappedGender;
      }

      // 연령대 변경
      const mappedAgeRange = ageRange === "none" || !ageRange ? null : ageRange;
      if (mappedAgeRange !== (user.ageRange || null)) {
        updateData.ageRange = mappedAgeRange;
      }

      // 이미지 변경
      if (customImageFile) {
        const filePath = `${user.provider}-${user.id}/profile/${customImageFile.name}`;
        const blob = await upload(filePath, customImageFile, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({
            token: accessToken,
          }),
        });
        updateData.profileImageUrl = blob.url;
      } else if (selectedImage !== user.profileImageUrl) {
        updateData.profileImageUrl = selectedImage || undefined;
      }

      // 변경사항이 있을 때만 저장
      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);

        // zustand 스토어 업데이트
        setUser({
          ...user,
          ...updateData,
          ...(isEmailChanged ? { isEmailVerified: false } : {}),
        });

        if (isEmailChanged) {
          toast.success(t("email_change_success"));
        } else {
          toast.success(t("save_success"));
        }
      }

      setOpen(false);
    } catch (error: unknown) {
      // 서버는 사용자에게 보여줄 한국어 문장을 message로 내려주므로
      // 분기는 code로 한다. (문구로 분기하던 기존 코드는 동작하지 않았다)
      const code = getErrorCode(error);

      if (code === API_ERROR_CODES.NICKNAME_ALREADY_EXISTS) {
        toast.error(t("nickname_taken"));
      } else if (code === API_ERROR_CODES.EMAIL_ALREADY_EXISTS) {
        toast.error(t("email_already_exists"));
      } else {
        toast.error(t("save_error"));
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    nickname,
    name,
    email,
    gender,
    ageRange,
    nicknameAvailable,
    selectedImage,
    customImageFile,
    setUser,
    accessToken,
    t,
  ]);

  if (!user) return null;

  // 현재 표시할 이미지
  const displayImage =
    customImagePreview || getProfileImageUrl(selectedImage) || undefined;

  // 저장 버튼 비활성화 조건
  const isSaveDisabled =
    isSaving ||
    isCheckingNickname ||
    (nickname !== user.nickname && !nicknameAvailable) ||
    !!nicknameError;

  const isLocalUser = user.provider === "local";
  const isEmailEditable =
    isLocalUser || user.provider === "kakao" || !user.email;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {t("edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-22 w-22 border-2 border-stone-200">
                <AvatarImage src={displayImage} alt={nickname} />
                <AvatarFallback className="text-xl">
                  {nickname.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-stone-900 p-2 text-white transition-colors hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {/* 기본 이미지 선택 */}
            <div className="mx-auto grid w-full max-w-[320px] grid-cols-5 gap-2.5 sm:max-w-none sm:gap-3">
              {DEFAULT_PROFILE_IMAGES.map((imageId) => (
                <button
                  key={imageId}
                  type="button"
                  onClick={() => handleDefaultImageSelect(imageId)}
                  className={`relative aspect-square overflow-hidden rounded-full border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    selectedImage === imageId && !customImageFile
                      ? "border-emerald-600 ring-2 ring-emerald-200 ring-offset-1"
                      : "border-stone-100 hover:border-stone-300"
                  }`}
                >
                  <Image
                    src={getProfileImageUrl(imageId) || ""}
                    alt={imageId}
                    fill
                    sizes="(max-width: 640px) 20vw, 40px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 닉네임 */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="nickname"
              className="text-xs font-semibold text-stone-700"
            >
              {t("nickname_label")}
            </Label>
            <div className="relative">
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t("nickname_placeholder")}
                maxLength={20}
                className={`h-10 bg-stone-50 border-stone-200 focus:bg-white text-base md:text-sm ${
                  nicknameError
                    ? "border-red-500 focus-visible:ring-red-200"
                    : nicknameAvailable
                      ? "border-emerald-500 focus-visible:ring-emerald-200"
                      : ""
                }`}
              />
              {isCheckingNickname && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                </div>
              )}
            </div>
            {nicknameError ? (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                {nicknameError}
              </p>
            ) : nicknameAvailable && nickname !== user.nickname ? (
              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="inline-block h-1 w-1 rounded-full bg-emerald-500" />
                {t("nickname_available")}
              </p>
            ) : (
              <p className="text-[11px] text-stone-500">{t("nickname_help")}</p>
            )}
          </div>

          {/* 이름 (실명) */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-semibold text-stone-700"
            >
              {t("name_label")}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name_placeholder")}
              maxLength={50}
              className="h-10 bg-stone-50 border-stone-200 focus:bg-white text-base md:text-sm"
            />
          </div>

          {/* 이메일 */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="email"
                className="text-xs font-semibold text-stone-700"
              >
                {t("email_label")}
              </Label>
              {!isEmailEditable && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                  <Lock className="h-3 w-3" />
                  {t("email_social_notice")}
                </span>
              )}
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEmailEditable}
              placeholder={t("email_placeholder")}
              className={`h-10 text-base md:text-sm ${
                !isEmailEditable
                  ? "bg-stone-100 text-stone-500 cursor-not-allowed border-stone-200"
                  : "bg-stone-50 border-stone-200 focus:bg-white"
              }`}
            />
            {isEmailEditable && email !== (user.email || "") && (
              <p className="text-[11px] text-amber-600">
                {t("email_change_notice")}
              </p>
            )}
          </div>

          {/* 성별 & 연령대 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                {t("gender_label")}
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-10 w-full bg-stone-50 border-stone-200 focus:bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U">
                    {tSignup("options.gender_none")}
                  </SelectItem>
                  <SelectItem value="M">
                    {tSignup("options.gender_m")}
                  </SelectItem>
                  <SelectItem value="F">
                    {tSignup("options.gender_f")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                {t("age_range_label")}
              </Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger className="h-10 w-full bg-stone-50 border-stone-200 focus:bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {tSignup("options.age_none")}
                  </SelectItem>
                  <SelectItem value="0-9">
                    {tSignup("options.age_0_9")}
                  </SelectItem>
                  <SelectItem value="10-19">
                    {tSignup("options.age_10_19")}
                  </SelectItem>
                  <SelectItem value="20-29">
                    {tSignup("options.age_20_29")}
                  </SelectItem>
                  <SelectItem value="30-39">
                    {tSignup("options.age_30_39")}
                  </SelectItem>
                  <SelectItem value="40-49">
                    {tSignup("options.age_40_49")}
                  </SelectItem>
                  <SelectItem value="50-59">
                    {tSignup("options.age_50_59")}
                  </SelectItem>
                  <SelectItem value="60-">
                    {tSignup("options.age_60_")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-stone-100">
          <Button
            variant="outline"
            className="rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100 h-10 text-sm"
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 h-10 text-sm transition-colors"
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
