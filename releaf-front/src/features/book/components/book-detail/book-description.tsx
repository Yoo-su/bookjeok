interface BookDescriptionProps {
  description: string;
}

export const BookDescription = ({ description }: BookDescriptionProps) => {
  return (
    <div className="space-y-4 text-base leading-relaxed text-gray-700">
      <h3 className="text-lg font-semibold">작품 소개</h3>
      <p className="whitespace-pre-wrap">{description}</p>
    </div>
  );
};
