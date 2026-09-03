# Procurement MVP Runbook: PO Backlog Implementation

**Workshop Duration**: 5 hours  
**Focus Scope**: PO backlog only (not GR or enhancements)  
**Target**: Functional PO module with full test coverage integrated into PR baseline

---

## MVP Validation Verdict

✅ **PLAN IS VALID FOR MVP**

The plan correctly scopes baseline PR module + PO backlog with clear GR out-of-scope.
Database schema and prerequisite APIs exist; implementation is 70% complete and ready to finish.

### Current Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| DB Schema | ✅ Complete | All 7 tables, migrations, seed data ready |
| PR Module | ✅ Complete | Baseline; list/create/detail/approve all working |
| PO Service | ⚠️ 70% | Core logic exists; payload mapping needs refinement |
| PO Routes | ⚠️ 70% | All 5 endpoints defined; request schema alignment needed |
| PO Frontend Pages | ⚠️ 30% | Shells created; PR line picker + allocation UI missing |
| Jest Tests (PO) | ⚠️ 50% | Scaffolding exists; need completion |
| Playwright Tests (PO) | ❌ 0% | Template exists; PO flow test not yet written |

**Time to completion**: ~4.5–5 hours of focused work with strict checkpoint discipline.

---

## Phase 1: Backend Validation & Completion (1.0 hour)

### Checkpoint 1.1 — Validate PO Service Logic (15 min)

**What to do:**
- [ ] Read [backend/src/services/purchase-order-service.js](backend/src/services/purchase-order-service.js) lines 161–300
- [ ] Verify `createPurchaseOrder()` enforces: `qtyOrdered <= prLine.qtyRemaining`
- [ ] Verify `submitPurchaseOrder()` enforces: DRAFT → SUBMITTED transition only
- [ ] Confirm PR line is locked with FOR UPDATE to prevent concurrent over-allocation
- [ ] Confirm error payloads use proper status codes: 422 (validation), 404 (not found)

**How to verify:**
```bash
# Inspect service validation logic
grep -n "qty_allocated" backend/src/services/purchase-order-service.js
grep -n "FOR UPDATE" backend/src/services/purchase-order-service.js
grep -n "statusCode = 422" backend/src/services/purchase-order-service.js
```

**Expected state:**
- Allocation validation present and correct
- Status transitions restricted
- Error messages explicit and actionable

---

### Checkpoint 1.2 — Fix Request/Response Payload Mapping (20 min)

**What to do:**
- [ ] Review POST `/api/purchase-orders` request schema at [backend/src/routes/purchase-order-routes.js](backend/src/routes/purchase-order-routes.js#L66)
- [ ] Verify schema matches service expectations:
  - `vendorName` (not `vendor`)
  - `lines[].prLineId` (not `pr_line_id`)
  - `lines[].qtyOrdered`, `lines[].itemCode`, `lines[].itemName`, `lines[].uom`, `lines[].siteCode`, `lines[].unitPrice`
- [ ] Verify response mapper uses correct field names: `poNumber`, `vendorName`, `createdAt`
- [ ] Ensure validation returns HTTP 422 with `{ message: "..." }` format

**How to verify:**
```bash
# Test invalid payload
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{"vendorName": "Test"}'  # Missing lines array

# Expected: HTTP 422 + { message: "lines must contain at least one item" }
```

**Expected state:**
- POST schema aligns with service function parameters
- All validation errors return 422 + clear message
- Response payload uses camelCase (poNumber, vendorName, etc.)

---

### Checkpoint 1.3 — Test Backend Locally (25 min)

**What to do:**

1. **Start database:**
   ```bash
   docker compose down -v
   docker compose up -d db
   # Wait ~5 sec for PostgreSQL to be ready
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   # Should start on port 3000
   ```

3. **Test endpoints:**
   ```bash
   # Test 1: List POs (empty)
   curl -X GET http://localhost:3000/api/purchase-orders
   # Expected: { "items": [] }

   # Test 2: Create PO with invalid PR line (should fail with 422)
   curl -X POST http://localhost:3000/api/purchase-orders \
     -H "Content-Type: application/json" \
     -d '{
       "vendorName": "Test Vendor",
       "lines": [{
         "prLineId": "invalid-guid-123",
         "itemCode": "TEST",
         "itemName": "Test Item",
         "qtyOrdered": 5,
         "uom": "PCS",
         "unitPrice": 10000,
         "siteCode": "WH-1"
       }]
     }'
   # Expected: HTTP 422 + clear error

   # Test 3: Run backend unit tests
   npm test
   # Expected: All PO tests pass (or at least >0 PO tests green)
   ```

**Expected state:**
- GET /api/purchase-orders returns 200
- POST with invalid input returns 422 with clear message
- Jest tests pass or show clear failure reasons
- No unhandled 500 errors

---

## Phase 2: Frontend PO Pages & API Integration (1.5 hours)

### Checkpoint 2.1 — Complete PO List Page (15 min)

**What to do:**
- [ ] Read [frontend/src/pages/PurchaseOrderListPage.vue](frontend/src/pages/PurchaseOrderListPage.vue)
- [ ] Verify page displays:
  - Table with columns: PO Number, Vendor, Status, Created Date
  - "New PO" button links to `/purchase-orders/new`
  - Each PO row links to `/purchase-orders/{id}`
- [ ] Verify Dashboard has nav link to `/purchase-orders` (check [frontend/src/pages/DashboardPage.vue](frontend/src/pages/DashboardPage.vue))

**How to verify:**
```bash
cd frontend
npm install
npm run dev
# Navigate to http://localhost:5173/purchase-orders
```

**Expected state:**
- Page loads without errors
- Table renders (may be empty at start)
- All links are clickable and navigate correctly
- No console errors

---

### Checkpoint 2.2 — Complete PO Create Page (40 min)

**This is the heaviest checkpoint—requires PR line picker + allocation form.**

**What to do:**

Read [frontend/src/pages/PurchaseOrderCreatePage.vue](frontend/src/pages/PurchaseOrderCreatePage.vue) and implement:

1. **Vendor Name Field**
   - [ ] Text input, required, trimmed on submit
   - Validation: non-empty string

2. **PR Line Picker** (most complex)
   - [ ] Fetch approved PR lines: GET `/api/requisitions/:id/open-lines`
   - [ ] Display table with columns:
     - PR Number (read-only)
     - Line Number (read-only)
     - Item Code (read-only)
     - Item Name (read-only)
     - Qty Requested (read-only)
     - Qty Allocated (read-only, updated dynamically)
     - **Qty Remaining** = Requested − Allocated (highlighted, key for validation)
   - [ ] Checkbox or toggle to select/deselect PR lines
   - [ ] Only allow selection of lines with `qtyRemaining > 0`

3. **Allocation Form** (for each selected PR line)
   - [ ] Display selected PR lines below picker
   - [ ] For each line, show:
     - Item Code + Item Name (read-only)
     - Qty Remaining (read-only, in blue or highlight)
   - [ ] Input fields:
     - Qty Ordered: number input, must be > 0 and ≤ Qty Remaining
       - On change: validate inline, show error if exceeded
     - Unit Price: number input, ≥ 0
     - Required Date: date input (optional)

4. **Form Actions**
   - [ ] "Create PO" button:
     - Disabled until: vendor name filled + ≥1 PR line selected with valid qty
     - On click: Build payload and POST `/api/purchase-orders`
     - On 201: Navigate to `/purchase-orders/{returnedPOId}`
     - On 422: Display error message (inline, not modal)
   - [ ] "Cancel" button: Navigate back to `/purchase-orders`

**When building, reuse baseline components** (e.g., existing `card-panel` layout and the error display style from `RequisitionCreatePage`)

**How to verify:**
```bash
# Navigate to http://localhost:5173/purchase-orders/new
# UI checklist:
# - Vendor name input appears
# - PR line picker table loads (likely empty if no approved PRs yet)
# - Clicking a PR line checkbox enables it in allocation form
# - Qty Ordered input shows inline validation error if > Qty Remaining
# - Create button is disabled until valid state is reached
# - No console errors
```

**Expected state:**
- Form loads without errors
- PR line picker populates (will be empty until baseline PR is approved)
- Qty validation works inline (user sees error if qty > remaining)
- Create button correctly enabled/disabled based on form state

---

### Checkpoint 2.3 — Complete PO Detail Page (35 min)

**What to do:**

Read [frontend/src/pages/PurchaseOrderDetailPage.vue](frontend/src/pages/PurchaseOrderDetailPage.vue) and implement:

1. **Header Section**
   - [ ] PO Number (from GET `/api/purchase-orders/{id}`)
   - [ ] Vendor Name
   - [ ] Status Badge (DRAFT = gray, SUBMITTED = green)
   - [ ] Created Date (formatted, e.g., "Sep 03, 2026")

2. **Lines Table**
   - [ ] Columns: Line #, Item Code, Item Name, Qty Ordered, Unit Price, UOM, Site Code, Required Date
   - [ ] For each line, display allocation source:
     - PR Number + allocated qty from that PR
     - (This info comes from PO detail query joining pr_line_allocations)

3. **Submit Action**
   - [ ] If status = DRAFT:
     - [ ] "Submit PO" button visible and enabled
     - [ ] On click: POST `/api/purchase-orders/{id}/submit`
     - [ ] On 200: Refresh page, status badge → SUBMITTED, disable button
     - [ ] On error (422, 500): Display error message
   - [ ] If status = SUBMITTED:
     - [ ] "Submit" button disabled with visual indication (grayed out)
     - [ ] Status badge shows "SUBMITTED" highlight

4. **Navigation**
   - [ ] Back link/button to return to `/purchase-orders`
   - [ ] Or breadcrumb navigation

**How to verify:**
```bash
# After creating a PO via Checkpoint 2.2, navigate to its detail page
# http://localhost:5173/purchase-orders/{newPOId}
# UI checklist:
# - Header renders PO number, vendor, status=DRAFT
# - Lines table shows created lines with correct quantities
# - Submit button is visible and clickable
# - Clicking Submit changes status to SUBMITTED
# - No console errors
```

**Expected state:**
- Detail page loads and displays all PO data
- Submit button works and transitions status correctly
- Allocation chain from PR → PO visible in UI

---

## Phase 3: Test Coverage — Jest & Playwright (1.5 hours)

### Checkpoint 3.1 — Jest Unit Tests for PO Service (30 min)

**What to do:**

Update [backend/tests/services/purchase-order-service.test.js](backend/tests/services/purchase-order-service.test.js) to ensure these test suites exist:

1. **Over-allocation Validation**
   ```javascript
   test('reject allocation if qty > pr_line.remaining', async () => {
     // Create mock DB with PR line having qty_requested=10, qty_allocated=8
     // Try to allocate 3 → should fail (8+3 > 10)
     // Expected: 422 error message
   });

   test('accept allocation if qty <= pr_line.remaining', async () => {
     // Create mock DB with PR line having qty_requested=10, qty_allocated=8
     // Allocate 2 → should succeed (8+2 = 10)
     // Expected: PO created
   });
   ```

2. **PR Status Validation**
   ```javascript
   test('reject allocation if PR status != APPROVED', async () => {
     // Create mock DB with PR status = SUBMITTED (not APPROVED)
     // Try to create PO → should fail
     // Expected: 422 error
   });
   ```

3. **PO Creation**
   ```javascript
   test('create PO with DRAFT status and increment po_number', async () => {
     // Valid payload, existing PO count = 3
     // Expected: PO created with number "PO-2026-0004", status = DRAFT
   });
   ```

4. **PO Submit**
   ```javascript
   test('transition PO from DRAFT to SUBMITTED', async () => {
     // Start with DRAFT PO
     // Call submitPurchaseOrder()
     // Expected: status updated to SUBMITTED
   });

   test('reject submit if PO not found', async () => {
     // Try to submit non-existent ID
     // Expected: 404 error
   });
   ```

**Run tests:**
```bash
cd backend
npm test

# Expected: All PO tests pass (green checkmarks)
# Coverage: >60% for purchase-order-service.js
```

**Expected state:**
- All PO service tests pass
- Coverage report shows >60% for PO service functions
- No failing assertions

---

### Checkpoint 3.2 — Playwright E2E Tests for PO Workflow (40 min)

**What to do:**

Update or create [tests/e2e/po-flow.spec.js](tests/e2e/po-flow.spec.js) with these test scenarios:

1. **Baseline PR Setup** (create and approve a PR first)
   ```javascript
   test('create and approve a purchase requisition', async () => {
     // Navigate to /requisitions/new
     // Fill: requester, department, item (qty=10, price=100000, etc.)
     // Submit → created
     // Approve it (navigate to detail, click approve if available)
     // Expected: PR status = APPROVED, can now be used in PO
   });
   ```

2. **PO Creation Flow**
   ```javascript
   test('create PO from approved PR lines', async () => {
     // Start with approved PR (from test above)
     // Navigate to /purchase-orders/new
     // Fill vendor name
     // Select PR line from picker
     // Enter qty_ordered (must be <= qty_remaining)
     // Click "Create PO"
     // Expected: Redirected to PO detail, PO number visible, status=DRAFT
   });
   ```

3. **Qty Validation**
   ```javascript
   test('reject PO creation if qty exceeds PR remaining', async () => {
     // Navigate to /purchase-orders/new
     // Select PR line with qty_remaining=5
     // Try to allocate qty=6
     // Expected: Form shows validation error, Create button disabled
   });
   ```

4. **PO Submit Flow**
   ```javascript
   test('submit PO and verify status transition', async () => {
     // Start with newly created PO (status=DRAFT)
     // Navigate to PO detail page
     // Click "Submit PO" button
     // Expected: Status badge changes to SUBMITTED, button disabled
     // Verify via GET /api/purchase-orders/{id} that backend state is SUBMITTED
   });
   ```

5. **PO List Integration**
   ```javascript
   test('newly created PO appears in list', async () => {
     // Create PO (from flow above)
     // Navigate to /purchase-orders
     // Expected: New PO visible in table with correct vendor name + status
   });
   ```

**Run tests:**
```bash
cd "$(git rev-parse --show-toplevel)"
npm run test:e2e

# Expected: All PO Playwright tests pass
# Example output: "3 passed (15s)"
```

**Expected state:**
- All PO Playwright tests pass
- No network/404 errors logged
- Baseline PR tests still pass (no regressions)

---

### Checkpoint 3.3 — Full Test Suite Green (10 min)

**What to do:**

```bash
# Backend unit tests
cd backend
npm test
# Expected: ✓ All tests pass

# E2E tests (from root)
cd ..
npm run test:e2e
# Expected: ✓ All tests pass
```

**Expected state:**
- Jest: All PO service tests pass; >60% coverage
- Playwright: All PO flow tests pass
- No console errors or warnings
- No test flakiness (tests repeatable)

---

## Phase 4: Definition of Done Review (1.0 hour)

### Checkpoint 4.1 — Code Quality & Constraints (25 min)

**Review against Definition of Done checklist:**

- [ ] **Scope**: PO module only
  - No GR implementation
  - No SSO, reporting, notifications, advanced compliance
  - Verify: Grep for "goods-receipt" or "bookmark"—should find nothing new

- [ ] **Tech Stack**: Fastify + JS, PostgreSQL, Vue 3 + Vite, Jest, Playwright
  - No Prisma used
  - Verify: `grep -r "prisma" backend/src/` → should be empty

- [ ] **Architecture**: Service functions own business logic; handlers are thin
  - Allocation rule in service, not route
  - PO numbering logic in service
  - Status transitions in service
  - Verify: Handlers in routes/ < 50 LOC each

- [ ] **Naming**: Explicit (no clever abstractions)
  - Functions: `createPurchaseOrder()`, `submitPurchaseOrder()`, `validateCreatePayload()`
  - Variables: `qtyOrdered`, `qtyRemaining`, `allocatedQty` (full words, no cryptic abbrev)
  - Verify: No 1-letter variables in critical paths

- [ ] **Validation**: All requests validated, clear 422 error messages
  - Verify: All error messages start with field name and describe issue
  - Example: `"lines[0].qtyOrdered must be greater than 0"` (good)
  - Not: `"Invalid input"` (bad)

- [ ] **PO Rules**: Allocation qty ≤ PR remaining qty enforced
  - Verify: Jest test exists proving this rule

- [ ] **UI/CSS**: Baseline CSS variables reused; no emojis
  - Verify: No emoji characters in .vue files
  - Verify: Check `frontend/src/styles.css` for variable usage

**Action items if issues found:**
- Refactor logic from handlers to services
- Rename variables to explicit full words
- Update error messages to be specific
- Remove emojis from UI strings/commit messages

---

### Checkpoint 4.2 — Documentation Update (20 min)

**Update [docs/plan.md](docs/plan.md):**

1. In **API Scope** section, under Purchase Order subsection, change:
   ```markdown
   Workshop status: participant implementation backlog (primary focus).
   ```
   To:
   ```markdown
   Workshop status: ✅ IMPLEMENTED & TESTED
   
   Delivery notes:
   - Allocation validation enforced: qty_ordered <= pr_line.qty_remaining
   - Over-allocation detected via row-locking in transaction
   - PO number generated with sequence: PO-2026-{count}
   - Status transition: DRAFT -> SUBMITTED (submit endpoint enforced)
   ```

2. In **Workshop Agenda** section, update Hour 2–4 statuses:
   ```markdown
   ### Hour 2 — PO Backlog: API + Data Rules ✅
   - ✅ Implement PO create/submit/detail/open-lines endpoints
   - ✅ Implement allocation validation (allocated qty <= PR remaining qty)
   - ✅ Keep handlers thin and move rules to PO service
   
   ### Hour 3 — PO Backlog: UI Pages ✅
   - ✅ Build PO list/create/detail pages on top of baseline navigation
   - ✅ Connect pages to PO APIs
   - ✅ Validate create-from-approved-PR-line flow
   
   ### Hour 4 — PO-focused Testing + GitHub Review ✅
   - ✅ Add Jest tests focused on PO rules and status transitions
   - ✅ Add Playwright flow for PO pages integrated with baseline PR data
   ```

3. In **Done Criteria** section (§10), confirm all items checked:
   ```markdown
   - [x] App runs locally with Docker PostgreSQL + Fastify + Vue
   - [x] Baseline Home/Dashboard + PR pages/APIs run without modification
   - [x] PO backlog is implemented (PO list/create/detail + required PO endpoints)
   - [x] PO quantity validations are enforced
   - [x] Jest and Playwright each run at least one PO-focused meaningful test
   - [x] Bookmark feature is captured as a GitHub Issue (or implemented if time allows)
   ```

**Commit message:**
```
Update plan.md: PO backlog implementation complete with allocation validation and E2E tests
```

---

### Checkpoint 4.3 — Git & Final Checks (15 min)

**What to do:**

1. **Review all changes:**
   ```bash
   git status
   # Lists all modified/new files
   ```

2. **Stage PO implementation files:**
   ```bash
   git add backend/src/services/purchase-order-service.js
   git add backend/src/routes/purchase-order-routes.js
   git add frontend/src/pages/PurchaseOrder*.vue
   git add backend/tests/services/purchase-order-service.test.js
   git add tests/e2e/po-flow.spec.js
   git add docs/plan.md
   git add docs/runbook.md
   ```

3. **Review diff for quality:**
   ```bash
   git diff --staged

   # Checklist:
   # - No typos or console.log statements
   # - No commented-out code
   # - No TODO comments (either complete or create GitHub Issue)
   # - Indentation consistent (2 spaces for JS/Vue, 4 for backend)
   ```

4. **Commit:**
   ```bash
   git commit -m "Implement PO backlog: create/submit/detail endpoints with allocation validation and full test coverage"
   ```

5. **Final checks:**
   - [ ] No merge conflicts
   - [ ] Commit message is clear and emoji-free
   - [ ] All changed files staged and committed
   - [ ] Ready for Copilot PR review or final demo

---

## Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Backend APIs** | All 5 PO endpoints working | `curl` tests pass; zero 500 errors |
| **Allocation Rule** | Enforced (qty ≤ remaining) | 422 error when exceeded; Jest test passes |
| **Frontend Pages** | List/Create/Detail complete | All pages load, links work, no 404 |
| **Form Validation** | Inline qty validation | Error shown if qty > remaining |
| **Jest Coverage** | ≥4 PO-focused tests | `npm test` passes; >60% service coverage |
| **Playwright E2E** | ≥3 PO workflow tests | PR create → PO create → PO submit; `npm run test:e2e` passes |
| **Code Quality** | No business logic in handlers | Service functions contain all validation/rules |
| **Documentation** | plan.md updated | PO status marked "IMPLEMENTED & TESTED" |
| **No Regressions** | All baseline tests pass | PR tests, Dashboard unchanged |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| PR line picker UX complex to build | High | Reuse baseline table component; keep form simple; mock PR data first |
| Qty validation logic duplicated (service + UI) | Medium | Implement service validation first; UI mirrors server errors |
| Database connection issues during tests | Medium | Docker Compose auto-initializes; verify DB ready before backend start |
| Test flakiness (timing, async) | Medium | Use `waitFor()` in Playwright; mock DB responses in Jest; no hardcoded delays |
| Over-allocation race condition | High | Already mitigated by FOR UPDATE lock in service—verify Jest test captures this |
| Scope creep into GR | High | Refer to AGENTS.md: strictly PO-only; GR = "further exploration"; create GitHub Issues for later |

---

## Appendix: Quick Reference

### Start Local Environment
```bash
# Terminal 1: Database
docker compose down -v
docker compose up -d db

# Terminal 2: Backend
cd backend
npm install
npm run dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev

# Navigate to http://localhost:5173
```

### Run Tests
```bash
# Jest (backend unit tests)
cd backend
npm test

# Playwright (E2E tests from root)
cd ..
npm run test:e2e
```

### Common Debugging
```bash
# Check if DB is ready
docker logs db

# Check backend logs
# (see Terminal 2 output)

# Check frontend console
# (open browser DevTools)

# Query DB directly (if needed)
docker exec -it db psql -U workshop -d procurement_mvp -c "SELECT * FROM purchase_orders;"
```

---

## Worksheet: Checkpoint Progress Tracker

Copy this table and mark each checkpoint complete as you progress:

| Phase | Checkpoint | Target Time | Status | Notes |
|-------|-----------|-------------|--------|-------|
| 1 | 1.1: Validate PO Service | 15 min | ⬜️ | |
| 1 | 1.2: Fix Payload Mapping | 20 min | ⬜️ | |
| 1 | 1.3: Test Backend Locally | 25 min | ⬜️ | |
| 2 | 2.1: Complete PO List Page | 15 min | ⬜️ | |
| 2 | 2.2: Complete PO Create Page | 40 min | ⬜️ | |
| 2 | 2.3: Complete PO Detail Page | 35 min | ⬜️ | |
| 3 | 3.1: Jest Tests | 30 min | ⬜️ | |
| 3 | 3.2: Playwright E2E Tests | 40 min | ⬜️ | |
| 3 | 3.3: Full Test Suite Green | 10 min | ⬜️ | |
| 4 | 4.1: Code Quality Review | 25 min | ⬜️ | |
| 4 | 4.2: Documentation Update | 20 min | ⬜️ | |
| 4 | 4.3: Git & Final Checks | 15 min | ⬜️ | |

**Total**: ~5 hours. Best checkpoint completion rate: 1 per 6–10 min with verification.

7. **Run final MVP acceptance gate (PO-focused)**  
   Re-check Done Criteria §10 against delivered scope.
   **Checkpoint:** All PO criteria pass, including Jest + Playwright evidence.

## Complete Refined Checklist

Use this as the mandatory sign-off gate before closing PO backlog work.

### Implementation Quality
- [ ] Stays within PO-only scope (no GR/SSO/reporting/notification creep)
- [ ] Matches workshop stack (Fastify + JavaScript, PostgreSQL, Vue 3 + Vite)
- [ ] Keeps business rules in services; route handlers remain thin
- [ ] Enforces PO over-allocation guard (`allocation <= PR remaining`)
- [ ] Uses explicit naming and existing UI patterns

### Testing Discipline
- [ ] PO Jest tests cover over-allocation and status transitions
- [ ] Existing backend/frontend test commands remain passing
- [ ] Playwright includes PO create -> submit -> detail flow
- [ ] No new testing framework complexity beyond Jest + Playwright

### Documentation Discipline
- [ ] `docs/plan.md` reflects actual PO backlog completion state
- [ ] API scope docs remain aligned with implemented PO endpoints
- [ ] README/AGENTS updates are made only when behavior/scope changed
- [ ] Commit messages are clear, concise, and explain intent
