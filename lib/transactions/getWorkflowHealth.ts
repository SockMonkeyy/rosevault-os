import { createClient } from "@/lib/supabase/server";

export async function getWorkflowHealth(
  transactionId: string,
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transaction_checklist_items")
    .select("completed")
    .eq("transaction_id", transactionId);

  const total = data?.length ?? 0;

  const completed =
    data?.filter((i) => i.completed).length ?? 0;

  const percent =
    total === 0
      ? 0
      : Math.round(
          (completed / total) * 100,
        );

  if (percent === 100) {
    return {
      status: "healthy",
      color: "green",
    };
  }

  if (percent >= 70) {
    return {
      status: "good",
      color: "gold",
    };
  }

  if (percent >= 40) {
    return {
      status: "warning",
      color: "orange",
    };
  }

  return {
    status: "attention",
    color: "red",
  };
}