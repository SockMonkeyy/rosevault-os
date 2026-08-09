"use client";

import { useMemo, useState } from "react";

import PipelineToolbar from "./PipelineToolbar";

import PipelineDnd from "./PipelineDnd";

import { PipelineColumn } from "../types";

interface Props {
  columns: PipelineColumn[];
}

export default function PipelineWorkspace({
  columns,
}: Props) {
  const [query, setQuery] =
    useState("");

  const filteredColumns =
    useMemo(() => {
      if (!query.trim()) {
        return columns;
      }

      const lower =
        query.toLowerCase();

      return columns.map((column) => ({
        ...column,

        cards: column.cards.filter(
          (card) =>
            card.transactionName
              .toLowerCase()
              .includes(lower) ||
            card.propertyAddress
              ?.toLowerCase()
              .includes(lower),
        ),
      }));
    }, [columns, query]);

  return (
    <>
      <PipelineToolbar
        onSearch={setQuery}
      />

      <PipelineDnd
        columns={filteredColumns}
      />
    </>
  );
}