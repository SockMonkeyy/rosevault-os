"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import DataTableToolbar from "./DataTableToolbar";
import DataTablePagination from "./DataTablePagination";
import DataTableSkeleton from "./DataTableSkeleton";
import DataTableEmpty from "./DataTableEmpty";
import DataTableBulkActions from "./DataTableBulkActions";

import { sortRows } from "@/lib/table/sorting";
import { DataTableProps } from "@/lib/table/types";

const PAGE_SIZE = 10;

export default function DataTable<T>({
  data,
  columns,
  loading = false,
  selectable = false,
  bulkActions = [],
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
  rowKey,
  onRowClick,
  onSelectionChange,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  /**
   * Keep selected rows synchronized with the parent.
   */
  useEffect(() => {
    if (!onSelectionChange) return;

    const rows = data.filter((row) =>
      selectedRows.includes(rowKey(row)),
    );

    onSelectionChange(rows);
  }, [selectedRows, data, rowKey, onSelectionChange]);

  /**
   * Selected row data used by bulk actions.
   */
  const selectedData = useMemo(
    () =>
      data.filter((row) =>
        selectedRows.includes(rowKey(row)),
      ),
    [data, selectedRows, rowKey],
  );

  /**
   * Filter rows based on the search query.
   */
  const filtered = useMemo(() => {
    if (!search.trim()) {
      return data;
    }

    const query = search.toLowerCase();

    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query),
    );
  }, [data, search]);

  /**
   * Calculate pagination.
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  /**
   * Sort filtered rows.
   */
  const sorted = useMemo(() => {
    if (!sortColumn) {
      return filtered;
    }

    const column = columns.find(
      (column) => String(column.id) === sortColumn,
    );

    if (!column) {
      return filtered;
    }

    return sortRows(
      filtered,
      column,
      sortDirection,
    );
  }, [
    filtered,
    columns,
    sortColumn,
    sortDirection,
  ]);

  /**
   * Paginate sorted rows.
   */
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE;

    return sorted.slice(start, end);
  }, [sorted, page]);

  /**
   * IDs for all currently filtered rows.
   * Used by the master checkbox.
   */
  const filteredRowIds = useMemo(
    () => filtered.map((row) => rowKey(row)),
    [filtered, rowKey],
  );

  /**
   * Determine whether every filtered row is selected.
   */
  const allFilteredSelected =
    selectable &&
    filteredRowIds.length > 0 &&
    filteredRowIds.every((id) =>
      selectedRows.includes(id),
    );

  /**
   * Determine whether some, but not all, filtered rows
   * are selected.
   */
  const someFilteredSelected =
    selectable &&
    filteredRowIds.some((id) =>
      selectedRows.includes(id),
    ) &&
    !allFilteredSelected;

  /**
   * Toggle the master checkbox.
   */
  const handleSelectAll = (
    checked: boolean,
  ) => {
    if (!checked) {
      setSelectedRows((current) =>
        current.filter(
          (id) => !filteredRowIds.includes(id),
        ),
      );

      return;
    }

    setSelectedRows((current) => [
      ...new Set([
        ...current,
        ...filteredRowIds,
      ]),
    ]);
  };

  /**
   * Toggle an individual row.
   */
  const handleRowSelection = (
    rowId: string,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedRows((current) =>
        current.includes(rowId)
          ? current
          : [...current, rowId],
      );

      return;
    }

    setSelectedRows((current) =>
      current.filter((id) => id !== rowId),
    );
  };

  return (
    <div className="w-full">
      <DataTableToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      {selectable && (
        <DataTableBulkActions
          selectedCount={selectedRows.length}
          selectedRows={selectedData}
          actions={bulkActions}
          onClear={() => setSelectedRows([])}
        />
      )}

      {loading ? (
        <div className="p-6">
          <DataTableSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <DataTableEmpty
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <>
          <div className="max-h-[650px] overflow-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10 border-b border-[#EDE7DC] bg-[#FBF7EF]">
                <tr>
                  {selectable && (
                    <th className="w-12 px-4">
                      <input
                        type="checkbox"
                        aria-label="Select all rows"
                        checked={allFilteredSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate =
                              someFilteredSelected;
                          }
                        }}
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                        onChange={(event) =>
                          handleSelectAll(
                            event.target.checked,
                          )
                        }
                      />
                    </th>
                  )}

                  {columns.map((column) => (
                    <th
                      key={String(column.id)}
                      style={{
                        width: column.width,
                      }}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#8F8578]"
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => {
                            const columnId =
                              String(column.id);

                            if (
                              sortColumn ===
                              columnId
                            ) {
                              setSortDirection(
                                (direction) =>
                                  direction ===
                                  "asc"
                                    ? "desc"
                                    : "asc",
                              );
                            } else {
                              setSortColumn(
                                columnId,
                              );
                              setSortDirection(
                                "asc",
                              );
                            }
                          }}
                          className="inline-flex items-center gap-2 transition hover:text-[#29231D]"
                        >
                          {column.header}

                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginated.map((row) => {
                  const id = rowKey(row);
                  const isSelected =
                    selectedRows.includes(id);

                  return (
                    <tr
                      key={id}
                      onClick={() =>
                        onRowClick?.(row)
                      }
                      className="cursor-pointer border-b border-[#F3EEE5] transition hover:bg-[#FBF7EF]"
                    >
                      {selectable && (
                        <td className="px-4">
                          <input
                            type="checkbox"
                            aria-label={`Select row ${id}`}
                            checked={isSelected}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            onChange={(event) =>
                              handleRowSelection(
                                id,
                                event.target.checked,
                              )
                            }
                          />
                        </td>
                      )}

                      {columns.map((column) => (
                        <td
                          key={String(column.id)}
                          className="px-6 py-4 text-sm text-[#29231D]"
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            page={page}
            totalPages={totalPages}
            onPrevious={() =>
              setPage((currentPage) =>
                Math.max(
                  1,
                  currentPage - 1,
                ),
              )
            }
            onNext={() =>
              setPage((currentPage) =>
                Math.min(
                  totalPages,
                  currentPage + 1,
                ),
              )
            }
          />
        </>
      )}
    </div>
  );
}