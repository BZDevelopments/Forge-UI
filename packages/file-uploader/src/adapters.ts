import type { UploadAdapter, UploadResult } from "./types";

export interface XhrAdapterOptions {
  /** Endpoint, or a function that builds one per file (for example a pre-signed URL). */
  url: string | ((file: File) => string | Promise<string>);
  method?: "POST" | "PUT" | "PATCH";
  /** Form field name when sending multipart data. Defaults to `file`. */
  fieldName?: string;
  /** Extra form fields for multipart uploads. */
  fields?: Record<string, string> | ((file: File) => Record<string, string>);
  /**
   * Request headers. Use the function form to read a fresh auth token.
   * Never hard-code secrets in client code.
   */
  headers?:
    | Record<string, string>
    | ((file: File) => Record<string, string> | Promise<Record<string, string>>);
  /** Send the raw file as the request body instead of multipart form data (S3 pre-signed PUT, for example). */
  rawBody?: boolean;
  withCredentials?: boolean;
  timeoutMs?: number;
  /** Turns the response into the stored `result`. Defaults to parsing JSON when the response is JSON. */
  parseResponse?: (xhr: XMLHttpRequest) => UploadResult;
}

function defaultParse(xhr: XMLHttpRequest): UploadResult {
  const type = xhr.getResponseHeader("content-type") ?? "";
  if (!type.includes("json")) return undefined;
  try {
    const parsed: unknown = JSON.parse(xhr.responseText);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/** Uploads with `XMLHttpRequest`, because `fetch` cannot report upload progress. */
export function createXhrAdapter(options: XhrAdapterOptions): UploadAdapter {
  return {
    async upload(file, { signal, onProgress }) {
      const url = typeof options.url === "function" ? await options.url(file) : options.url;
      const headers =
        typeof options.headers === "function"
          ? await options.headers(file)
          : (options.headers ?? {});
      if (signal.aborted) throw new DOMException("Upload aborted", "AbortError");

      return new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method ?? "POST", url);
        xhr.withCredentials = Boolean(options.withCredentials);
        if (options.timeoutMs) xhr.timeout = options.timeoutMs;
        for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);

        let body: XMLHttpRequestBodyInit;
        if (options.rawBody) {
          body = file;
        } else {
          const form = new FormData();
          const extra =
            typeof options.fields === "function" ? options.fields(file) : options.fields;
          for (const [key, value] of Object.entries(extra ?? {})) form.append(key, value);
          form.append(options.fieldName ?? "file", file);
          body = form;
        }

        const onAbort = () => xhr.abort();
        signal.addEventListener("abort", onAbort, { once: true });
        const cleanup = () => signal.removeEventListener("abort", onAbort);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress({ loaded: event.loaded, total: event.total });
        };
        xhr.onload = () => {
          cleanup();
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress({ loaded: file.size, total: file.size });
            resolve((options.parseResponse ?? defaultParse)(xhr));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => {
          cleanup();
          reject(new Error("Network error during upload"));
        };
        xhr.ontimeout = () => {
          cleanup();
          reject(new Error("Upload timed out"));
        };
        xhr.onabort = () => {
          cleanup();
          reject(new DOMException("Upload aborted", "AbortError"));
        };
        xhr.send(body);
      });
    },
  };
}

export interface SimulatedAdapterOptions {
  /** Total time for a successful upload, in milliseconds. Defaults to 1500. */
  durationMs?: number;
  /** Decide which files fail, for demos of the error and retry flow. */
  failWhen?: (file: File, attempt: number) => boolean;
}

/**
 * An in-memory adapter that reports progress on a timer and supports pause and resume.
 * It uploads nothing. Use it for demos, tests, and local development.
 */
export function createSimulatedAdapter(options: SimulatedAdapterOptions = {}): UploadAdapter {
  const duration = options.durationMs ?? 1500;
  const paused = new Set<string>();
  const attempts = new Map<string, number>();
  const steps = 20;

  return {
    upload(file, { id, signal, onProgress }) {
      const attempt = (attempts.get(file.name) ?? 0) + 1;
      attempts.set(file.name, attempt);
      return new Promise<UploadResult>((resolve, reject) => {
        let step = 0;
        const timer = setInterval(() => {
          if (paused.has(id)) return;
          step += 1;
          onProgress({ loaded: Math.round((file.size * step) / steps), total: file.size });
          if (options.failWhen?.(file, attempt) && step >= steps / 2) {
            clearInterval(timer);
            reject(new Error("Simulated network failure"));
          } else if (step >= steps) {
            clearInterval(timer);
            resolve({ url: `memory://${encodeURIComponent(file.name)}` });
          }
        }, duration / steps);
        signal.addEventListener(
          "abort",
          () => {
            clearInterval(timer);
            paused.delete(id);
            reject(new DOMException("Upload aborted", "AbortError"));
          },
          { once: true },
        );
      });
    },
    pause: (id) => void paused.add(id),
    resume: (id) => void paused.delete(id),
  };
}
