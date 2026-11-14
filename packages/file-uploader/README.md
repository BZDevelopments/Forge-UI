# @forge-ui/file-uploader

Adapter-based file uploader with validation, previews, progress, retry, cancel, and pause and resume.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/file-uploader @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/file-uploader/styles.css";
```

## Usage

```tsx
import { FileUploader, createXhrAdapter } from "@forge-ui/file-uploader";

<FileUploader
  adapter={createXhrAdapter({ url: "/api/uploads" })}
  accept={["image/*"]}
  maxSize={5_000_000}
/>;
```

Always validate type, size, and content again on your server. Client-side checks are a convenience.

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/file-uploader).

## License

MIT © BZDevelopments
