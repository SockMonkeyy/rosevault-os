"use client";

import {
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import PipelineCard from "./PipelineCard";

import { PipelineCard as Card } from "../types";

interface Props {
  card: Card;
}

export default function DraggablePipelineCard({
  card,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <PipelineCard card={card} />
    </div>
  );
}