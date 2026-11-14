import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@forge-ui/data-table";
import { makeCustomers, type Customer } from "./_data";

const columns: DataTableColumn<Customer>[] = [
  { accessorKey: "id", header: "ID", size: 120 },
  { accessorKey: "name", header: "Name", size: 200 },
  { accessorKey: "email", header: "Email", size: 300 },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "mrr", header: "MRR", meta: { align: "right" } },
  { accessorKey: "joined", header: "Joined" },
];

export default function DataTableLarge() {
  const data = useMemo(() => makeCustomers(50_000), []);
  return (
    <DataTable
      aria-label="Fifty thousand customers"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      virtualized={{ rowHeight: 40 }}
      maxHeight={360}
      density="compact"
      searchable
      resizableColumns
      pinnableColumns
      defaultColumnPinning={{ left: ["id"] }}
    />
  );
}
