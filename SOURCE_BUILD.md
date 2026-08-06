# Build instructions for AMO reviewers

This add-on is bundled and minified with [WXT](https://wxt.dev/) (Vite + esbuild),
so the source code is submitted separately as required by
[Source Code Submission](https://extensionworkshop.com/documentation/publish/source-code-submission/).

Following the steps below reproduces the submitted package **byte for byte**.
Verified by building twice on a clean checkout and comparing SHA-256 of every emitted file.

## Environment

| | Version |
| --- | --- |
| OS | Ubuntu 24.04 LTS (also verified on macOS 15 / darwin-arm64) |
| Node.js | 24.x (verified with 24.11.1; the reviewer default 24.14.0 works) |
| Package manager | **pnpm 10.24.0** — pinned in `package.json` via `packageManager` |
| Lockfile | `pnpm-lock.yaml` (included in this archive) |

Only free, open-source tooling is used. Everything runs locally with no network
access beyond the npm registry during install.

## Build

```bash
# 1. Enable pnpm. Node 24 ships with Corepack, so no global install is needed.
corepack enable
corepack prepare pnpm@10.24.0 --activate

# 2. Install dependencies exactly as locked.
pnpm install --frozen-lockfile

# 3. Build the Firefox (MV3) package.
pnpm zip:firefox
```

Output:

```
.output/mojikae-<version>-firefox.zip     <- compare this against the submitted add-on
.output/mojikae-<version>-sources.zip     <- this archive
```

`.output/firefox-mv3/` holds the same files unzipped, which is usually easier to diff:

```bash
unzip -q <submitted.xpi> -d /tmp/submitted
diff -r /tmp/submitted .output/firefox-mv3   # expected: no differences
```

## Notes

- `postinstall` runs `wxt prepare`, which only generates TypeScript types under
  `.wxt/`. It does not download or execute anything else.
- `data/google-fonts.json` is a checked-in snapshot of the Google Fonts catalog.
  It is committed data, not generated at build time, so the build is deterministic
  and needs no API key. It is refreshed by `pnpm fonts:sync`
  (`scripts/sync-google-fonts.ts`), which requires a `GOOGLE_FONTS_API_KEY` and is
  **not** part of the build.
- `scripts/build-logo.mjs` generates `components/Logo.tsx` from the SVG files in
  `assets/`. The generated file is committed, so this step is not part of the build
  either.
- No obfuscation is used. Minification is esbuild's default for production builds.
- This archive contains only what the add-on build uses. Two directories present in the
  public repository are omitted because they sit outside the build entirely: `site/`
  (the product web page) and `store/` (AMO listing copy and screenshots). Neither is
  read, imported, or executed by `pnpm zip:firefox`. The full repository is at
  <https://github.com/sakuyasann/Mojikae>.

## Optional verification

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test        # vitest
```
