# Copilot Instructions for This Workshop

## Objective
Build a procurement management system with core modules for Purchase Requisition (PR), Purchase Order (PO), and Goods Receipt (GR).
A procurement system manages how a company buys things, with control and traceability from request to receiving.

The modules for a MVP (minimum viable product) procurement system include:
- **Purchase Requisition (PR)**: Employees request items/services, which are reviewed and approved by managers.
- **Purchase Order (PO)**: Approved requisitions are converted into purchase orders sent to suppliers, tracking order details and status.
- **Goods Receipt (GR)**: When items are delivered, a goods receipt is created to confirm what was received, update inventory, and trigger payment.

In this workshop, we focus on using a prebuilt baseline and a add a backlog sprint.

Reference plan: `docs/plan.md`.

## Agent Execution Guidance
- When running shell/CLI commands, always run them through the visible terminal tool/canvas rather than a hidden background shell, so the participant can watch command output live. This applies to any CLI-style operation, including but not limited to:
  - Directory/file listing (`tree`, `ls -la`)
  - Reading file contents
  - Code search (`grep`, `rg`)
  - Running tests (`npm run test`)
  - HTTP requests (`curl <url>`)

## Scope Constraints (Strict)
- Baseline provided in repo: database schema + Home/Dashboard + PR module (list/create/detail + required PR APIs).
- Participant implementation scope: PO module only (PO list/create/detail + PO APIs + PO validations).
- GR module is out of implementation scope during the workshop and treated as further exploration.
- Keep business scope minimal and teachable.
- Avoid enterprise-only features (SSO, workflow engine, reporting, notifications, advanced compliance).
- Prefer clarity and small modules over abstraction-heavy architecture.

## Technology Decisions (Do Not Change)
- Backend: Fastify + JavaScript
- API style: REST JSON
- Database: PostgreSQL (Docker local)
- Frontend: Vue 3 + Vite + JavaScript
- Unit test: Jest
- E2E test: Playwright
- Do not use Prisma.

## API Requirements
- Maintain compatibility with endpoints listed in `docs/plan.md`.
- For participant backlog, prioritize PO endpoints:
	- `POST /api/purchase-orders`
	- `POST /api/purchase-orders/:id/submit`
	- `GET /api/purchase-orders/:id`
	- `GET /api/purchase-orders/:id/open-lines`
- Enforce PO rule: allocation qty <= PR line remaining qty.
- GR endpoints/rules can be left untouched during workshop implementation.

## Code Style Guidance
- Keep files short and readable for workshop participants.
- Use explicit naming; avoid clever patterns.
- Include basic request validation and clear error responses.
- Favor service functions for business rules and thin route handlers.

## Testing Expectations
- Add focused Jest tests for PO business validations (especially over-allocation and status transition).
- Add Playwright coverage focused on PO pages/flow integrated with existing baseline PR data.
- Do not over-invest in test framework complexity.

## User Interface Guidelines
- Follow the existing UI patterns established in the baseline for consistency.
- Always respect the CSS variables set in the baseline for colors, spacing, and typography.
- Never use emojis in the UI or commit messages. Create a custom SVG icon if needed for visual emphasis.

## Definition of Done Checklist

Before considering a PO task complete, confirm all of the following:

**Implementation Quality**
- [ ] Stays within Scope Constraints (PO-only; no GR/SSO/reporting/notifications creep)
- [ ] Follows Technology Decisions (Fastify + JS, REST JSON, PostgreSQL, Vue 3 + Vite, no Prisma)
- [ ] Business rules live in service functions; route handlers stay thin
- [ ] Naming is explicit; no clever or abstraction-heavy patterns
- [ ] New endpoints have request validation and clear error responses
- [ ] PO over-allocation rule enforced (allocation qty <= PR line remaining qty)
- [ ] UI reuses existing CSS variables/patterns; no emojis in UI or commit messages

**Testing Discipline**
- [ ] Jest tests added/updated for new PO business validations (over-allocation, status transitions)
- [ ] Full existing test suite still passes (`npm test` / `npm run test:unit`)
- [ ] Playwright coverage added or updated for any changed PO pages/flows
- [ ] No new test-framework complexity introduced beyond Jest + Playwright

**Documentation Discipline**
- [ ] `docs/plan.md` workshop status updated when a backlog item changes state
- [ ] New/changed API endpoints reflected in `docs/plan.md` API Scope section
- [ ] README/AGENTS.md updated only if scope or tech decisions actually changed
- [ ] Commit messages are clear, emoji-free, and explain why, not just what

## Optional Extension
- Bookmark feature (PR|PO|GR) is an optional post-backlog exercise and should be driven via GitHub Issue creation workflow.

## Codebase Context & Knowledge Graph Protocol

Some environments may provide a pre-computed AST knowledge graph at `graphify-out/graph.json`. When it is present, use it to minimize context window clutter, prevent hallucinations, and accurately map cross-file dependencies. On fresh clones where the file is absent, fall back to direct repository inspection (`glob`, `rg`, `view`) and do not assume the artifact exists.

1. **Consult the Graph First When Available:** Before writing plans, making sweeping structural modifications, or tracing function call blast-radii, read `graphify-out/graph.json` if it exists. Filter nodes to only those whose `id` paths start with `backend/` or `frontend/src/` — nodes from `playwright-report/`, `test-results/`, and `coverage/` are minified build artifacts and must be ignored.
2. **Identify God Nodes:** Rank nodes by edge degree. The highest-degree nodes are the structural hubs (e.g., service files, route registries). Avoid duplicating responsibilities already owned by a god node.
3. **Trace Structural Paths:** If the user asks about relationships between modules or layers (e.g., how the API layer reaches the DB), do not grep blindly. Traverse the `links` array in `graph.json` to find the actual dependency path.
4. **Graph State:** The graph is derived strictly via AST extraction — no documentation or semantic layer. Treat all node hierarchies and import edges as 100% extracted truth (`EXTRACTED` confidence tier). Do not infer structure that isn't in the graph.

## Workshop-First Principle
When there is a trade-off between production robustness and workshop clarity, choose workshop clarity.
