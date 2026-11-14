import { useMemo, useState } from "react";
import { z } from "zod";
import { ActivityTimeline } from "@forge-ui/activity-timeline";
import { CommandPalette, type Command } from "@forge-ui/command-palette";
import { Button } from "@forge-ui/core";
import { DataTable, type DataTableColumn } from "@forge-ui/data-table";
import { Field, Form, SubmitButton } from "@forge-ui/form";
import { KanbanBoard, type KanbanColumnData } from "@forge-ui/kanban-board";
import { Toaster, notify } from "@forge-ui/notifications";
import { activity, customers, initialBoard, type Customer } from "./data";

type View = "customers" | "tasks" | "activity" | "invite";

const VIEWS: Array<{ id: View; label: string }> = [
  { id: "customers", label: "Customers" },
  { id: "tasks", label: "Tasks" },
  { id: "activity", label: "Activity" },
  { id: "invite", label: "Invite teammate" },
];

const columns: DataTableColumn<Customer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email", meta: { hideBelow: 640 } },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "seats", header: "Seats", meta: { align: "right" } },
];

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, "Enter an email address")
    .email("That does not look like an email address"),
  role: z.enum(["admin", "member"]),
});

export function App() {
  const [view, setView] = useState<View>("customers");
  const [board, setBoard] = useState<KanbanColumnData[]>(initialBoard);

  const commands = useMemo<Command[]>(
    () =>
      VIEWS.map((entry) => ({
        id: `go-${entry.id}`,
        label: `Go to ${entry.label}`,
        group: "Navigation",
        onSelect: () => setView(entry.id),
      })),
    [],
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Acme admin</h1>
        <nav aria-label="Main">
          {VIEWS.map((entry) => (
            <Button
              key={entry.id}
              variant="ghost"
              aria-current={view === entry.id ? "page" : undefined}
              onClick={() => setView(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </nav>
        <p style={{ color: "var(--forge-text-muted)", fontSize: "0.8125rem" }}>
          Press Ctrl or ⌘ K to jump anywhere.
        </p>
      </aside>

      <main>
        {view === "customers" && (
          <>
            <h2>Customers</h2>
            <DataTable
              aria-label="Customers"
              columns={columns}
              data={customers}
              getRowId={(row) => row.id}
              searchable
              selectable
              pagination={{ pageSize: 10 }}
              exportable={{ filename: "customers" }}
              onRowClick={(row) => notify.info(`Opened ${row.name}`)}
            />
          </>
        )}

        {view === "tasks" && (
          <>
            <h2>Tasks</h2>
            <KanbanBoard
              aria-label="Support tasks"
              columns={board}
              onColumnsChange={setBoard}
              onCardMove={async (move) => {
                // Replace with a request to your API. A rejection puts the card back.
                await new Promise((resolve) => setTimeout(resolve, 300));
                notify.success(`Moved “${move.card.title}”`);
              }}
              onMoveError={() => notify.error("Could not save that move")}
            />
          </>
        )}

        {view === "activity" && (
          <>
            <h2>Activity</h2>
            <ActivityTimeline
              events={activity}
              aria-label="Account activity"
              relativeTime
              groupBy="none"
            />
          </>
        )}

        {view === "invite" && (
          <>
            <h2>Invite a teammate</h2>
            <div className="card">
              <Form
                schema={inviteSchema}
                defaultValues={{ email: "", role: "member" }}
                aria-label="Invite a teammate"
                onSubmit={async (values) => {
                  await new Promise((resolve) => setTimeout(resolve, 600));
                  notify.success(`Invitation sent to ${values.email}`);
                }}
              >
                <Field name="email" label="Email" type="email" required />
                <Field name="role" label="Role">
                  {({ field, controlProps }) => (
                    <select
                      {...controlProps}
                      className="forge-input"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </Field>
                <div>
                  <SubmitButton>Send invitation</SubmitButton>
                </div>
              </Form>
            </div>
          </>
        )}
      </main>

      <CommandPalette commands={commands} recent label="Jump to" />
      <Toaster />
    </div>
  );
}
