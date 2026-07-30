import { TransactionStage } from "./stages";
import { ensureChecklistForStage } from "./workflow";

export async function seedTransactionChecklist(
  organizationId: string,
  transactionId: string,
  stage: TransactionStage,
) {
  return ensureChecklistForStage(
    organizationId,
    transactionId,
    stage,
  );
}