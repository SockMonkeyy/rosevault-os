"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface UpdateTransactionParams {
  transactionId: string;

  transaction_name: string;
  transaction_type: string;
  status: string;

  property_id: string | null;

  purchase_price: number | null;
  sale_price: number | null;
  assignment_fee: number | null;

  closing_date: string | null;
}

type PropertyAddress = {
  id: string;
  property_address_line_1: string | null;
  property_address_line_2: string | null;
  property_city: string | null;
  property_state: string | null;
  property_postal_code: string | null;
};

function formatPropertyAddress(property: PropertyAddress | null) {
  if (!property) {
    return "No property";
  }

  const street = [
    property.property_address_line_1,
    property.property_address_line_2,
  ]
    .filter(Boolean)
    .join(" ");

  const cityStateZip = [
    property.property_city,
    property.property_state,
    property.property_postal_code,
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/,\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/, ", $1 $2");

  return [street, cityStateZip].filter(Boolean).join(", ");
}

export async function updateTransaction(params: UpdateTransactionParams) {
  console.log("updateTransaction() called");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // --------------------------------------------------
  // 1. Get the user's organization
  // --------------------------------------------------

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("Unauthorized organization access.");
  }

  // --------------------------------------------------
  // 2. Fetch the existing transaction
  // --------------------------------------------------

  const { data: existingTransaction, error: existingError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", params.transactionId)
    .eq("organization_id", membership.organization_id)
    .single();

  if (existingError || !existingTransaction) {
    throw new Error("Transaction not found.");
  }

  // --------------------------------------------------
  // 3. Determine which fields changed
  // --------------------------------------------------

  const trackedFields = [
    {
      key: "transaction_name",
      label: "Transaction Name",
    },
    {
      key: "transaction_type",
      label: "Transaction Type",
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "property_id",
      label: "Property",
    },
    {
      key: "purchase_price",
      label: "Purchase Price",
    },
    {
      key: "sale_price",
      label: "Sale Price",
    },
    {
      key: "assignment_fee",
      label: "Assignment Fee",
    },
    {
      key: "closing_date",
      label: "Closing Date",
    },
  ] as const;

  const changes = trackedFields.filter(({ key }) => {
    return existingTransaction[key] !== params[key];
  });

  console.log("Detected changes:", changes);

  // --------------------------------------------------
  // 4. If property changed, load old/new addresses
  // --------------------------------------------------

  let oldProperty: PropertyAddress | null = null;

  let newProperty: PropertyAddress | null = null;

  const propertyChanged =
    existingTransaction.property_id !== params.property_id;

  if (propertyChanged) {
    const propertyIds = [
      existingTransaction.property_id,
      params.property_id,
    ].filter((id): id is string => Boolean(id));

    if (propertyIds.length > 0) {
      const { data: propertyRecords, error: propertyError } = await supabase
        .from("properties")
        .select(
          `
            id,
            property_address_line_1,
            property_address_line_2,
            property_city,
            property_state,
            property_postal_code
          `,
        )
        .eq("organization_id", membership.organization_id)
        .in("id", propertyIds);

      if (propertyError) {
        console.error(
          "Property lookup for activity log failed:",
          propertyError,
        );
      } else {
        oldProperty =
          propertyRecords?.find(
            (property) => property.id === existingTransaction.property_id,
          ) ?? null;

        newProperty =
          propertyRecords?.find(
            (property) => property.id === params.property_id,
          ) ?? null;
      }
    }
  }

  // --------------------------------------------------
  // 5. Update transaction
  // --------------------------------------------------

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      transaction_name: params.transaction_name,

      transaction_type: params.transaction_type,

      status: params.status,

      property_id: params.property_id,

      purchase_price: params.purchase_price,

      sale_price: params.sale_price,

      assignment_fee: params.assignment_fee,

      closing_date: params.closing_date,
    })
    .eq("id", params.transactionId)
    .eq("organization_id", membership.organization_id);

  if (updateError) {
    console.error("Transaction update error:", updateError);

    throw new Error(updateError.message || JSON.stringify(updateError));
  }

  // --------------------------------------------------
  // --------------------------------------------------
  // 6. Log field changes
  // --------------------------------------------------

  for (const change of changes) {
    console.log("Logging activity for:", change);

    let description = `${change.label} changed`;

    let metadata: Record<string, unknown>;

    // ------------------------------------------------
    // Special handling for property changes
    // ------------------------------------------------

    if (change.key === "property_id") {
      const oldAddress = formatPropertyAddress(oldProperty);

      const newAddress = formatPropertyAddress(newProperty);

      if (existingTransaction.property_id && params.property_id) {
        description = `Property changed from ${oldAddress} to ${newAddress}`;
      } else if (!existingTransaction.property_id && params.property_id) {
        description = `Property linked: ${newAddress}`;
      } else if (existingTransaction.property_id && !params.property_id) {
        description = `Property unlinked: ${oldAddress}`;
      }

      metadata = {
        field: "property",
        oldLabel: oldAddress,
        newLabel: newAddress,
      };
    } else {
      // ----------------------------------------------
      // Normal field changes
      // ----------------------------------------------

      metadata = {
        field: change.key,

        oldValue: existingTransaction[change.key],

        newValue: params[change.key],
      };
    }

    const { error: activityError } = await supabase
      .from("activity_log")
      .insert({
        organization_id: membership.organization_id,

        entity_type: "transaction",

        entity_id: params.transactionId,

        activity_type: "field_updated",

        description,

        created_by: user.id,

        metadata,
      });

    if (activityError) {
      console.error("Activity log insert error:", activityError);
    }
  }

  // --------------------------------------------------
  // 7. Refresh related pages
  // --------------------------------------------------

  revalidatePath(`/transactions/${params.transactionId}`);

  revalidatePath("/transactions");

  revalidatePath("/pipeline");

  return {
    success: true,
  };
}
