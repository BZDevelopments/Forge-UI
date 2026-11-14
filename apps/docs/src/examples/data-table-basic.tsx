import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@forge-ui/data-table";
import { makeCustomers, type Customer } from "./_data";

const columns: DataTableColumn<Customer>[] = [
  { accessorKey: "name", header: "Name", size: 200 },
  { accessorKey: "email", header: "Email", size: 280, meta: { hideBelow: 700 } },
  {
    accessorKey: "plan",
    header: "Plan",
    meta: {
      filterOptions: ["Free", "Pro", "Team", "Enterprise"].map((p) => ({ label: p, value: p })),
    },
    filterFn: "equalsString",
  },
  {
    accessorKey: "mrr",
    header: "MRR",
    meta: { align: "right", exportValue: (row: Customer) => row.mrr },
    cell: ({ getValue }) => `$${getValue<number>()}`,
  },
  { accessorKey: "joined", header: "Joined" },
];

export default function DataTableBasic() {
  const data = useMemo(() => makeCustomers(87), []);
  return (
    <DataTable
      aria-label="Customers"
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      searchable
      filterable
      selectable
      pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 32] }}
      exportable={{ filename: "customers" }}
    />
  );
}
