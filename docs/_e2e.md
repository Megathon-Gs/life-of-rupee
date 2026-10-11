kit e2e 2026-10-10T14:52:02+00:00

## Running suites concurrently

- Each `E2E_PORT=<port>` run writes artifacts to `test-results-<port>/` (or `E2E_OUTPUT_DIR`), so parallel projects no longer delete each other's traces. Plain `pnpm e2e` still uses `test-results/`.
- Parallel runs share the CPU: cap `--workers` (e.g. `--workers=2`) when running several projects on one host.
- Run Lighthouse CI (`pnpm exec lhci autorun`) alone. Its LCP/FCP assertions use a 4× CPU throttle and fail spuriously when other suites saturate the machine.
