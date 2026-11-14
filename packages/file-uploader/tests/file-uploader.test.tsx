import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FileUploader,
  createSimulatedAdapter,
  createXhrAdapter,
  formatBytes,
  matchesAccept,
  useFileUploader,
  type UploadAdapter,
  type UploadContext,
} from "../src";

interface Call {
  file: File;
  ctx: UploadContext;
  resolve: (value?: Record<string, unknown>) => void;
  reject: (error: Error) => void;
}

/** An adapter whose uploads stay pending until the test settles them. */
function controllableAdapter(extra: Partial<UploadAdapter> = {}) {
  const calls: Call[] = [];
  const adapter: UploadAdapter = {
    upload: vi.fn(
      (file: File, ctx: UploadContext) =>
        new Promise<Record<string, unknown> | void>((resolve, reject) => {
          calls.push({ file, ctx, resolve: resolve as Call["resolve"], reject });
          ctx.signal.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    ),
    ...extra,
  };
  return { adapter, calls };
}

const png = (name = "photo.png", size = 2048) =>
  new File([new Uint8Array(size)], name, { type: "image/png" });
const pdf = (name = "report.pdf", size = 2048) =>
  new File([new Uint8Array(size)], name, { type: "application/pdf" });

// The live region also repeats announced text, so assert on visible rows by scoping to the list.
const fileList = () => screen.findByRole("list", { name: "Selected files" });

const fileInput = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>("input[type=file]")!;
const user = () => userEvent.setup({ applyAccept: false });

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.useRealTimers());

describe("FileUploader", () => {
  it("shows the drop area with a hint built from the constraints", () => {
    const { adapter } = controllableAdapter();
    render(
      <FileUploader
        adapter={adapter}
        accept={["image/*", ".pdf"]}
        maxSize={5 * 1024 * 1024}
        maxFiles={3}
      />,
    );
    expect(screen.getByRole("group", { name: "File drop area" })).toHaveAccessibleDescription(
      "Accepted: image/*, .pdf · Up to 5 MB each · Max 3 files",
    );
    expect(screen.getByRole("button", { name: "Browse files" })).toBeInTheDocument();
  });

  it("opens the file picker from the button and uploads picked files with progress", async () => {
    const { adapter, calls } = controllableAdapter();
    const onUploadComplete = vi.fn();
    const { container } = render(
      <FileUploader adapter={adapter} onUploadComplete={onUploadComplete} />,
    );

    const click = vi.spyOn(fileInput(container), "click");
    await user().click(screen.getByRole("button", { name: "Browse files" }));
    expect(click).toHaveBeenCalled();

    await user().upload(fileInput(container), png());
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(screen.getByText("photo.png")).toBeInTheDocument();

    act(() => calls[0]!.ctx.onProgress({ loaded: 1024, total: 2048 }));
    const bar = screen.getByRole("progressbar", { name: "Upload progress for photo.png" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("Uploading 50%")).toBeInTheDocument();

    await act(async () => calls[0]!.resolve({ url: "https://cdn.example/photo.png" }));
    expect(await screen.findByText("Uploaded")).toBeInTheDocument();
    expect(onUploadComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        result: { url: "https://cdn.example/photo.png" },
      }),
    );
  });

  it("accepts dropped files and tracks the dragging state", async () => {
    const { adapter, calls } = controllableAdapter();
    render(<FileUploader adapter={adapter} />);
    const zone = screen.getByRole("group", { name: "File drop area" });

    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute("data-dragging");
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute("data-dragging");

    fireEvent.drop(zone, { dataTransfer: { files: [png("dropped.png")] } });
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]!.file.name).toBe("dropped.png");
  });

  describe("validation", () => {
    it("rejects the wrong type, oversize files, and extra files with readable messages", async () => {
      const { adapter, calls } = controllableAdapter();
      const onReject = vi.fn();
      const { container } = render(
        <FileUploader
          adapter={adapter}
          accept={["image/*"]}
          maxSize={4096}
          maxFiles={1}
          onReject={onReject}
        />,
      );
      await user().upload(fileInput(container), [
        pdf("notes.pdf"),
        png("huge.png", 10_000),
        png("one.png"),
        png("two.png"),
      ]);

      await waitFor(() => expect(onReject).toHaveBeenCalled());
      const reasons = onReject.mock.calls[0]![0].map((r: { reason: string }) => r.reason);
      expect(reasons).toEqual(["type", "size", "count"]);
      const list = await fileList();
      expect(within(list).getByText(/notes\.pdf is not an accepted file type/)).toBeInTheDocument();
      expect(
        within(list).getByText("huge.png is too large. The limit is 4 KB."),
      ).toBeInTheDocument();
      expect(within(list).getByText(/two\.png was not added/)).toBeInTheDocument();
      // Only the valid file reaches the adapter.
      expect(calls.map((c) => c.file.name)).toEqual(["one.png"]);
    });

    it("runs custom validation, including async checks", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(
        <FileUploader
          adapter={adapter}
          validate={async (file) =>
            file.name.startsWith("draft") ? "Drafts cannot be uploaded." : null
          }
        />,
      );
      await user().upload(fileInput(container), [png("draft-1.png"), png("final.png")]);
      const list = await screen.findByRole("list", { name: "Selected files" });
      expect(within(list).getByText("Drafts cannot be uploaded.")).toBeInTheDocument();
      await waitFor(() => expect(calls.map((c) => c.file.name)).toEqual(["final.png"]));
    });

    it("rejects files below the minimum size", async () => {
      const { adapter } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} minSize={1024} />);
      await user().upload(fileInput(container), png("tiny.png", 10));
      expect(
        within(await fileList()).getByText("tiny.png is too small. The minimum is 1 KB."),
      ).toBeInTheDocument();
    });

    it("supports translated messages", async () => {
      const { adapter } = controllableAdapter();
      const { container } = render(
        <FileUploader
          adapter={adapter}
          maxSize={10}
          messages={{ tooLarge: (file) => `${file.name}: zu groß` }}
        />,
      );
      await user().upload(fileInput(container), png("a.png"));
      expect(within(await fileList()).getByText("a.png: zu groß")).toBeInTheDocument();
    });
  });

  describe("queue behavior", () => {
    it("limits concurrent uploads and starts the next when one finishes", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} concurrency={2} />);
      await user().upload(fileInput(container), [png("a.png"), png("b.png"), png("c.png")]);

      await waitFor(() => expect(calls).toHaveLength(2));
      expect(screen.getByText("Waiting…")).toBeInTheDocument();
      await act(async () => calls[0]!.resolve());
      await waitFor(() => expect(calls).toHaveLength(3));
    });

    it("waits for a manual start when autoUpload is off", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} autoUpload={false} />);
      await user().upload(fileInput(container), [png("a.png"), png("b.png")]);

      expect(await screen.findAllByText("Ready to upload")).toHaveLength(2);
      expect(calls).toHaveLength(0);
      await user().click(screen.getByRole("button", { name: "Upload 2 files" }));
      await waitFor(() => expect(calls).toHaveLength(2));
    });

    it("replaces the current file in single-file mode", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} multiple={false} />);
      await user().upload(fileInput(container), png("first.png"));
      await waitFor(() => expect(calls).toHaveLength(1));
      await user().upload(fileInput(container), png("second.png"));
      await waitFor(() => expect(screen.queryByText("first.png")).not.toBeInTheDocument());
      expect(screen.getByText("second.png")).toBeInTheDocument();
      expect(calls[0]!.ctx.signal.aborted).toBe(true);
    });
  });

  describe("cancel, retry, and failure", () => {
    it("cancels an upload and lets the user retry it", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} />);
      await user().upload(fileInput(container), png());
      await waitFor(() => expect(calls).toHaveLength(1));

      await user().click(screen.getByRole("button", { name: "Cancel upload of photo.png" }));
      expect(calls[0]!.ctx.signal.aborted).toBe(true);
      expect(await screen.findByText("Cancelled")).toBeInTheDocument();

      await user().click(screen.getByRole("button", { name: "Retry photo.png" }));
      await waitFor(() => expect(calls).toHaveLength(2));
    });

    it("shows an accessible error and retries manually after a failure", async () => {
      const { adapter, calls } = controllableAdapter();
      const onUploadError = vi.fn();
      const { container } = render(
        <FileUploader adapter={adapter} onUploadError={onUploadError} />,
      );
      await user().upload(fileInput(container), png());
      await waitFor(() => expect(calls).toHaveLength(1));

      await act(async () => calls[0]!.reject(new Error("503")));
      expect(
        within(await fileList()).getByText("photo.png could not be uploaded."),
      ).toBeInTheDocument();
      expect(onUploadError).toHaveBeenCalledWith(
        expect.objectContaining({ status: "error" }),
        expect.any(Error),
      );

      await user().click(screen.getByRole("button", { name: "Retry photo.png" }));
      await waitFor(() => expect(calls).toHaveLength(2));
      await act(async () => calls[1]!.resolve());
      expect(await screen.findByText("Uploaded")).toBeInTheDocument();
    });

    it("retries automatically with backoff", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { adapter, calls } = controllableAdapter();
      const { container } = render(
        <FileUploader adapter={adapter} maxRetries={2} retryDelayMs={100} />,
      );
      fireEvent.change(fileInput(container), { target: { files: [png()] } });
      await waitFor(() => expect(calls).toHaveLength(1));

      await act(async () => calls[0]!.reject(new Error("flaky")));
      const list = screen.getByRole("list", { name: "Selected files" });
      expect(within(list).queryByText(/could not be uploaded/)).not.toBeInTheDocument();
      await act(async () => vi.advanceTimersByTimeAsync(120));
      await waitFor(() => expect(calls).toHaveLength(2));

      await act(async () => calls[1]!.reject(new Error("flaky again")));
      await act(async () => vi.advanceTimersByTimeAsync(220));
      await waitFor(() => expect(calls).toHaveLength(3));

      await act(async () => calls[2]!.reject(new Error("still down")));
      expect(await within(list).findByText("photo.png could not be uploaded.")).toBeInTheDocument();
      expect(calls).toHaveLength(3);
    });
  });

  describe("pause and resume", () => {
    it("offers pause and resume when the adapter supports them", async () => {
      const pause = vi.fn();
      const resume = vi.fn();
      const { adapter, calls } = controllableAdapter({ pause, resume });
      const { container } = render(<FileUploader adapter={adapter} />);
      await user().upload(fileInput(container), png());
      await waitFor(() => expect(calls).toHaveLength(1));

      await user().click(screen.getByRole("button", { name: "Pause photo.png" }));
      expect(pause).toHaveBeenCalledWith(calls[0]!.ctx.id);
      expect(await screen.findByText(/Paused at/)).toBeInTheDocument();

      await user().click(screen.getByRole("button", { name: "Resume photo.png" }));
      expect(resume).toHaveBeenCalledWith(calls[0]!.ctx.id);
      expect(await screen.findByText(/Uploading/)).toBeInTheDocument();
    });

    it("hides pause when the adapter cannot pause", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} />);
      await user().upload(fileInput(container), png());
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(screen.queryByRole("button", { name: /Pause/ })).not.toBeInTheDocument();
    });
  });

  describe("previews and cleanup", () => {
    it("previews images only and revokes object URLs on removal", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} />);
      await user().upload(fileInput(container), [png("pic.png"), pdf("doc.pdf")]);
      await waitFor(() => expect(calls).toHaveLength(2));

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(container.querySelectorAll(".forge-fu-thumb img")).toHaveLength(1);
      expect(screen.getByText("PDF")).toBeInTheDocument();

      // Remove is offered once the upload is no longer running, so cancel first.
      await user().click(screen.getByRole("button", { name: "Cancel upload of pic.png" }));
      await user().click(await screen.findByRole("button", { name: "Remove pic.png" }));
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    });

    it("aborts in-flight uploads and revokes previews on unmount", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container, unmount } = render(<FileUploader adapter={adapter} />);
      await user().upload(fileInput(container), png());
      await waitFor(() => expect(calls).toHaveLength(1));
      unmount();
      expect(calls[0]!.ctx.signal.aborted).toBe(true);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    });

    it("can skip previews", async () => {
      const { adapter, calls } = controllableAdapter();
      const { container } = render(<FileUploader adapter={adapter} previews={false} />);
      await user().upload(fileInput(container), png());
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  it("is disabled as a whole", () => {
    const { adapter } = controllableAdapter();
    const { container } = render(<FileUploader adapter={adapter} disabled />);
    expect(screen.getByRole("button", { name: "Browse files" })).toBeDisabled();
    expect(fileInput(container)).toBeDisabled();
  });

  it("clears every file", async () => {
    const { adapter, calls } = controllableAdapter();
    const { container } = render(<FileUploader adapter={adapter} />);
    await user().upload(fileInput(container), [png("a.png"), png("b.png")]);
    await waitFor(() => expect(calls).toHaveLength(2));
    await user().click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.queryByRole("list", { name: "Selected files" })).not.toBeInTheDocument();
    expect(calls.every((call) => call.ctx.signal.aborted)).toBe(true);
  });

  it("can be driven by an external controller and custom rows", async () => {
    const { adapter, calls } = controllableAdapter();
    function Harness() {
      const controller = useFileUploader({ adapter });
      return (
        <>
          <p data-testid="count">{controller.files.length}</p>
          <FileUploader
            controller={controller}
            renderFile={(file) => (
              <span data-testid="custom">
                {file.file.name}:{file.status}
              </span>
            )}
          />
        </>
      );
    }
    const { container } = render(<Harness />);
    await user().upload(fileInput(container), png("custom.png"));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("custom")).toHaveTextContent("custom.png:uploading");
  });

  it("works with the simulated adapter end to end", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = render(
      <FileUploader adapter={createSimulatedAdapter({ durationMs: 200 })} />,
    );
    fireEvent.change(fileInput(container), { target: { files: [png()] } });
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(await screen.findByText("Uploaded")).toBeInTheDocument();
  });

  it("has no obvious accessibility violations, including with files listed", async () => {
    const { adapter, calls } = controllableAdapter();
    const { container } = render(<FileUploader adapter={adapter} accept={["image/*"]} />);
    expect(await axe(container)).toHaveNoViolations();
    await user().upload(fileInput(container), [png("a.png"), pdf("b.pdf")]);
    await waitFor(() => expect(calls).toHaveLength(1));
    const list = screen.getByRole("list", { name: "Selected files" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("helpers", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(-1)).toBe("");
  });

  it("matches accept rules", () => {
    expect(matchesAccept({ name: "a.PNG", type: "image/png" }, ["image/*"])).toBe(true);
    expect(matchesAccept({ name: "a.pdf", type: "" }, [".pdf"])).toBe(true);
    expect(matchesAccept({ name: "a.pdf", type: "application/pdf" }, ["image/png"])).toBe(false);
    expect(matchesAccept({ name: "x", type: "" }, undefined)).toBe(true);
  });
});

describe("createXhrAdapter", () => {
  class FakeXhr {
    static last: FakeXhr;
    upload: {
      onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void;
    } = {};
    headers: Record<string, string> = {};
    status = 0;
    responseText = "";
    withCredentials = false;
    timeout = 0;
    method = "";
    url = "";
    body: unknown;
    onload?: () => void;
    onerror?: () => void;
    onabort?: () => void;
    ontimeout?: () => void;
    constructor() {
      FakeXhr.last = this;
    }
    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }
    getResponseHeader() {
      return "application/json";
    }
    send(body: unknown) {
      this.body = body;
    }
    abort() {
      this.onabort?.();
    }
  }

  beforeEach(() => vi.stubGlobal("XMLHttpRequest", FakeXhr));
  afterEach(() => vi.unstubAllGlobals());

  const context = (signal = new AbortController().signal, onProgress = vi.fn()): UploadContext => ({
    id: "1",
    signal,
    onProgress,
  });

  it("sends multipart form data with headers and reports progress and the parsed response", async () => {
    const onProgress = vi.fn();
    const adapter = createXhrAdapter({
      url: "/api/upload",
      headers: async () => ({ Authorization: "Bearer token" }),
      fields: { folder: "avatars" },
    });
    const promise = adapter.upload(png(), context(undefined, onProgress));
    await vi.waitFor(() => expect(FakeXhr.last?.body).toBeDefined());
    const xhr = FakeXhr.last;
    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("/api/upload");
    expect(xhr.headers.Authorization).toBe("Bearer token");
    const form = xhr.body as FormData;
    expect(form.get("folder")).toBe("avatars");
    expect((form.get("file") as File).name).toBe("photo.png");

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 10, total: 20 });
    expect(onProgress).toHaveBeenCalledWith({ loaded: 10, total: 20 });
    xhr.status = 201;
    xhr.responseText = '{"id":"abc"}';
    xhr.onload?.();
    await expect(promise).resolves.toEqual({ id: "abc" });
  });

  it("sends the raw file for pre-signed PUT uploads", async () => {
    const file = png();
    const adapter = createXhrAdapter({
      url: () => "https://bucket.example/signed",
      method: "PUT",
      rawBody: true,
    });
    void adapter.upload(file, context());
    await vi.waitFor(() => expect(FakeXhr.last?.body).toBeDefined());
    expect(FakeXhr.last.body).toBe(file);
    expect(FakeXhr.last.method).toBe("PUT");
  });

  it("rejects on non-2xx responses, network errors, and aborts", async () => {
    const adapter = createXhrAdapter({ url: "/api/upload" });

    const failed = adapter.upload(png(), context());
    await vi.waitFor(() => expect(FakeXhr.last?.body).toBeDefined());
    FakeXhr.last.status = 500;
    FakeXhr.last.onload?.();
    await expect(failed).rejects.toThrow("status 500");

    const network = adapter.upload(png(), context());
    await vi.waitFor(() => expect(FakeXhr.last?.body).toBeDefined());
    FakeXhr.last.onerror?.();
    await expect(network).rejects.toThrow("Network error");

    const controller = new AbortController();
    const aborted = adapter.upload(png(), context(controller.signal));
    await vi.waitFor(() => expect(FakeXhr.last?.body).toBeDefined());
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ name: "AbortError" });
  });
});
