import {
  FileUploader,
  createSimulatedAdapter,
  useFileUploader,
  formatBytes,
} from "@forge-ui/file-uploader";

const adapter = createSimulatedAdapter({ durationMs: 3000 });

// Share one controller between the uploader and the rest of your page.
export default function FileUploaderManual() {
  const controller = useFileUploader({
    adapter,
    autoUpload: false,
    concurrency: 2,
    multiple: true,
  });
  const total = controller.files.reduce((sum, file) => sum + file.file.size, 0);

  return (
    <div className="space-y-3">
      <FileUploader controller={controller} label="Add attachments" />
      <p className="text-sm text-forge-muted">
        {controller.files.length} file(s), {formatBytes(total)} total
        {controller.isUploading ? " · uploading…" : ""}
      </p>
    </div>
  );
}
