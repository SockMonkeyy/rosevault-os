import { Search } from "lucide-react";

export default function SearchInput({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8578]"
        size={18}
      />

      <input
        {...props}
        className="w-full rounded-lg border border-[#E3DCD0] bg-white py-2 pl-10 pr-4 outline-none transition focus:border-[#B7832F]"
      />
    </div>
  );
}