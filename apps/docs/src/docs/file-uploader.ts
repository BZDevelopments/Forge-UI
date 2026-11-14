import type { ComponentDoc } from "./types";
import basic from "../examples/file-uploader-basic.tsx?raw";
import manual from "../examples/file-uploader-manual.tsx?raw";
import xhr from "../examples/file-uploader-xhr.tsx?raw";
import FileUploaderBasic from "../examples/file-uploader-basic";
import FileUploaderManual from "../examples/file-uploader-manual";

export const fileUploader: ComponentDoc = {
  slug: "file-uploader",
  name: "File uploader",
  pkg: "file-uploader",
  summary:
    "Drag-and-drop uploads with validation, image previews, progress, retry, cancel, and optional pause and resume. It is not tied to any storage provider: you supply a small adapter.",
  keywords: ["upload", "file", "dropzone", "drag", "drop", "progress", "s3", "adapter"],
  whenToUse: [
    "People attach files, images, or documents, and you want clear feedback on what was accepted and how far along each upload is.",
    "You upload to your own API, to pre-signed S3, GCS, or R2 URLs, or to a resumable protocol such as tus.",
  ],
  usage: `import { FileUploader, createXhrAdapter } from "@forge-ui/file-uploader";

const adapter = createXhrAdapter({ url: "/api/uploads" });

<FileUploader adapter={adapter} accept={["image/*", ".pdf"]} maxSize={5_000_000} />`,
  examples: [
    {
      id: "basic",
      title: "Validation, progress, retry, and cancel",
      description:
        "Drop files or use Browse. Try a text file (rejected by type), a file whose name contains “fail” (fails, then retries once automatically), or cancel one mid-upload. This demo uses the simulated adapter, so nothing leaves your browser.",
      Component: FileUploaderBasic,
      code: basic,
    },
    {
      id: "controller",
      title: "Manual start and a shared controller",
      description:
        "`useFileUploader` is the headless engine behind the component. Create it yourself when other parts of the page need the state, set `autoUpload: false` for a confirm step, and pass it back with `controller`.",
      Component: FileUploaderManual,
      code: manual,
    },
    {
      id: "adapters",
      title: "Production adapters",
      description:
        "`createXhrAdapter` uses XMLHttpRequest because `fetch` cannot report upload progress. It supports multipart or raw bodies, per-file URLs, dynamic headers, and timeouts. For other transports, implement `upload` (and optionally `pause` and `resume`) yourself.",
      code: xhr,
    },
  ],
  api: [
    {
      title: "FileUploader props",
      description: "Options are shared with `useFileUploader`.",
      rows: [
        {
          name: "adapter",
          type: "UploadAdapter",
          description: "Required (or pass `controller`). Does the actual upload.",
        },
        {
          name: "controller",
          type: "FileUploaderController",
          description: "Use state from `useFileUploader` instead of creating it.",
        },
        {
          name: "accept",
          type: "string[]",
          description: "MIME types (`image/png`, `image/*`) or extensions (`.pdf`).",
        },
        { name: "maxSize / minSize", type: "number", description: "Bytes." },
        {
          name: "maxFiles",
          type: "number",
          description: "Files beyond the limit are rejected with a message.",
        },
        {
          name: "multiple",
          type: "boolean",
          default: "true",
          description: "With `false`, choosing a file replaces the current one.",
        },
        {
          name: "autoUpload",
          type: "boolean",
          default: "true",
          description: "With `false`, files wait for the Upload button or `controller.upload()`.",
        },
        {
          name: "concurrency",
          type: "number",
          default: "3",
          description: "Simultaneous uploads. The rest wait in a queue.",
        },
        {
          name: "maxRetries / retryDelayMs",
          type: "number",
          default: "0 / 1000",
          description: "Automatic retries with exponential backoff.",
        },
        {
          name: "previews",
          type: "boolean",
          default: "true",
          description: "Create object-URL previews for images. They are revoked automatically.",
        },
        {
          name: "validate",
          type: "(file) => string | null | Promise<…>",
          description: "Extra validation. Return a message to reject.",
        },
        {
          name: "messages",
          type: "Partial<UploaderMessages>",
          description: "Override or translate validation messages.",
        },
        {
          name: "onFilesChange / onUploadComplete / onUploadError / onReject",
          type: "callbacks",
          description: "Lifecycle hooks.",
        },
        {
          name: "renderFile",
          type: "(file, controller) => ReactNode",
          description: "Custom row rendering.",
        },
        {
          name: "label / description / disabled / className",
          type: "—",
          description: "Presentation.",
        },
      ],
    },
    {
      title: "UploadAdapter",
      rows: [
        {
          name: "upload",
          type: "(file, { id, signal, onProgress }) => Promise<result>",
          description:
            "Upload the file. Reject on failure. Stop when `signal` aborts. The resolved value is stored as `file.result`.",
        },
        {
          name: "pause / resume",
          type: "(id) => void | Promise<void>",
          description: "Optional. When both exist, Pause and Resume buttons appear.",
        },
      ],
    },
    {
      title: "Controller",
      rows: [
        {
          name: "files",
          type: "UploadFile[]",
          description:
            "Each has `status`, `progress`, `error`, `result`, `previewUrl`, and `attempts`.",
        },
        {
          name: "addFiles / upload / retry / cancel / pause / resume / remove / clear",
          type: "functions",
          description: "Everything the UI can do.",
        },
        { name: "isUploading / canPause", type: "boolean", description: "Derived state." },
      ],
    },
  ],
  keyboard: [
    {
      keys: "Tab, then Enter or Space",
      action: "Activate Browse files to open the system file picker.",
    },
    {
      keys: "Tab through rows",
      action:
        "Pause, Resume, Cancel, Retry, and Remove are buttons with names that include the file name.",
    },
  ],
  accessibility: [
    "Drag and drop is an enhancement. Every action is also available through the Browse button, so keyboard and screen reader users are never blocked.",
    "Accepted files, rejections (with the reason), completion, and failures are announced in live regions. Rejection text is also visible in the list.",
    'Progress uses `role="progressbar"` with a name and value. Status is text, not color alone.',
    'Previews are decorative (`alt=""`), because the file name is already in the row.',
  ],
  customization: [
    "Use `renderFile` for your own rows while keeping the controller's actions, or build a whole new UI with `useFileUploader`.",
    "Restyle with `.forge-fu-*` classes or the `--forge-*` variables.",
  ],
  mistakes: [
    "Trusting `accept` and `maxSize` alone. They are a convenience for users. Validate type, size, and content again on your server.",
    "Putting long-lived secrets in adapter headers. Fetch a short-lived token in the `headers` function instead.",
    "Ignoring `signal` in a custom adapter, so cancelled uploads keep running.",
  ],
};
