import { Badge } from "@/shared/components/shadcn/badge";
import { PriceDisplay } from "@/shared/components/ui/price-display";

interface BookInfoProps {
  title: string;
  author: string;
  publisher: string;
  price: number;
}

export const BookInfo = ({
  title,
  author,
  publisher,
  price,
}: BookInfoProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="secondary" className="w-fit">
        국내도서
      </Badge>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-gray-900 lg:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {author} 저 | {publisher}
        </p>
      </div>

      <div className="mt-2">
        <PriceDisplay value={price} size="xl" />
      </div>
    </div>
  );
};
