import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Button, cn } from "@forge-ui/core";
import { useFileUploader } from "./use-file-uploader";
import { formatBytes } from "./validation";
import type {
  FileUploaderController,
  FileUploaderProps,
  UploadFile,
  UseFileUploaderOptions,
} from "./types";

function statusLabel(file: UploadFile): string {
  switch (file.status) {
    case "ready":
      return "Ready to upload";
    case "queued":
      return "Waiting…";
    case "uploading":
      return `Uploading ${file.progress}%`;
    case "paused":
      return `Paused at ${file.progress}%`;
    case "success":
      return "Uploaded";
    case "cancelled":
      return "Cancelled";
    case "error":
    case "rejected":
      return file.error ?? "Failed";
  }
}

function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1, dot + 5).toUpperCase() : "FILE";
}

function FileRow({ file, controller }: { file: UploadFile; controller: FileUploaderController }) {
  const { status } = file;
  const showProgress = status === "uploading" || status === "paused";
  const failed = status === "error" || status === "rejected";

  return (
    <li className="forge-fu-item" data-status={status}>
      <div className="forge-fu-thumb" aria-hidden="true">
        {file.previewUrl ? (
          <img src={file.previewUrl} alt="" />
        ) : (
          <span>{extension(file.file.name)}</span>
        )}
      </div>
      <div className="forge-fu-body">
        <div className="forge-fu-name" title={file.file.name}>
          {file.file.name}
        </div>
        <div className="forge-fu-meta">
          <span>{formatBytes(file.file.size)}</span>
          <span aria-hidden="true">·</span>
          <span className="forge-fu-status" data-failed={failed || undefined}>
            {statusLabel(file)}
          </span>
        </div>
        {showProgress ? (
          <div
            className="forge-fu-progress"
            role="progressbar"
            aria-label={`Upload progress for ${file.file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={file.progress}
          >
            <div className="forge-fu-progress-bar" style={{ width: `${file.progress}%` }} />
          </div>
        ) : null}
      </div>
      <div className="forge-fu-actions">
        {status === "uploading" && controller.canPause ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => controller.pause(file.id)}
            aria-label={`Pause ${file.file.name}`}
          >
            Pause
          </Button>
        ) : null}
        {status === "paused" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => controller.resume(file.id)}
            aria-label={`Resume ${file.file.name}`}
          >
            Resume
          </Button>
        ) : null}
        {status === "uploading" || status === "paused" || status === "queued" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => controller.cancel(file.id)}
            aria-label={`Cancel upload of ${file.file.name}`}
          >
            Cancel
          </Button>
        ) : null}
        {status === "error" || status === "cancelled" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => controller.retry(file.id)}
            aria-label={`Retry ${file.file.name}`}
          >
            Retry
          </Button>
        ) : null}
        {status !== "uploading" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => controller.remove(file.id)}
            aria-label={`Remove ${file.file.name}`}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </li>
  );
}

interface UploaderViewProps {
  controller: FileUploaderController;
  disabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  renderFile?: FileUploaderProps["renderFile"];
  className?: string;
}

function Uploader({
  controller,
  disabled,
  label,
  description,
  renderFile,
  className,
}: UploaderViewProps) {
  const { options, files } = controller;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const descriptionId = useId();
  const multiple = options.multiple ?? true;
  const waiting = files.filter((file) => file.status === "ready").length;

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (disabled) return;
    void controller.addFiles(event.dataTransfer.files);
  };
  const hint =
    description ??
    [
      options.accept?.length ? `Accepted: ${options.accept.join(", ")}` : null,
      options.maxSize ? `Up to ${formatBytes(options.maxSize)} each` : null,
      options.maxFiles && multiple ? `Max ${options.maxFiles} files` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className={cn("forge-fu", className)} data-disabled={disabled || undefined}>
      {/* Drag and drop is a pointer enhancement. Keyboard and screen reader users use the Browse button. */}
      <div
        className="forge-fu-zone"
        data-dragging={dragging || undefined}
        role="group"
        aria-label="File drop area"
        aria-describedby={hint ? descriptionId : undefined}
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="forge-fu-prompt">
          <strong>{label ?? (multiple ? "Drag files here" : "Drag a file here")}</strong>
          <span>or</span>
          <Button variant="outline" disabled={disabled} onClick={openPicker}>
            {multiple ? "Browse files" : "Browse file"}
          </Button>
        </div>
        {hint ? (
          <p id={descriptionId} className="forge-fu-hint">
            {hint}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          className="forge-sr-only"
          tabIndex={-1}
          aria-hidden="true"
          multiple={multiple}
          accept={options.accept?.join(",")}
          disabled={disabled}
          onChange={(event) => {
            void controller.addFiles(event.target.files ?? []);
            // Allow picking the same file again after removing it.
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <>
          <ul className="forge-fu-list" aria-label="Selected files">
            {files.map((file) =>
              renderFile ? (
                <li key={file.id}>{renderFile(file, controller)}</li>
              ) : (
                <FileRow key={file.id} file={file} controller={controller} />
              ),
            )}
          </ul>
          <div className="forge-fu-footer">
            {waiting > 0 ? (
              <Button variant="solid" onClick={controller.upload}>
                Upload {waiting} {waiting === 1 ? "file" : "files"}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={controller.clear}>
              Clear all
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Drag-and-drop uploader. Bring your own `adapter`; see `createXhrAdapter` for a ready-made one. */
export function FileUploader(props: FileUploaderProps) {
  if (props.controller) {
    const { controller, disabled, label, description, renderFile, className } = props;
    return (
      <Uploader
        controller={controller}
        disabled={disabled}
        label={label}
        description={description}
        renderFile={renderFile}
        className={className}
      />
    );
  }
  return <InternalUploader {...props} />;
}

function InternalUploader(props: FileUploaderProps) {
  const {
    controller: _unused,
    disabled,
    label,
    description,
    renderFile,
    className,
    ...options
  } = props;
  const controller = useFileUploader(options as UseFileUploaderOptions);
  return (
    <Uploader
      controller={controller}
      disabled={disabled}
      label={label}
      description={description}
      renderFile={renderFile}
      className={className}
    />
  );
}
