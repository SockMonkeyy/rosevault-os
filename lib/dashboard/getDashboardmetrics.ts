import { createClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(organizationId: string) {
  const supabase = await createClient();

  // Active Leads
  const { count: activeLeads } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("contact_type", "lead");

  // Under Contract
  const { count: underContract } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "under_contract");

  // Closings This Month
  const today = new Date();

  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const endOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  const { count: closingsThisMonth } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "closed")
    .gte("actual_closing_date", startOfMonth.toISOString())
    .lt("actual_closing_date", endOfMonth.toISOString());

  // Pipeline Value
  const { data: pipelineTransactions } = await supabase
    .from("transactions")
    .select("purchase_price")
    .eq("organization_id", organizationId)
    .in("status", [
      "lead",
      "offer_made",
      "under_contract",
      "due_diligence",
      "clear_to_close",
    ]);

  const pipelineValue =
    pipelineTransactions?.reduce(
      (sum, transaction) => sum + Number(transaction.purchase_price ?? 0),
      0
    ) ?? 0;

  return {
    pipelineValue,
    activeLeads: activeLeads ?? 0,
    underContract: underContract ?? 0,
    closingsThisMonth: closingsThisMonth ?? 0,
  };
}