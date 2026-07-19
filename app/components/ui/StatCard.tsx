interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  subtitle,
}: Props) {
  return (
    <div className="rounded-xl border border-[#E3DCD0] bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8F8578]">
        {label}
      </p>

      <h2 className="mt-2 font-serif text-3xl text-[#29231D]">
        {value}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-[#8F8578]">
          {subtitle}
        </p>
      )}
    </div>
  );
}