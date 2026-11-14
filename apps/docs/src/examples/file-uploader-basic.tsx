import { FileUploader, createSimulatedAdapter } from "@forge-ui/file-uploader";
import { notify } from "@forge-ui/notifications";

// The simulated adapter uploads nothing. Swap in createXhrAdapter for a real endpoint.
const adapter = createSimulatedAdapter({
  durationMs: 2500,
  failWhen: (file) => file.name.toLowerCase().includes("fail"),
});

export default function FileUploaderBasic() {
  return (
    <FileUploader
      adapter={adapter}
      accept={["image/*", ".pdf"]}
      maxSize={5 * 1024 * 1024}
      maxFiles={5}
      maxRetries={1}
      retryDelayMs={600}
      onUploadComplete={(file) => notify.success(`${file.file.name} uploaded`)}
      onReject={(rejections) => notify.warning(`${rejections.length} file(s) were not added`)}
    />
  );
}
