import { ReactNode } from "react";

export interface DataTableColumn<T> {
  id: keyof T | string;

  header: string;

  width?: string;

  sortable?: boolean;

  className?: string;

  sortValue?: (row: T) => string | number | Date | null;

  cell: (row: T) => ReactNode;
}

export interface DataTableBulkAction<T> {
  label: string;

  onClick: (rows: T[]) => void;

  variant?: "default" | "danger";
}

export interface DataTableProps<T> {
  data: T[];

  columns: DataTableColumn<T>[];

  emptyTitle?: string;

  emptyDescription?: string;

  loading?: boolean;

  selectable?: boolean;

  bulkActions?: DataTableBulkAction<T>[];

  rowKey: (row: T) => string;

  onRowClick?: (row: T) => void;

  onSelectionChange?: (rows: T[]) => void;
}
