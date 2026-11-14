import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { announce } from "@forge-ui/core";
import { defaultMessages, matchesAccept } from "./validation";
import type {
  FileRejection,
  FileUploaderController,
  UploadFile,
  UseFileUploaderOptions,
} from "./types";

type Action =
  | { type: "add"; items: UploadFile[] }
  | { type: "patch"; id: string; patch: Partial<UploadFile> }
  | { type: "remove"; id: string }
  | { type: "replace"; items: UploadFile[] }
  | { type: "clear" };

function reducer(state: UploadFile[], action: Action): UploadFile[] {
  switch (action.type) {
    case "add":
      return [...state, ...action.items];
    case "replace":
      return action.items;
    case "patch":
      return state.map((file) => (file.id === action.id ? { ...file, ...action.patch } : file));
    case "remove":
      return state.filter((file) => file.id !== action.id);
    case "clear":
      return [];
  }
}

let counter = 0;
const nextId = () => `forge-file-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const ACTIVE: UploadFile["status"][] = ["queued", "uploading", "paused"];

/**
 * Headless uploader state: validation, a concurrency-limited queue, retries, cancel, and pause/resume.
 * `FileUploader` renders on top of this, and you can render your own UI with it too.
 */
export function useFileUploader(options: UseFileUploaderOptions): FileUploaderController {
  const [files, dispatch] = useReducer(reducer, []);
  const filesRef = useRef(files);
  filesRef.current = files;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const controllers = useRef(new Map<string, AbortController>());
  const startedAttempts = useRef(new Set<string>());
  const retryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const concurrency = Math.max(1, options.concurrency ?? 3);

  const revoke = (file: UploadFile | undefined) => {
    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
  };

  const patch = useCallback((id: string, partial: Partial<UploadFile>) => {
    dispatch({ type: "patch", id, patch: partial });
  }, []);

  const start = useCallback(
    async (item: UploadFile) => {
      const attemptKey = `${item.id}:${item.attempts}`;
      if (startedAttempts.current.has(attemptKey)) return;
      startedAttempts.current.add(attemptKey);

      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      const attempts = item.attempts + 1;
      patch(item.id, { status: "uploading", progress: 0, loaded: 0, error: undefined, attempts });

      const { adapter, maxRetries = 0, retryDelayMs = 1000, messages } = optionsRef.current;
      try {
        const result = await adapter.upload(item.file, {
          id: item.id,
          signal: controller.signal,
          onProgress: ({ loaded, total }) => {
            if (controller.signal.aborted) return;
            const size = total || item.file.size || 1;
            patch(item.id, {
              loaded,
              total: size,
              progress: Math.min(100, Math.round((loaded / size) * 100)),
            });
          },
        });
        if (controller.signal.aborted) return;
        patch(item.id, { status: "success", progress: 100, result });
        announce(`${item.file.name} uploaded`);
        optionsRef.current.onUploadComplete?.({
          ...item,
          status: "success",
          progress: 100,
          result,
          attempts,
        });
      } catch (cause) {
        if (controller.signal.aborted) {
          if (controller.signal.reason === "cancel") {
            patch(item.id, { status: "cancelled", error: undefined });
            announce(`Upload of ${item.file.name} cancelled`);
          }
          return;
        }
        const error = cause instanceof Error ? cause : new Error(String(cause));
        if (attempts <= maxRetries) {
          const delay = retryDelayMs * 2 ** (attempts - 1);
          patch(item.id, { status: "queued", error: undefined });
          // Hold the slot until the timer fires so the scheduler does not restart it immediately.
          startedAttempts.current.add(`${item.id}:${attempts}`);
          retryTimers.current.set(
            item.id,
            setTimeout(() => {
              retryTimers.current.delete(item.id);
              startedAttempts.current.delete(`${item.id}:${attempts}`);
              dispatch({ type: "patch", id: item.id, patch: {} });
            }, delay),
          );
          return;
        }
        const message = (messages?.uploadFailed ?? defaultMessages.uploadFailed)(item.file);
        patch(item.id, { status: "error", error: message });
        announce(message, "assertive");
        optionsRef.current.onUploadError?.(
          { ...item, status: "error", error: message, attempts },
          error,
        );
      } finally {
        if (controllers.current.get(item.id) === controller) controllers.current.delete(item.id);
      }
    },
    [patch],
  );

  // Scheduler: fill free slots with queued files.
  useEffect(() => {
    const active = files.filter((file) => file.status === "uploading").length;
    let free = concurrency - active;
    for (const file of files) {
      if (free <= 0) break;
      if (file.status === "queued" && !startedAttempts.current.has(`${file.id}:${file.attempts}`)) {
        void start(file);
        free -= 1;
      }
    }
  }, [files, concurrency, start]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    optionsRef.current.onFilesChange?.(files);
  }, [files]);

  // Clean up network work, timers, and object URLs on unmount.
  useEffect(() => {
    const controllerMap = controllers.current;
    const timers = retryTimers.current;
    return () => {
      for (const controller of controllerMap.values()) controller.abort("unmount");
      for (const timer of timers.values()) clearTimeout(timer);
      for (const file of filesRef.current) revoke(file);
    };
  }, []);

  const addFiles = useCallback(async (input: FileList | File[]) => {
    const opts = optionsRef.current;
    const messages = { ...defaultMessages, ...opts.messages };
    const incoming = Array.from(input);
    if (incoming.length === 0) return;

    const multiple = opts.multiple ?? true;
    let existing = filesRef.current;
    if (!multiple) {
      // Single-file mode replaces whatever is there.
      for (const file of existing) {
        controllers.current.get(file.id)?.abort("remove");
        revoke(file);
      }
      existing = [];
      dispatch({ type: "clear" });
    }
    const limit = multiple ? opts.maxFiles : 1;
    let slotsLeft =
      limit === undefined
        ? Infinity
        : limit - existing.filter((f) => f.status !== "rejected").length;

    const rejections: FileRejection[] = [];
    const items: UploadFile[] = [];
    const initialStatus = (opts.autoUpload ?? true) ? "queued" : "ready";

    for (const file of incoming) {
      let rejection: FileRejection | undefined;
      if (!matchesAccept(file, opts.accept)) {
        rejection = {
          file,
          reason: "type",
          message: messages.invalidType(file, opts.accept ?? []),
        };
      } else if (opts.maxSize !== undefined && file.size > opts.maxSize) {
        rejection = { file, reason: "size", message: messages.tooLarge(file, opts.maxSize) };
      } else if (opts.minSize !== undefined && file.size < opts.minSize) {
        rejection = { file, reason: "size", message: messages.tooSmall(file, opts.minSize) };
      } else if (slotsLeft <= 0) {
        rejection = { file, reason: "count", message: messages.tooMany(file, limit ?? 0) };
      } else if (opts.validate) {
        try {
          const message = await opts.validate(file);
          if (message) rejection = { file, reason: "custom", message };
        } catch (cause) {
          rejection = {
            file,
            reason: "custom",
            message: cause instanceof Error ? cause.message : "Validation failed",
          };
        }
      }

      const base = { id: nextId(), file, progress: 0, loaded: 0, total: file.size, attempts: 0 };
      if (rejection) {
        rejections.push(rejection);
        items.push({ ...base, status: "rejected", error: rejection.message });
      } else {
        slotsLeft -= 1;
        const previewUrl =
          (opts.previews ?? true) && file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined;
        items.push({ ...base, status: initialStatus, previewUrl });
      }
    }

    dispatch({ type: "add", items });
    const accepted = items.length - rejections.length;
    if (rejections.length) {
      opts.onReject?.(rejections);
      announce(rejections.map((r) => r.message).join(" "), "assertive");
    }
    if (accepted) announce(`${accepted} ${accepted === 1 ? "file" : "files"} added`);
  }, []);

  const upload = useCallback(() => {
    for (const file of filesRef.current) {
      if (file.status === "ready") patch(file.id, { status: "queued" });
    }
  }, [patch]);

  const retry = useCallback(
    (id: string) => {
      const file = filesRef.current.find((item) => item.id === id);
      if (!file || (file.status !== "error" && file.status !== "cancelled")) return;
      patch(id, { status: "queued", error: undefined, progress: 0, loaded: 0 });
    },
    [patch],
  );

  const cancel = useCallback(
    (id: string) => {
      const controller = controllers.current.get(id);
      const file = filesRef.current.find((item) => item.id === id);
      if (controller) {
        controller.abort("cancel");
      } else if (file && ACTIVE.includes(file.status)) {
        // Not started yet (queued or waiting on a retry timer).
        clearTimeout(retryTimers.current.get(id));
        retryTimers.current.delete(id);
        patch(id, { status: "cancelled" });
      }
    },
    [patch],
  );

  const pause = useCallback(
    (id: string) => {
      const adapter = optionsRef.current.adapter;
      if (!adapter.pause) return;
      void Promise.resolve(adapter.pause(id)).then(
        () => patch(id, { status: "paused" }),
        (cause: unknown) =>
          patch(id, {
            status: "error",
            error: cause instanceof Error ? cause.message : "Could not pause",
          }),
      );
    },
    [patch],
  );

  const resume = useCallback(
    (id: string) => {
      const adapter = optionsRef.current.adapter;
      if (!adapter.resume) return;
      void Promise.resolve(adapter.resume(id)).then(
        () => patch(id, { status: "uploading" }),
        (cause: unknown) =>
          patch(id, {
            status: "error",
            error: cause instanceof Error ? cause.message : "Could not resume",
          }),
      );
    },
    [patch],
  );

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort("remove");
    clearTimeout(retryTimers.current.get(id));
    retryTimers.current.delete(id);
    revoke(filesRef.current.find((item) => item.id === id));
    dispatch({ type: "remove", id });
  }, []);

  const clear = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort("remove");
    for (const timer of retryTimers.current.values()) clearTimeout(timer);
    retryTimers.current.clear();
    for (const file of filesRef.current) revoke(file);
    dispatch({ type: "clear" });
  }, []);

  const isUploading = files.some((file) => file.status === "uploading" || file.status === "queued");

  return useMemo(
    () => ({
      files,
      options,
      addFiles,
      upload,
      retry,
      cancel,
      pause,
      resume,
      remove,
      clear,
      canPause: Boolean(options.adapter.pause && options.adapter.resume),
      isUploading,
    }),
    // `options` is read through a ref for behavior; it is only exposed here for the UI layer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      files,
      addFiles,
      upload,
      retry,
      cancel,
      pause,
      resume,
      remove,
      clear,
      isUploading,
      options.adapter,
    ],
  );
}
