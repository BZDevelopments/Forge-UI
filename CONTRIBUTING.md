# Contributing

Thanks for helping make Forge UI better. This page covers how to set up the repository, what the checks are, and what a good pull request looks like.

## Set up

You need Node.js 20 or newer and pnpm 9.

```bash
git clone https://github.com/bzdevelopments/forge-ui.git
cd forge-ui
pnpm install
pnpm dev
```

`pnpm dev` starts the documentation site, which runs against the package source, so changes appear straight away.

## Repository layout

- `packages/core`: design tokens, hooks, and shared primitives.
- `packages/*`: one package per component, each with `src`, `tests`, and a stylesheet.
- `apps/docs`: the documentation site. Every example there is a real file that is both rendered and shown as code.
- `examples`: a realistic app that consumes the built packages.
- `tests/e2e`: Playwright tests that run against the built docs.

## Checks

Run everything before you open a pull request:

```bash
pnpm check          # type check, lint, format check, unit tests
pnpm build          # build every package and the docs
pnpm test:e2e       # end-to-end tests (run `pnpm exec playwright install chromium` once)
```

Useful individual commands: `pnpm test:watch`, `pnpm format`, and `pnpm vitest run packages/data-table`.

## What every component needs

A change to a component is ready when it has:

- A typed public API with sensible defaults, and controlled and uncontrolled usage where it makes sense.
- Loading, empty, error, and disabled states where they apply.
- Keyboard support and focus management, with screen reader announcements for changes people cannot see.
- Unit tests, including an axe accessibility check, and tests for the edge cases you handled.
- Documentation in `apps/docs/src/docs` and a realistic example in `apps/docs/src/examples`.
- No application-specific logic. Components should work for anyone.

## Writing style

Write comments only when they explain a decision, an edge case, an accessibility requirement, or behavior that is not obvious. Do not restate the code. Documentation and interface text should read like a person wrote it: plain, concrete, and short.

## Pull requests

1. Open an issue first for anything large, so we can agree on the approach.
2. Keep pull requests focused. Several small ones are easier to review than one large one.
3. Add a changeset for any change that affects a published package: run `pnpm changeset`, pick the packages and the bump type, and describe the change for users.
4. Fill in the pull request template, and make sure CI is green.

## Reporting bugs and requesting features

Use the issue templates. For bugs, a minimal reproduction is the most useful thing you can include. For accessibility bugs, tell us the browser, the assistive technology, and what you expected to hear or do. Security problems go through private reporting, described in `SECURITY.md`.

## Releases

Releases use Changesets. Merging pull requests with changesets opens a "Version packages" pull request. Merging that pull request publishes the new versions to npm.

## Code of conduct

Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).
