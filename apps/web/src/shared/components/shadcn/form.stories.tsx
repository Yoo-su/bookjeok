import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";

import { Button } from "./button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";

interface DemoValues {
  email: string;
  nickname: string;
}

function DemoForm() {
  const form = useForm<DemoValues>({
    defaultValues: { email: "", nickname: "" },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => {})}
        className="mx-auto flex w-full max-w-sm flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "이메일을 입력해 주세요",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "이메일 형식이 아니에요",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input placeholder="book@bookjeok.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nickname"
          rules={{ required: "닉네임을 입력해 주세요" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>닉네임</FormLabel>
              <FormControl>
                <Input placeholder="책벌레" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">제출</Button>
      </form>
    </Form>
  );
}

const meta = {
  title: "Shared/Form/FormControl",
  component: DemoForm,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DemoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 빈 채로 제출하면 오류가 남은 칸만 좌우로 한 번 흔들린다.
 * 한 칸만 채우고 다시 제출하면 남은 칸만 흔들리고, 타이핑 중에는 흔들리지 않는다
 */
export const ShakeOnInvalidSubmit: Story = {};
