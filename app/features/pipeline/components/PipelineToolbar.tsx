"use client";

import { useState } from "react";

import PipelineSearch from "./PipelineSearch";

interface Props {
  onSearch: (query: string) => void;
}

export default function PipelineToolbar({
  onSearch,
}: Props) {
  const [query, setQuery] =
    useState("");

  return (
    <div className="mb-6 flex items-center justify-between">
      <PipelineSearch
        value={query}
        onChange={(value) => {
          setQuery(value);

          onSearch(value);
        }}
      />
    </div>
  );
}