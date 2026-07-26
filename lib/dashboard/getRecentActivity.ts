import { createClient } from "@/lib/supabase/server";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);

    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

export async function getRecentActivity(organizationId: string) {
  const supabase = await createClient();

  const [contactsResult, propertiesResult, transactionsResult] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("id, first_name, last_name, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("properties")
        .select(
          "id, property_address_line_1, property_city, property_state, created_at",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("transactions")
        .select("id, transaction_name, status, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const activity = [
    ...(contactsResult.data ?? []).map((contact) => ({
      id: contact.id,
      type: "contact",
      title: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
      subtitle: "New contact added",
      created_at: contact.created_at,
      timeAgo: timeAgo(contact.created_at),
    })),

    ...(propertiesResult.data ?? []).map((property) => ({
      id: property.id,
      type: "property",
      title: property.property_address_line_1,
      subtitle: `${property.property_city}, ${property.property_state}`,
      created_at: property.created_at,
      timeAgo: timeAgo(property.created_at),
    })),

    ...(transactionsResult.data ?? []).map((transaction) => ({
      id: transaction.id,
      type: "transaction",
      title: transaction.transaction_name,
      subtitle: transaction.status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase()),
      created_at: transaction.created_at,
      timeAgo: timeAgo(transaction.created_at),
    })),
  ];

  activity.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return activity.slice(0, 10);
}
