import { Button } from "@forge-ui/core";
import { notify } from "@forge-ui/notifications";
import { sleep } from "./_data";

async function saveData() {
  await sleep(1500);
  if (Math.random() < 0.35) throw new Error("Server error");
  return { id: 42 };
}

export default function NotificationsBasic() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => notify.success("Saved", { description: "Your changes are live." })}>
        Success
      </Button>
      <Button
        onClick={() =>
          notify.error("Upload failed", { description: "The file is larger than 10 MB." })
        }
      >
        Error
      </Button>
      <Button onClick={() => notify.warning("Storage almost full")}>Warning</Button>
      <Button
        onClick={() =>
          notify.info("A new version is available", {
            action: { label: "Reload", onClick: () => notify.success("Reloaded") },
          })
        }
      >
        Info with action
      </Button>
      <Button
        variant="solid"
        onClick={() =>
          void notify
            .promise(saveData(), {
              loading: "Saving...",
              success: (result) => `Saved record ${result.id}`,
              error: "Unable to save",
            })
            .catch(() => {})
        }
      >
        Promise (may fail)
      </Button>
    </div>
  );
}
