import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn, type SortingState } from "@forge-ui/data-table";
import { makeCustomers, sleep, type Customer } from "./_data";

const everyone = makeCustomers(240);

// Stand-in for your API. Replace with fetch("/api/customers?...").
async function fetchCustomers(
  query: { page: number; size: number; sort: SortingState; search: string },
  fail: boolean,
) {
  await sleep(600);
  if (fail) throw new Error("The customers service did not respond.");
  let rows = everyone.filter((c) => c.name.toLowerCase().includes(query.search.toLowerCase()));
  const sort = query.sort[0];
  if (sort) {
    const key = sort.id as keyof Customer;
    rows = [...rows].sort(
      (a, b) =>
        String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true }) *
        (sort.desc ? -1 : 1),
    );
  }
  return {
    rows: rows.slice(query.page * query.size, (query.page + 1) * query.size),
    total: rows.length,
  };
}

const columns: DataTableColumn<Customer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "mrr", header: "MRR", meta: { align: "right" } },
];

export default function DataTableServer() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    fetchCustomers({ page: paging.pageIndex, size: paging.pageSize, sort: sorting, search }, broken)
      .then((result) => {
        if (!current) return; // A newer request replaced this one.
        setRows(result.rows);
        setTotal(result.total);
      })
      .catch((e: Error) => current && setError(e.message))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [paging, sorting, search, broken, attempt]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={broken} onChange={(e) => setBroken(e.target.checked)} />
        Simulate a failing API
      </label>
      <DataTable
        aria-label="Customers from the server"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        serverSide
        rowCount={total}
        loading={loading}
        error={error}
        onRetry={() => setAttempt((n) => n + 1)}
        searchable
        pagination={{ pageSize: 10, pageSizeOptions: [10, 25] }}
        sorting={sorting}
        onSortingChange={setSorting}
        onGlobalFilterChange={setSearch}
        paginationState={paging}
        onPaginationChange={setPaging}
      />
    </div>
  );
}
