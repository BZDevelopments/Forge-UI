import type { ReactNode } from "react";

export interface UploadProgress {
  loaded: number;
  total: number;
}

export interface UploadContext {
  /** Identifies this file across `pause` and `resume` calls. */
  id: string;
  /** Aborted when the user cancels or removes the file. Pass it to `fetch` or XHR. */
  signal: AbortSignal;
  onProgress: (progress: UploadProgress) => void;
}

/** Whatever your backend returns. Stored on the file as `result`. */
export type UploadResult = Record<string, unknown> | void;

/**
 * The only thing Forge UI needs to know about your storage.
 * Implement `upload`; add `pause` and `resume` if your transport supports it (for example tus or S3 multipart).
 */
export interface UploadAdapter {
  upload: (file: File, context: UploadContext) => Promise<UploadResult>;
  pause?: (id: string) => void | Promise<void>;
  resume?: (id: string) => void | Promise<void>;
}

export type UploadStatus =
  | "ready" // validated, waiting for `upload()` when autoUpload is off
  | "queued"
  | "uploading"
  | "paused"
  | "success"
  | "error"
  | "cancelled"
  | "rejected"; // failed validation, never uploaded

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  /** 0 to 100. */
  progress: number;
  loaded: number;
  total: number;
  error?: string;
  result?: UploadResult;
  /** Object URL for image previews. Revoked automatically. */
  previewUrl?: string;
  /** Number of upload attempts so far. */
  attempts: number;
}

export type RejectionReason = "type" | "size" | "count" | "custom";

export interface FileRejection {
  file: File;
  reason: RejectionReason;
  message: string;
}

export interface UploaderMessages {
  invalidType: (file: File, accept: string[]) => string;
  tooLarge: (file: File, maxSize: number) => string;
  tooSmall: (file: File, minSize: number) => string;
  tooMany: (file: File, maxFiles: number) => string;
  uploadFailed: (file: File) => string;
}

export interface UseFileUploaderOptions {
  adapter: UploadAdapter;
  /** MIME types (`image/png`, `image/*`) or extensions (`.pdf`). */
  accept?: string[];
  /** Bytes. */
  maxSize?: number;
  minSize?: number;
  maxFiles?: number;
  /** Allow more than one file. Defaults to `true`. With `false`, a new file replaces the old one. */
  multiple?: boolean;
  /** Start uploading as soon as files are added. Defaults to `true`. */
  autoUpload?: boolean;
  /** Simultaneous uploads. Defaults to 3. */
  concurrency?: number;
  /** Automatic retries after a failed upload. Defaults to 0. */
  maxRetries?: number;
  /** Base delay for retry backoff, in milliseconds. Defaults to 1000. */
  retryDelayMs?: number;
  /** Create object-URL previews for images. Defaults to `true`. */
  previews?: boolean;
  /** Extra validation. Return an error message to reject the file. */
  validate?: (file: File) => string | null | undefined | Promise<string | null | undefined>;
  messages?: Partial<UploaderMessages>;
  onFilesChange?: (files: UploadFile[]) => void;
  onUploadComplete?: (file: UploadFile) => void;
  onUploadError?: (file: UploadFile, error: Error) => void;
  onReject?: (rejections: FileRejection[]) => void;
}

export interface FileUploaderController {
  files: UploadFile[];
  options: UseFileUploaderOptions;
  addFiles: (files: FileList | File[]) => Promise<void>;
  /** Starts every file that is waiting. Needed when `autoUpload` is off. */
  upload: () => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  canPause: boolean;
  isUploading: boolean;
}

interface FileUploaderBaseProps {
  disabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  /** Custom row renderer. Call the provided actions to keep behavior wired up. */
  renderFile?: (file: UploadFile, controller: FileUploaderController) => ReactNode;
  className?: string;
}

/**
 * Pass uploader options directly, or pass a `controller` from `useFileUploader`
 * when other parts of your page need the same state.
 */
export type FileUploaderProps = FileUploaderBaseProps &
  (({ controller?: undefined } & UseFileUploaderOptions) | { controller: FileUploaderController });
