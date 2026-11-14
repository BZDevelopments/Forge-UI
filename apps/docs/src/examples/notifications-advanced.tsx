import { useState } from "react";
import { Button } from "@forge-ui/core";
import { notify } from "@forge-ui/notifications";

export default function NotificationsAdvanced() {
  const [items, setItems] = useState(["Invoice #1042", "Invoice #1043"]);

  const remove = (name: string) => {
    const index = items.indexOf(name);
    setItems((list) => list.filter((item) => item !== name));
    notify.success(`${name} deleted`, {
      duration: 8000,
      undo: () => setItems((list) => [...list.slice(0, index), name, ...list.slice(index)]),
    });
  };

  const upload = () => {
    const id = notify.loading("Uploading report.pdf", { progress: 0 });
    let progress = 0;
    const timer = setInterval(() => {
      progress += 12;
      if (progress >= 100) {
        clearInterval(timer);
        notify.update(id, {
          variant: "success",
          title: "report.pdf uploaded",
          progress: undefined,
          duration: 4000,
        });
      } else {
        notify.update(id, { progress });
      }
    }, 250);
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-md border border-forge-border px-3 py-2 text-sm"
          >
            {item}
            <Button size="sm" variant="danger" onClick={() => remove(item)}>
              Delete
            </Button>
          </li>
        ))}
        {items.length === 0 ? <li className="text-sm text-forge-muted">Nothing left.</li> : null}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button onClick={upload}>Upload with progress</Button>
        <Button
          onClick={() =>
            Array.from({ length: 6 }, (_, i) =>
              notify(`Queued notification ${i + 1}`, { duration: 4000 }),
            )
          }
        >
          Queue six
        </Button>
        <Button variant="ghost" onClick={() => notify.dismiss()}>
          Dismiss all
        </Button>
      </div>
    </div>
  );
}
