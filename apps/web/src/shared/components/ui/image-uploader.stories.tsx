import type { Meta, StoryObj } from "@storybook/react";

import { ImageUploader } from "./image-uploader";

const meta = {
  title: "Shared/UI/ImageUploader",
  component: ImageUploader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    maxFiles: {
      control: { type: "number", min: 1, max: 10 },
      description: "최대 업로드 가능 이미지 수",
    },
  },
} satisfies Meta<typeof ImageUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 빈 상태: 이미지 없음 */
export const Empty: Story = {
  args: {
    previews: [],
    onImagesAdd: () => {},
    onImageRemove: () => {},
    maxFiles: 5,
  },
};

/** 기존 이미지가 있는 수정 모드 */
export const WithExistingImages: Story = {
  args: {
    previews: [],
    existingImages: [
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
    ],
    onImagesAdd: () => {},
    onImageRemove: () => {},
    onExistingImageRemove: () => {},
    maxFiles: 5,
  },
};

/** 최대 개수 도달 (업로드 버튼 숨김) */
export const MaxReached: Story = {
  args: {
    previews: [
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
    ],
    existingImages: [
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
      "https://cdn.bookjeok.com/covers/9788932912363.webp",
    ],
    onImagesAdd: () => {},
    onImageRemove: () => {},
    onExistingImageRemove: () => {},
    maxFiles: 5,
  },
};

/** 최대 3개 제한 */
export const MaxThree: Story = {
  args: {
    previews: ["https://cdn.bookjeok.com/covers/9788932912363.webp"],
    onImagesAdd: () => {},
    onImageRemove: () => {},
    maxFiles: 3,
  },
};
