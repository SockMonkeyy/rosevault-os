type Status = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<Status, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-stone-100 text-stone-700",
};

interface Props {
  status: Status;
  children: React.ReactNode;
}

export default function StatusBadge({
  status,
  children,
}: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {children}
    </span>
  );
}