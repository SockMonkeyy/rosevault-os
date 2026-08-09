import { DataTableColumn } from "./types";

export function sortRows<T>(
  rows: T[],
  column: DataTableColumn<T>,
  direction: "asc" | "desc",
) {
  if (!column.sortValue) {
    return rows;
  }

  return [...rows].sort((a, b) => {
    const left = column.sortValue!(a);
    const right = column.sortValue!(b);

    if (left == null) return 1;
    if (right == null) return -1;

    if (left < right) {
      return direction === "asc" ? -1 : 1;
    }

    if (left > right) {
      return direction === "asc" ? 1 : -1;
    }

    return 0;
  });
}