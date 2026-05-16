# Deferred Work

A register of issues raised during code reviews that were intentionally deferred. Each entry should be revisited during retro or future hardening passes.

## Deferred from: code review of story-14.5 (2026-05-16)

- **Test coverage gap: `ExitPromptError` swallow paths in `confirmSuccess()` and `renderUrlScreen()` back prompts** — `src/screens/activate-license.test.ts`. The two helper-level `try/catch (ExitPromptError → return)` blocks are not directly exercised by tests; behavior mirrors `showCoffeeScreen` (which has the same gap). Reason for defer: pattern parity with the existing coffee screen, and the equivalent action-level/input-level Ctrl+C paths are tested. Add focused tests next time the screen is touched.

## Deferred from: code review of story-14.3 (2026-05-16)

- **TOCTOU race on settings in `validateLicenseOnLaunch`** — `src/domain/license-launch.ts:27-35`. Another process mutating `settings.json` between the defensive re-read and `writeSettings` could lose unrelated field updates. Deferred because the codebase has no settings-file locking anywhere, and brain-break's threat model is single-user / single-process. Revisit if multi-instance usage is ever supported.

- **`writeSettings()` Result unchecked in `validateLicenseOnLaunch` revoked path** — `src/domain/license-launch.ts:31`. If `writeSettings` returns `{ok:false}` (e.g. disk full, permission denied), the function still returns `'revoked'` but `settings.license.status` remains `active`. Next launch will re-validate and the user will see the revoked notice again. Spec AC #5 says "Persists" but does not specify write-error UX. Current behavior is benign (the validation result is communicated this session; persistence is best-effort). Future work: at minimum emit a debug log; possibly degrade to `'offline'` if the write fails.
