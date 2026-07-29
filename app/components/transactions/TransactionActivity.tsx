import { Clock, FileText, Pencil, Trash2 } from "lucide-react";
import { getTransactionDocumentUrl } from "@/app/actions/transactions/getTransactionDocumentUrl";

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: {
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
  } | null;
  user?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface TransactionActivityProps {
  activity: ActivityItem[];
}

function getActivityIcon(activityType: string) {
  switch (activityType) {
    case "note_added":
      return <FileText className="h-4 w-4" />;

    case "note_updated":
      return <Pencil className="h-4 w-4" />;

    case "note_deleted":
      return <Trash2 className="h-4 w-4" />;

    case "field_updated":
      return <Pencil className="h-4 w-4" />;

    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getActivityBadge(activityType: string) {
  switch (activityType) {
    case "note_added":
      return {
        label: "Note Added",
        className: "bg-[#D8B66A]/15 text-[#B7832F] border border-[#D8B66A]/30",
      };

    case "note_updated":
      return {
        label: "Note Edited",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
      };

    case "note_deleted":
      return {
        label: "Note Deleted",
        className: "bg-red-50 text-red-700 border border-red-200",
      };

    case "field_updated":
      return {
        label: "Field Updated",
        className: "bg-[#D8B66A]/15 text-[#B7832F] border border-[#D8B66A]/30",
      };

    default:
      return {
        label: "Activity",
        className: "bg-[#E3DCD0]/40 text-[#7C7265] border border-[#E3DCD0]",
      };
  }
}

const handleView = async (storagePath: string) => {
  try {
    const signedUrl = await getTransactionDocumentUrl(storagePath);

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error(error);
    setMessage("Unable to open document.");
  }
};

function formatActivityDate(date: string) {
  const now = new Date();
  const created = new Date(date);

  const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (typeof value === "string") {
    // ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    function formatFieldName(field?: string) {
      switch (field) {
        case "transaction_name":
          return "Transaction Name";

        case "transaction_type":
          return "Transaction Type";

        case "status":
          return "Status";

        case "purchase_price":
          return "Purchase Price";

        case "sale_price":
          return "Sale Price";

        case "assignment_fee":
          return "Assignment Fee";

        case "closing_date":
          return "Closing Date";

        default:
          return field ?? "";
      }
    }

    // under_contract -> Under Contract
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return String(value);
}

export default function TransactionActivity({
  activity,
}: TransactionActivityProps) {
  if (activity.length === 0) {
    return <p className="text-sm text-[#7C7265]">No activity yet.</p>;
  }

  return (
    <div className="relative space-y-4 before:absolute before:bottom-3 before:top-3 before:left-5 before:w-px before:bg-[#EDE7DC]">
      {activity.map((item) => {
        const userName = item.user
          ? `${item.user.first_name ?? ""} ${item.user.last_name ?? ""}`.trim()
          : "";
        const badge = getActivityBadge(item.activity_type);

        return (
          <div
            key={item.id}
            className="relative flex items-start gap-4 rounded-2xl border border-[#EDE7DC] bg-white/85 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
          >
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D0C0A] text-[#D8B66A] shadow-sm">
              {getActivityIcon(item.activity_type)}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badge.className}`}
                >
                  {badge.label}
                </span>

                <div className="flex items-center gap-1 text-xs text-[#8F8578]">
                  <Clock className="h-3.5 w-3.5 text-[#B7832F]" />
                  <span>{formatActivityDate(item.created_at)}</span>
                </div>
              </div>

              <h4 className="text-sm font-medium text-[#29231D]">
                {item.description}
              </h4>
              {item.activity_type === "field_updated" && item.metadata && (
                <p className="flex items-center gap-2 text-sm">
                  <span className="text-[#8F8578] line-through">
                    {formatMetadataValue(item.metadata.oldValue)}
                  </span>

                  <span className="text-[#B7832F]">→</span>

                  <span className="font-semibold text-[#29231D]">
                    {formatMetadataValue(item.metadata.newValue)}
                  </span>
                </p>
              )}

              {userName && (
                <p className="text-xs text-[#8F8578]">
                  <span className="font-medium text-[#29231D]">{userName}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
