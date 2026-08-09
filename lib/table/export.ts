export function exportRowsToCsv<T>(
  rows: T[],
  filename: string,
) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0] as object);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];

          if (value === null || value === undefined) {
            return "";
          }

          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.csv`;

  link.click();

  URL.revokeObjectURL(url);
}