# Directory organization — 2026-10-30

The user clarified that only folders/files should be simplified. The storefront design and the native WordPress/WooCommerce store remain in place.

## Current layout

```text
D:\gravity\rb-care-store\
├── .git/                       Original repository history
├── wordpress/
│   ├── wp-content/             Active custom theme and companion plugin
│   ├── dev/                    Docker, start/stop and ignored private runtime
│   ├── tests/                  WordPress regression and admin QA fixtures
│   ├── tools/                  Packaging, test runner and read-only status helper
│   └── migration/              Sanitized source seed snapshots
├── docs/                       Setup, migration and test evidence
├── archive/nextjs-2026-10-30/   Previous application, runtime and local data
├── README.md                   Short project guide
├── HANDOFF.md                  Testing entry point
├── Start-WordPress.cmd
├── Stop-WordPress.cmd
└── Test-WordPress.cmd
```

## Preserved archive

The previous `app`, `components`, `context`, `lib`, `prisma`, `tests`, documentation, npm manifests/configuration, startup script, original README/handoff, local environment, `.data`, `.next`, `node_modules` and TypeScript build cache were moved into the archive. Private/runtime paths remain ignored by Git. The archive's `SOURCE-MANIFEST.json` records 77 source/config/document SHA-256 values, all verified before and after the move.

Only the identified RB Care Next.js process tree on port 3000 was stopped. An unrelated application on port 3030 was left alone. No Git reset, commit, push or source deletion was performed.

## Active project

WordPress source remains in the same `wordpress` folder, so theme/plugin bind mounts, test paths and the local login path remain stable. Active documentation was consolidated under `docs`. The `rb-care` Docker project and its database/website/private-photo volumes remain the same.

The old automatic `.data` mount and import were removed from normal startup. Existing WordPress settings/data are preserved on Start; demo setup now runs only for a new database or an explicit `-InitializeDemo`. Archived imports remain available through a deliberate one-run CLI volume mount.

The root npm/Next.js files are archived. The WordPress site runs with Docker; only the optional test scripts use the installed Node.js runtime. Three launchers cover Start, Stop and Test without an npm install step.

A private compressed database backup was saved before the directory move at `wordpress/dev/private/backups/before-folder-organization-2026-10-30.sql.gz`. It is excluded from Git and release packages. Store-state comparison files are in ignored `wordpress/dev/reports/reorganization-before.json` and `reorganization-after.json`.

## Testing handoff

`HANDOFF.md` contains startup/login details, the preserved baseline, automated checks, manual frontend/admin acceptance steps, safe fixture cleanup, report expectations and remaining launch work. It is the starting point for the next tester. Historical backend evidence is retained in `docs/BACKEND-QA-2026-10-30.md`.

## Verification after the move

- Archive: 77 source/config/document hashes matched; old runtime/dependencies/private files were moved intact.
- PHP and JavaScript syntax checks passed through the new test launcher target.
- The 48 HTTP and 32 WordPress/WooCommerce assertions passed again (80 total), and their temporary records were removed.
- The read-only store snapshot matched before/after exactly for versions, active theme/plugin, product IDs/SKUs/prices/stock, order IDs/status/totals, user count, seller count and enquiry count.
- WordPress returned HTTP 200 on port 8096; the old RB Care port 3000 was no longer listening.
- The database still uses the original `rb-care_database` volume; the active web container has no `/legacy-data` mount.
- A full Stop/Start cycle succeeded, retained the recorded store baseline and served the preview again. Demo setup was not rerun on the existing database.
- Archived environment/runtime files and active credentials/backup paths remain ignored by Git. Release packages use an explicit WordPress/docs allowlist and exclude the archive and private data.
