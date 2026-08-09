"use client";

import { useState } from "react";

import TransactionTabs, {
  TransactionTab,
} from "./TransactionTabs";

interface Props {
  overview: React.ReactNode;
  workflow: React.ReactNode;
  tasks: React.ReactNode;
  documents: React.ReactNode;
  timeline: React.ReactNode;
  financial: React.ReactNode;
  people: React.ReactNode;
}

export default function TransactionWorkspace({
  overview,
  workflow,
  tasks,
  documents,
  timeline,
  financial,
  people,
}: Props) {
  const [tab, setTab] =
    useState<TransactionTab>(
      "overview"
    );

  return (
    <div className="space-y-6">
      <TransactionTabs
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && overview}

      {tab === "workflow" && workflow}

      {tab === "tasks" && tasks}

      {tab === "documents" && documents}

      {tab === "timeline" && timeline}

      {tab === "financial" && financial}

      {tab === "people" && people}
    </div>
  );
}