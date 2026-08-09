"use client";

import { useEffect, useMemo, useState } from "react";

import DataTableToolbar from "./DataTableToolbar";
import DataTablePagination from "./DataTablePagination";
import DataTableSkeleton from "./DataTableSkeleton";
import DataTableEmpty from "./DataTableEmpty";
import { ArrowUpDown } from "lucide-react";
import { sortRows } from "@/lib/table/sorting";
import DataTableBulkActions from "./DataTableBulkActions";
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

  // Step 11.5 — Notify Parent on Selection Change
  useEffect(() => {
    if (!onSelectionChange) return;

    const rows = data.filter((row) => selectedRows.includes(rowKey(row)));

    onSelectionChange(rows);
  }, [selectedRows, data, rowKey, onSelectionChange]);

  const selectedData = useMemo(
    () => data.filter((row) => selectedRows.includes(rowKey(row))),
    [data, selectedRows, rowKey],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const query = search.toLowerCase();

    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const sorted = useMemo(() => {
    if (!sortColumn) {
      return filtered;
    }

    const column = columns.find((c) => c.id === sortColumn);

    if (!column) {
      return filtered;
    }

    return sortRows(filtered, column, sortDirection);
  }, [filtered, columns, sortColumn, sortDirection]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EDE7DC] bg-white shadow-sm">
      <DataTableToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <DataTableBulkActions
        selectedCount={selectedRows.length}
        selectedRows={selectedData}
        actions={bulkActions}
        onClear={() => setSelectedRows([])}
      />

      {loading ? (
        <div className="p-6">
          <DataTableSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <DataTableEmpty title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="max-h-[650px] overflow-auto">
            {" "}
            <table className="min-w-full">
              <thead className="sticky top-0 z-10 border-b border-[#EDE7DC] bg-[#FBF7EF]">
                {" "}
                <tr>
                  {/* Step 11.6 — Add Master Checkbox Column */}
                  {selectable && (
                    <th className="w-12 px-4">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        checked={
                          data.length > 0 && selectedRows.length === data.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(data.map((row) => rowKey(row)));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
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
                          onClick={() => {
                            if (sortColumn === column.id) {
                              setSortDirection((d) =>
                                d === "asc" ? "desc" : "asc",
                              );
                            } else {
                              setSortColumn(String(column.id));
                              setSortDirection("asc");
                            }
                          }}
                          className="inline-flex items-center gap-2"
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
                {paginated.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className="cursor-pointer border-b border-[#F3EEE5] transition hover:bg-[#FBF7EF]"
                  >
                    {/* Step 11.7 & 11.8 — Add Row Checkbox & Prevent Click Event Bubbling */}
                    {selectable && (
                      <td className="px-4">
                        <input
                          type="checkbox"
                          onClick={(e) => e.stopPropagation()}
                          checked={selectedRows.includes(rowKey(row))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows((rows) => [...rows, rowKey(row)]);
                            } else {
                              setSelectedRows((rows) =>
                                rows.filter((id) => id !== rowKey(row)),
                              );
                            }
                          }}
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
                ))}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            page={page}
            totalPages={totalPages}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </>
      )}
    </div>
  );
}
