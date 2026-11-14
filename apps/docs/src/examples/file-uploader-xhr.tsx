import { FileUploader, createXhrAdapter } from "@forge-ui/file-uploader";

// A production adapter. Tokens come from a function so they are read fresh for every file.
const adapter = createXhrAdapter({
  url: "/api/uploads",
  headers: async () => ({ Authorization: `Bearer ${await getAccessToken()}` }),
  fields: { folder: "avatars" },
  timeoutMs: 60_000,
});

// Pre-signed URL uploads (S3, GCS, R2): ask your server for a URL per file and PUT the raw file.
const presigned = createXhrAdapter({
  url: async (file) =>
    (await fetch(`/api/sign?name=${encodeURIComponent(file.name)}`).then((r) => r.json())).url,
  method: "PUT",
  rawBody: true,
});

declare function getAccessToken(): Promise<string>;

export function Avatars() {
  return (
    <FileUploader
      adapter={adapter}
      accept={["image/png", "image/jpeg"]}
      maxSize={2_000_000}
      multiple={false}
    />
  );
}

export function Documents() {
  return <FileUploader adapter={presigned} accept={[".pdf"]} />;
}
