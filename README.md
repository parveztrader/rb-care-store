# RB Care Store

Active site: **WordPress + WooCommerce**, custom `rb-care` theme and `rb-care-commerce` plugin.

| Task | Open / run |
| --- | --- |
| Start | `Start-WordPress.cmd` |
| Stop | `Stop-WordPress.cmd` |
| Automated checks | `Test-WordPress.cmd` |
| Store | http://localhost:8096/ |
| Admin | http://localhost:8096/wp-admin/ |
| Testing handoff | `HANDOFF.md` |
| Local login | `wordpress/dev/private/LOCAL-ACCESS.md` — ignored by Git |

```text
rb-care-store/
├── wordpress/       Active theme, plugin, local environment, tests and tools
├── docs/            Setup, migration history and backend QA results
├── archive/         Preserved Next.js site and its local runtime/data
├── HANDOFF.md       Tester entry point and acceptance steps
└── *-WordPress.cmd  Start / stop / test launchers
```

Docker Desktop runs the site. Node.js is used only by the optional automated tests; the active site has no npm installation step. Normal startup keeps the existing database/settings. On a new empty local installation, the launcher installs the store and imports the four seed products.

The storefront design is unchanged. Legacy source, dependencies, cache, environment and local files are preserved in `archive/nextjs-2026-10-30/`; the old port-3000 server is stopped. The archive is excluded from WordPress release packages. See `docs/SETUP.md` for deployment details and `docs/REORGANIZATION-2026-10-30.md` for the folder-move record.
