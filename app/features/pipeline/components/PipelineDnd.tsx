"use client";

import {
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core";

import { moveTransaction } from "../actions/moveTransaction";

import PipelineBoard from "./PipelineBoard";

import { PipelineColumn } from "../types";

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

    if (!over) return;

    const transactionId =
      String(active.id);

    const stage =
      String(over.id);

    await moveTransaction(
      transactionId,
      stage as never,
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