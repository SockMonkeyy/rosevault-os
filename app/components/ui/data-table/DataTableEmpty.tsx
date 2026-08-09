interface Props {
  title: string;
  description: string;
}

export default function DataTableEmpty({
  title,
  description,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-[#FBF7EF] p-5">
        <div className="h-8 w-8 rounded-full bg-[#D8B66A]/20" />
      </div>

      <h3 className="mt-6 font-serif text-xl text-[#29231D]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-center text-sm text-[#7C7265]">
        {description}
      </p>
    </div>
  );
}