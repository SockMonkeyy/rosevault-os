interface PhoneFieldProps {
  label: string;
  phoneType: string;
  phoneNumber: string;
  onPhoneTypeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const PHONE_TYPES = [
  { value: "mobile", label: "Mobile" },
  { value: "work", label: "Work" },
  { value: "home", label: "Home" },
  { value: "other", label: "Other" },
];

export default function PhoneField({
  label,
  phoneType,
  phoneNumber,
  onPhoneTypeChange,
  onPhoneNumberChange,
  required = false,
  disabled = false,
}: PhoneFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8F8578]">
        {label}
        {required && (
          <span className="ml-1 text-[#B7832F]">*</span>
        )}
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        <select
          value={phoneType}
          onChange={(e) => onPhoneTypeChange(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10"
        >
          {PHONE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder="(555) 555-5555"
          required={required}
          disabled={disabled}
          className="rounded-md border border-[#E3DCD0] bg-white/70 px-4 py-3 text-sm text-[#29231D] outline-none transition-all duration-300 placeholder:text-[#A89C8D] hover:border-[#CFC5B6] focus:border-[#D8B66A] focus:bg-white focus:ring-2 focus:ring-[#D8B66A]/10"
        />
      </div>
    </div>
  );
}