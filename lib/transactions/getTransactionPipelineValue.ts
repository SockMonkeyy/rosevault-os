export interface TransactionPipelineValueInput {
  transaction_type: string | null;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  assignment_fee: number | string | null;
}

/**
 * Determines the value RoseVault should use when calculating
 * pipeline value for a transaction.
 *
 * Wholesale Assignment → Assignment Fee
 * Sale                → Sale Price
 * Everything else     → Purchase Price
 */
export function getTransactionPipelineValue(
  transaction: TransactionPipelineValueInput,
): number {
  switch (transaction.transaction_type) {
    case "wholesale_assignment":
      return Number(transaction.assignment_fee ?? 0);

    case "sale":
      return Number(transaction.sale_price ?? 0);

    default:
      return Number(transaction.purchase_price ?? 0);
  }
}