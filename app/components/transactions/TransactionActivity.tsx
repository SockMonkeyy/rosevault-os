import { Clock, FileText } from "lucide-react";

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface TransactionActivityProps {
  activity: ActivityItem[];
}

export default function TransactionActivity({
  activity,
}: TransactionActivityProps) {
  if (activity.length === 0) {
    return (
      <p className="text-sm text-[#7C7265]">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activity.map((item) => {
        const userName = item.user
          ? `${item.user.first_name ?? ""} ${item.user.last_name ?? ""}`.trim()
          : "";

        return (
          <div
            key={item.id}
            className="flex gap-4 rounded-xl border border-[#EDE7DC] bg-[#FBF7EF] p-4"
          >
            <div className="mt-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D0C0A] text-[#D8B66A]">
                <FileText className="h-4 w-4" />
              </div>
            </div>

            <div className="flex-1">
              <h4 className="font-medium text-[#29231D]">
                {item.description}
              </h4>

              <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-wider text-[#8F8578]">
                <span>{item.activity_type.replaceAll("_", " ")}</span>
                {userName && (
                  <>
                    <span>•</span>
                    <span>{userName}</span>
                  </>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-[#8F8578]">
                <Clock className="h-3.5 w-3.5" />
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}