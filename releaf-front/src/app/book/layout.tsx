import { DefaultLayout } from "@/layouts/default-layout";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
