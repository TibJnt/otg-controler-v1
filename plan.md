# Implementation Plan

## Project Setup & Configuration
- [X] Step 1: Scaffold Next.js workspace and base config
  - **Task**: Initialize a single Next.js (App Router, TypeScript) project with scripts for dev/build/lint/test, env samples, and seed JSON files for devices/automation to satisfy the local-storage constraint.
  - **Files**:
    - `package.json`: scripts (`dev`, `build`, `start`, `lint`, `test`)
    - `.gitignore`: ignore node_modules, .next, env files, logs, screenshots
    - `tsconfig.json`: Next TS config with path aliases for `@/lib`, `@/components`
    - `.env.example`: placeholders `IMOUSE_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, timing defaults
    - `data/devices.json`: initial structure (empty list with sample shape)
    - `data/automation.json`: initial automation config (stopped state, empty triggers)
    - `next.config.js`: enable experimental/edge opts if needed, static asset domains for screenshots
  - **Step Dependencies**: None
  - **User Instructions**: Install Node 20+, run `npm install`; copy `.env.example` to `.env.local` with real values; ensure iMouseXP is reachable at the configured base URL.

## Domain & Persistence (Server-side)
- [X] Step 2: Define domain models and validation schema
  - **Task**: Create shared TypeScript types for devices, coordinates, triggers, automation config, and validation helpers (e.g., zod) to enforce file structure and status values.
  - **Files**:
    - `src/lib/types.ts`: domain types/enums for actions, triggers, automation status
    - `src/lib/schema.ts`: zod schemas and defaults for `devices.json` and `automation.json`
    - `src/lib/config.ts`: config loader (env parsing, defaults for delays/humanization)
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

- [X] Step 3: Implement JSON storage utilities
  - **Task**: Add small file I/O layer for reading/writing `devices.json` and `automation.json` with validation, debounced writes, and safe defaults when files are missing or corrupt.
  - **Files**:
    - `src/lib/storage/jsonStore.ts`: generic read/write with locking
    - `src/lib/storage/deviceStore.ts`: load/save/update helpers for devices
    - `src/lib/storage/automationStore.ts`: load/save helpers for automation config and triggers
  - **Step Dependencies**: Step 2
  - **User Instructions**: None

## External Clients
- [X] Step 4: Build iMouseXP client wrapper
  - **Task**: Implement HTTP client for iMouseXP endpoints (list devices, swipe/scroll, click, keyboard input, screenshot) with retry/error helpers and normalization of API responses.
  - **Files**:
    - `src/lib/clients/imouse.ts`: functions `listDevices`, `swipe`, `click`, `keyboardInput`, `screenshot`
    - `src/lib/utils/http.ts`: shared axios instance with base URL and timeout
  - **Step Dependencies**: Step 3
  - **User Instructions**: Confirm iMouseXP console is running and reachable; adjust base URL/port if non-default.

- [X] Step 5: Build OpenAI Vision client
  - **Task**: Add client to call OpenAI Vision (chat completions with image input), including prompt/template for structured JSON response (caption + topics/keywords) and error shaping.
  - **Files**:
    - `src/lib/clients/vision.ts`: function `analyzeImage(buffer|url)` returning parsed `{ caption, topics }`
    - `src/lib/prompts/visionPrompt.txt`: prompt template for desired JSON output
  - **Step Dependencies**: Step 3
  - **User Instructions**: Ensure `OPENAI_API_KEY` and `OPENAI_MODEL` are set in `.env.local`.

## Services & Automation (Server-side)
- [X] Step 6: Device service and calibration helpers
  - **Task**: Implement device service to refresh from iMouseXP, merge labels, persist to `devices.json`, fetch screenshots, and update normalized coordinates for actions (like/comment/save) with validation against device resolution.
  - **Files**:
    - `src/lib/services/devices.ts`: functions `refreshDevices`, `getDevices`, `updateCoords`, `getScreenshot`
    - `src/lib/utils/coords.ts`: normalize/denormalize coordinate helpers
  - **Step Dependencies**: Steps 4, 3
  - **User Instructions**: None

- [X] Step 7: Automation configuration service
  - **Task**: Manage automation config CRUD (load/save), trigger add/remove/update, device selection, running flag, and defaults for delays/probabilities; include keyword parsing from UI (comma-separated) and validation.
  - **Files**:
    - `src/lib/services/automation.ts`: functions `getAutomation`, `saveAutomation`, `setRunning`, `upsertTrigger`, `removeTrigger`
    - `src/lib/utils/triggers.ts`: keyword normalization, matching helper, probability utilities
  - **Step Dependencies**: Step 3
  - **User Instructions**: None

- [X] Step 8: Automation loop engine (single-runner)
  - **Task**: Implement singleton automation runner that respects the `running` flag, iterates devices sequentially, handles stop requests, and exposes start/stop/status methods; include base timings and random jitter.
  - **Files**:
    - `src/lib/automation/engine.ts`: start/stop/status, main loop coordination
    - `src/lib/automation/types.ts`: runtime state types for loops and results
  - **Step Dependencies**: Steps 6, 7, 4, 5
  - **User Instructions**: None

- [X] Step 9: Action execution and trigger evaluation
  - **Task**: Wire per-device cycle: scroll, delay with jitter, screenshot, vision analysis, trigger matching, action selection (first match), and execution handlers for LIKE/COMMENT/SAVE with optional probabilities and skip logic; log outcomes and errors.
  - **Files**:
    - `src/lib/automation/cycle.ts`: executes single device cycle using services/clients
    - `src/lib/automation/actions.ts`: handlers for like/comment/save (clicks, keyboard input)
    - `src/lib/utils/logger.ts`: timestamped console plus optional file logger
  - **Step Dependencies**: Step 8
  - **User Instructions**: None

## API Layer (Next.js Route Handlers)
- [X] Step 10: REST endpoints via Next route handlers
  - **Task**: Expose JSON APIs for devices, automation config, triggers, screenshots, and start/stop using `/app/api/*` route handlers; include shared error shaping and validation.
  - **Files**:
    - `app/api/devices/route.ts`: GET list, POST refresh
    - `app/api/devices/[id]/coords/route.ts`: POST update coords
    - `app/api/devices/[id]/screenshot/route.ts`: GET screenshot (base64 or URL)
    - `app/api/automation/route.ts`: GET/POST automation config
    - `app/api/automation/start/route.ts`: POST start
    - `app/api/automation/stop/route.ts`: POST stop
    - `app/api/triggers/route.ts`: POST add/update, DELETE remove (payload-driven id)
  - **Step Dependencies**: Steps 6, 7, 8, 9
  - **User Instructions**: None

- [X] Step 11: Healthcheck and logs endpoints
  - **Task**: Add health/status and recent log tail endpoints to support UI status panel; ensure running flag is reflected.
  - **Files**:
    - `app/api/health/route.ts`: GET health/status summary
    - `app/api/logs/route.ts`: GET recent in-memory log buffer or file tail
  - **Step Dependencies**: Step 10
  - **User Instructions**: None

## Frontend Foundation (Next.js App)
- [X] Step 12: Layout and global styles
  - **Task**: Define root layout, globals, and shared UI primitives (buttons, inputs, cards) aligned with a simple control panel feel using the Next App Router.
  - **Files**:
    - `app/layout.tsx`: root layout shell
    - `app/page.tsx`: high-level page container
    - `app/globals.css`: base styles and variables
    - `src/components/ui/*`: simple button/input/select components
  - **Step Dependencies**: Step 1
  - **User Instructions**: Run `npm run dev` after installing deps.

- [X] Step 13: Frontend API client and types
  - **Task**: Add API client using fetch/axios with typed responses matching the backend, shared types for devices/automation/triggers, and hooks for loading/saving data within the Next app.
  - **Files**:
    - `src/lib/api/client.ts`: base HTTP client
    - `src/lib/api/devices.ts`: functions for list/refresh/update coords/screenshot
    - `src/lib/api/automation.ts`: functions for config CRUD/start/stop/status/triggers
    - `src/lib/api/types.ts`: mirrored domain types
  - **Step Dependencies**: Step 12
  - **User Instructions**: None

## Frontend Feature Sections
- [X] Step 14: Select devices panel
  - **Task**: Implement “Select devices” section with refresh button, device list display, checkbox selection persisting to automation config; handle loading/error states.
  - **Files**:
    - `src/components/DeviceSelector.tsx`: UI plus calls to devices API
    - `src/state/useAutomationConfig.ts`: client-side state hook for automation config caching
  - **Step Dependencies**: Step 13
  - **User Instructions**: None

- [X] Step 15: Device action coordinates calibration
  - **Task**: Build calibration UI to fetch a screenshot per device, render in canvas/image overlay, capture click positions, normalize, and save coords to the backend; allow manual X/Y entry as fallback.
  - **Files**:
    - `src/components/CoordinateCalibrator.tsx`: screenshot display and click capture
    - `src/components/CoordinateForm.tsx`: manual coordinate inputs
  - **Step Dependencies**: Step 14
  - **User Instructions**: Ensure the device screen is on and the target app is open before capturing a screenshot.

- [X] Step 16: Automation settings and triggers management
  - **Task**: Implement forms for automation name, intervals, jitter options; build trigger creation form (action dropdown, keywords input, device multi-select, comment templates) and list with delete/edit; persist via API.
  - **Files**:
    - `src/components/AutomationSettings.tsx`: form for general settings
    - `src/components/TriggerForm.tsx`: trigger creation/edit UI
    - `src/components/TriggerList.tsx`: display existing triggers with delete
  - **Step Dependencies**: Step 14
  - **User Instructions**: None

- [X] Step 17: Automation controls, status, and logs
  - **Task**: Add Start/Stop/Emergency Stop controls, show running status and active device, display recent log lines; poll status endpoint to reflect backend state.
  - **Files**:
    - `src/components/AutomationControls.tsx`: start/stop buttons and status indicators
    - `src/components/LogViewer.tsx`: recent logs panel
  - **Step Dependencies**: Step 16
  - **User Instructions**: None

## Testing & Documentation
- [ ] Step 18: Server-side tests and linting
  - **Task**: Add unit tests for trigger matching, coordinate normalization, and automation cycle decision logic; configure lint/format scripts (eslint/prettier) and a CI-friendly test command for Next (Vitest with `testEnvironment: node` for server libs).
  - **Files**:
    - `vitest.config.ts`: test runner config
    - `src/tests/triggers.test.ts`: keyword matching and probability cases
    - `src/tests/coords.test.ts`: normalize/denormalize tests
    - `src/tests/cycle.test.ts`: action selection and skip logic with mocked clients
    - `.eslintrc.cjs`: lint rules
  - **Step Dependencies**: Steps 6, 7, 9
  - **User Instructions**: None

- [ ] Step 19: Frontend smoke tests and docs
  - **Task**: Add minimal component tests or Playwright smoke for critical flows (device refresh, trigger creation, start/stop), and document setup/run instructions plus JSON file schema in README.
  - **Files**:
    - `src/__tests__/flows.test.tsx`: component smoke tests with mocked API
    - `playwright.config.ts`: optional e2e harness placeholder
    - `README.md`: usage, env setup, run commands, troubleshooting, JSON schema reference
  - **Step Dependencies**: Steps 12–17
  - **User Instructions**: Run frontend tests with `npm test`; update README with any Windows-specific iMouseXP setup notes.
