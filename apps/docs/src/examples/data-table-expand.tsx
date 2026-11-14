import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@forge-ui/data-table";
import { makeCustomers, type Customer } from "./_data";

const columns: DataTableColumn<Customer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "status", header: "Status" },
];

export default function DataTableExpand() {
  const data = useMemo(() => makeCustomers(6), []);
  return (
    <DataTable
      aria-label="Customers with details"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      renderExpandedRow={(row) => (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-forge-muted">Email</dt>
          <dd>{row.original.email}</dd>
          <dt className="text-forge-muted">Customer since</dt>
          <dd>{row.original.joined}</dd>
        </dl>
      )}
    />
  );
}
