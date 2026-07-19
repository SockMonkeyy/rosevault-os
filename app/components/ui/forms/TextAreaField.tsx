interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  required = false,
  disabled = false,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
        {label}
        {required && (
          <span className="ml-1 text-[#B7832F]">*</span>
        )}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className="w-full resize-y rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm leading-relaxed text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}