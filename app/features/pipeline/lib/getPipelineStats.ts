import { PipelineColumn } from "../types";

export function getPipelineStats(
  columns: PipelineColumn[],
) {
  const totalDeals =
    columns.reduce(
      (sum, column) =>
        sum + column.totalDeals,
      0,
    );

  const totalValue =
    columns.reduce(
      (sum, column) =>
        sum + column.totalValue,
      0,
    );

  return {
    totalDeals,

    totalValue,
  };
}