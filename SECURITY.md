# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report them privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**
(<https://github.com/bzdevelopments/forge-ui/security/advisories/new>). Include what you found, the affected package and version, and steps to
reproduce it if you can.

We aim to acknowledge reports within three working days and to share a plan or a fix within two weeks. We will credit you in the release notes
unless you prefer to stay anonymous.

## Supported versions

Forge UI is pre-1.0. Security fixes go into the latest minor release.

## What we consider in scope

- Cross-site scripting through any component's rendering of data, including user-provided strings.
- Unsafe handling of file names, URLs, or HTML in the file uploader, timeline, notifications, and tables.
- CSV injection in the data table export.
- Prototype pollution or unsafe object handling in form field paths and schema errors.
- Dependencies with known vulnerabilities that affect published packages.

## Security-sensitive extension points

These accept code or content from you. Treat what flows through them as part of your application's trusted surface:

- **Upload adapters** run your upload logic. Never put long-lived secrets in client code. Use short-lived tokens or pre-signed URLs, and validate every file on the server again.
- **Render props** (`renderOption`, `renderCard`, `renderEvent`, `render`) return React nodes. Do not pass untrusted strings to `dangerouslySetInnerHTML` inside them.
- **`formatDate`, `formatTimestamp`, `messages`, and `labels`** produce text that is shown to users. Escape nothing yourself: Forge UI renders text as text.
- **`onExport`** receives the generated CSV. If you send it elsewhere, apply the same care as any user data.

Forge UI renders all data as text nodes and never builds HTML from strings.
