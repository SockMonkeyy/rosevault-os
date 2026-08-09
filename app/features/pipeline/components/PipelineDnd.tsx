"use client";

import {
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core";

import { moveTransaction } from "../actions/moveTransaction";
import PipelineBoard from "./PipelineBoard";
import { PipelineColumn } from "../types";
import { TransactionStage } from "@/lib/transactions/stages";

interface Props {
  columns: PipelineColumn[];
}

export default function PipelineDnd({
  columns,
}: Props) {
  async function handleDragEnd(
    event: DragEndEvent,
  ) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const transactionId = String(active.id);

    let destinationStageId: string | null = null;

    // First check whether the drop target is a column.
    const destinationColumn = columns.find(
      (column) => column.id === String(over.id),
    );

    if (destinationColumn) {
      destinationStageId = destinationColumn.id;
    }

    // If we dropped onto another transaction card,
    // find which column contains that card.
    if (!destinationStageId) {
      const destinationTransaction = columns.find(
        (column) =>
          column.cards.some(
            (card) => card.id === String(over.id),
          ),
      );

      if (destinationTransaction) {
        destinationStageId =
          destinationTransaction.id;
      }
    }

    // We could not determine a valid destination.
    if (!destinationStageId) {
      console.warn(
        "Unable to determine Pipeline destination:",
        over.id,
      );

      return;
    }

    // Don't make a request if the transaction
    // was dropped back into its existing stage.
    const currentColumn = columns.find(
      (column) =>
        column.cards.some(
          (card) => card.id === transactionId,
        ),
    );

    if (
      currentColumn?.id === destinationStageId
    ) {
      return;
    }

    // Map column ID to a valid database TransactionStage if needed.
    // Adjust this mapping function or lookup object to match your actual database enum/check constraint values.
    const normalizedStage = mapColumnIdToTransactionStage(destinationStageId);

    await moveTransaction(
      transactionId,
      normalizedStage,
    );
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
    >
      <PipelineBoard
        columns={columns}
      />
    </DndContext>
  );
}

/**
 * Ensures column IDs map cleanly to valid database status strings 
 * satisfying your `transactions_status_check` constraint.
 */
function mapColumnIdToTransactionStage(columnId: string): TransactionStage {
  const normalized = columnId.toLowerCase().trim().replace(/\s+/g, "_");
  
  // Add any specific mappings if your column IDs differ from DB status strings
  const stageMapping: Record<string, TransactionStage> = {
    // example: "lead": "lead" as TransactionStage,
    // example: "under-contract": "under_contract" as TransactionStage,
  };

  return (stageMapping[normalized] || normalized) as TransactionStage;
}