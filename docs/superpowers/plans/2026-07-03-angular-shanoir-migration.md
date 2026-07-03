# Angular Shanoir Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-implement the React annotation panel (`app/`) as an Angular 21 app under `angular/`, themed to look like Shanoir, with full feature parity on mock data.

**Architecture:** Standalone Angular components + a single signal-based `AppStore` service that ports `App.jsx` state/handlers verbatim. Three routes (`/projects`, `/annotations`, `/templates`) plus signal-driven overlays. Plain CSS with a Shanoir design-token layer (no Tailwind/Sass/NgRx).

**Tech Stack:** Angular ^21, TypeScript ~5.9, Angular signals, plain CSS, Open Sans, Font Awesome, @angular/cdk (overlays).

## Global Constraints

- **Node runtime:** use nvm Node **22.14.0** (`nvm use 22.14.0`) for every Angular command. Angular 21 needs Node ^20.19 || ^22.12 || >=24; the machine's default 18.12 will NOT work.
- **Location:** all new code under `angular/`. Do NOT modify or delete `app/` (the React app).
- **Styling:** plain CSS only. Shanoir tokens from `angular/src/assets/css/shanoir-tokens.css`. Brand `#5f0f4e`, buttons `#675682`/hover `#827498`, alt `darkgreen`/hover `#67977f`, error `#BA2D0B`, border `#BEC3C7`, bg `#fdfdfd`, font `"Open Sans", Arial, sans-serif`, base `12px`, radius `2px`.
- **State:** exactly one `AppStore` (signals). Components are thin projections; no duplicated business logic.
- **Data semantics preserved:** status set (`todo/in_progress/submitted/revisions/accepted`) and their colors, role rules (annotators see only their tasks; managers get bulk/status/review/CRUD), `saveWork` bumps `todo → in_progress` and never auto-submits.
- **Source of truth for behavior:** the matching React file named in each task. Port behavior faithfully; translate JSX→Angular idioms (`@if`/`@for`, `[class.x]`, `[style.prop]`, `(click)`).
- **Commit** after each task with a `feat(angular): …` message.

---

## File Structure

```
angular/
  package.json, angular.json, tsconfig*.json
  src/
    index.html, main.ts, styles.css
    assets/css/shanoir-tokens.css
    app/
      app.component.{ts,html,css}
      app.routes.ts
      core/app.store.ts
      data/models.ts
      data/mock-data.ts
      shared/
        status-mark.component.ts
        avatar.component.ts
        mini-bar.component.ts
        replica-strip.component.ts
        dialog.component.ts
        format.pipes.ts
      masthead/masthead.component.{ts,html,css}
      projects/
        projects-workspace.component.{ts,html,css}
        project-tree-pane.component.ts
        project-browser.component.ts
        project-task-list.component.ts
        project-preview.component.ts
        project-editor.component.{ts,html,css}
      annotations/
        annotations.component.{ts,html,css}
        annotations-sidebar.component.ts
        overview.component.ts
        bulk-action-bar.component.ts
        task-table.component.{ts,html,css}
      templates/
        templates-view.component.{ts,html,css}
        template-editor.component.{ts,html,css}
      overlays/
        review-drawer.component.{ts,html,css}
        annotate-modal.component.{ts,html,css}
```

---

## Task 1: Scaffold the Angular app on Node 22

**Files:**
- Create: `angular/` (via `ng new`)
- Create: `angular/.nvmrc`

- [ ] **Step 1: Select Node 22 and scaffold**

```bash
cd /Users/carlosvivarrios/pro/micobid-shannoir-ohif-annotation
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22.14.0
npx --yes @angular/cli@21 new angular --directory angular --style=css --routing=true --ssr=false --skip-git --defaults
```

- [ ] **Step 2: Pin the Node version**

Write `angular/.nvmrc` containing `22.14.0`.

- [ ] **Step 3: Verify it builds and serves**

```bash
cd angular && nvm use 22.14.0 && npx ng build
```
Expected: build succeeds (a `dist/` is produced). If `ng serve` is used for a smoke check, it must report "Compiled successfully" and serve on a port.

- [ ] **Step 4: Commit**

```bash
git add angular/.nvmrc angular/package.json angular/angular.json angular/tsconfig*.json angular/src
git commit -m "feat(angular): scaffold Angular 21 app"
```

---

## Task 2: Shanoir design tokens + global styles

**Files:**
- Create: `angular/src/assets/css/shanoir-tokens.css`
- Modify: `angular/src/styles.css`
- Modify: `angular/src/index.html` (Open Sans + Font Awesome CDN, `<link>`)

**Produces:** global CSS classes used by every component: `.btn`, `.btn-primary`, `.btn-alt`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.field`, `.field-sm`, `.select`, `.card`, `.data-table`, `.avatar` (+ `.avatar-sm/-lg`, tone modifiers `.avatar-brand/-rust/-moss/-slate/-ink`), `.mark`, `.mark-dot`, `.label`, `.caption`, `.num`, `.rail-item` (+ `.active`, `.count`), `.rail-section`, `.metric` (+ `-value/-label/-sub`), `.link`, `.density-cell`.

- [ ] **Step 1: Write `shanoir-tokens.css`**

Port every class from `app/src/index.css` (read it) into plain CSS, substituting Shanoir tokens. Header block:

```css
:root {
  --brand:#5f0f4e; --brand-light:#6C1C5B;
  --btn:#675682; --btn-hover:#827498; --btn-alt:darkgreen; --btn-alt-hover:#67977f;
  --accent-soft:#E3E0E8; --error:#BA2D0B; --error-light:#F2D8D2;
  --grey-border:#BEC3C7; --grey-mid:#777; --grey-dark:#333;
  --bg:#fdfdfd; --bg-alt:#fafafa; --bg-panel:#f1f1f1;
  --font:"Open Sans",Arial,sans-serif; --fs-base:12px; --radius:2px;
}
body{background:var(--bg);color:var(--grey-dark);font-family:var(--font);font-size:var(--fs-base);}
.btn{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid transparent;border-radius:var(--radius);font:inherit;cursor:pointer;white-space:nowrap;}
.btn-primary{background:var(--btn);border-color:var(--btn);color:#f1f1f1;}
.btn-primary:hover{background:var(--btn-hover);border-color:var(--btn-hover);}
.btn-alt{background:var(--btn-alt);border-color:var(--btn-alt);color:#fff;}
.btn-alt:hover{background:var(--btn-alt-hover);}
.btn-secondary{background:#fff;border-color:var(--grey-border);color:var(--grey-dark);}
.btn-ghost{background:transparent;color:var(--grey-dark);}
.btn-ghost:hover{background:var(--bg-panel);}
.btn-danger{background:#fff;border-color:var(--error);color:var(--error);}
.btn-sm{padding:3px 7px;font-size:11px;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.field{background:#fff;border:1px solid var(--grey-border);border-radius:var(--radius);padding:5px 8px;font:inherit;color:var(--grey-dark);}
.field:focus{outline:2px inset var(--brand);}
.field-sm{padding:3px 6px;font-size:11px;}
.select{appearance:none;padding-right:22px;cursor:pointer;}
.card{background:#fff;border:1px solid var(--grey-border);border-radius:var(--radius);}
.label{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--grey-mid);font-weight:600;}
.caption{font-size:11px;color:var(--grey-mid);}
.num{font-variant-numeric:tabular-nums;}
.link{color:var(--brand);text-decoration:none;}
.link:hover{text-decoration:underline;}
.mark{display:inline-flex;align-items:center;gap:6px;}
.mark-dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0;}
.avatar{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:10px;text-transform:uppercase;background:#E2E8F0;color:#1E293B;flex-shrink:0;}
.avatar-sm{width:20px;height:20px;font-size:9px;}
.avatar-lg{width:32px;height:32px;font-size:11px;}
.avatar-brand{background:var(--brand);color:#fff;}
.avatar-rust{background:#B45309;color:#fff;}
.avatar-moss{background:#4D7C0F;color:#fff;}
.avatar-slate{background:#475569;color:#fff;}
.avatar-ink{background:#0F172A;color:#F1F5F9;}
.data-table{width:100%;border-collapse:collapse;font-size:12px;}
.data-table thead th{text-align:left;padding:6px 10px;border-bottom:1px solid var(--grey-border);background:var(--bg-alt);font-size:10px;text-transform:uppercase;color:var(--grey-mid);font-weight:600;}
.data-table tbody td{padding:6px 10px;border-bottom:1px solid #eee;vertical-align:middle;}
.data-table tbody tr:hover td{background:var(--bg-alt);}
.data-table tbody tr.selected td{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--brand);}
.data-table tbody tr.group-row td{background:var(--bg-panel);padding-top:12px;}
.rail-section{padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--grey-border);}
.rail-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:4px 8px;border-radius:var(--radius);cursor:pointer;color:var(--grey-dark);background:none;border:none;font:inherit;text-align:left;}
.rail-item:hover{background:var(--bg-panel);}
.rail-item.active{background:var(--accent-soft);color:var(--brand);font-weight:600;}
.rail-item .count{font-size:10px;color:var(--grey-mid);}
.metric{display:flex;flex-direction:column;gap:2px;padding:8px 14px;}
.metric-value{font-size:20px;font-weight:600;color:var(--grey-dark);line-height:1;}
.metric-label{font-size:10px;text-transform:uppercase;color:var(--grey-mid);font-weight:600;}
.metric-sub{font-size:10px;color:var(--grey-mid);}
h1,h2,h3{color:var(--brand);}
```

- [ ] **Step 2: Wire globals**

`styles.css` first line: `@import './assets/css/shanoir-tokens.css';`
`index.html` `<head>`: add `<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">` and `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`.

- [ ] **Step 3: Verify** `npx ng build` succeeds.

- [ ] **Step 4: Commit** `feat(angular): add Shanoir design tokens and global styles`

---

## Task 3: Data model + mock data

**Files:**
- Create: `angular/src/app/data/models.ts`
- Create: `angular/src/app/data/mock-data.ts`
- Test: `angular/src/app/data/mock-data.spec.ts`

**Produces:** interfaces `User, Examination, StatusMeta, Label, Template, ProjectField, Project, Submission, Task, Filters` and consts/functions matching `app/src/data/mockData.js`: `STUDY, USERS, EXAMINATIONS, STATUS, STATUS_ORDER, SEED_TEMPLATES, SEED_PROJECTS, INITIAL_TASKS`; helpers `userById, examById, isAnnotated, isDone, ohifViewUrl, ohifAnnotateUrl, shanoirExamUrl, renderFilename, timestampToken, segFilename, formatBytes`.

- [ ] **Step 1: Port `models.ts`** — TS interfaces for every shape above. `Task = { id; projectId; examId; subjectId; assigneeId; status: StatusId; submissions: Submission[]; answers: Record<string,string>; updatedAt: string; notes: string }`. `StatusId = 'todo'|'in_progress'|'submitted'|'accepted'|'revisions'`.

- [ ] **Step 2: Port `mock-data.ts`** — copy the seed values verbatim from `app/src/data/mockData.js`, typed. Keep `INITIAL_TASKS` produced by the same `t()/seg()/png()` helper pattern.

- [ ] **Step 3: Write failing spec**

```ts
import { formatBytes, isDone, examById, STATUS_ORDER } from './mock-data';
describe('mock-data helpers', () => {
  it('formats bytes', () => { expect(formatBytes(2_400_000)).toBe('2.3 MB'); expect(formatBytes(512)).toBe('512 B'); });
  it('isDone only for accepted', () => { expect(isDone('accepted')).toBe(true); expect(isDone('submitted')).toBe(false); });
  it('finds an examination', () => { expect(examById('1148')?.subjectId).toBe('2734273'); });
  it('orders statuses', () => { expect(STATUS_ORDER[0]).toBe('todo'); });
});
```

- [ ] **Step 4: Run** `npx ng test --watch=false --browsers=ChromeHeadless` → the 4 specs pass.

- [ ] **Step 5: Commit** `feat(angular): port mock data and models`

---

## Task 4: AppStore signal service

**Files:**
- Create: `angular/src/app/core/app.store.ts`
- Test: `angular/src/app/core/app.store.spec.ts`

**Consumes:** everything from Task 3.
**Produces:** `@Injectable({providedIn:'root'}) AppStore` with signals `tasks, templates, projects, currentUserId, selectedIds, filters, review, annotateTaskId`; computed `currentUser, templatesById, projectsById, baseTasks, filtered`; methods (port `App.jsx` handlers, same names/semantics): `select(id,on)`, `selectAll(on)`, `selectSubject(subjectId,on)`, `clearSelection()`, `updateTask(id,patch)`, `statusChange(id,status)`, `assignAll(userId)`, `splitAcross(userIds)`, `bulkRemove()`, `unassign(id)`, `saveWork(taskId,{addFiles,answers})`, `saveProject(project)`, `deleteProject(id)`, `saveTemplate(tpl)`, `deleteTemplate(id)`, and view helpers `openReview(examId,projectId)`/`closeReview()`, `openAnnotate(taskId)`/`closeAnnotate()`. Keep the `reconcileTasks(project)` logic from `App.jsx` (create/keep/drop tasks on project save) and the `_nextTaskId` counter.

- [ ] **Step 1: Write failing spec** (covers the load-bearing logic)

```ts
import { TestBed } from '@angular/core/testing';
import { AppStore } from './app.store';
describe('AppStore', () => {
  let s: AppStore;
  beforeEach(() => { TestBed.configureTestingModule({}); s = TestBed.inject(AppStore); });

  it('annotator baseTasks are only their own', () => {
    s.currentUserId.set('u2');
    expect(s.baseTasks().every(t => t.assigneeId === 'u2')).toBe(true);
  });

  it('statusChange updates a task', () => {
    const id = s.tasks()[0].id;
    s.statusChange(id, 'accepted');
    expect(s.tasks().find(t => t.id === id)!.status).toBe('accepted');
  });

  it('saveWork bumps todo to in_progress and never auto-submits', () => {
    const todo = s.tasks().find(t => t.status === 'todo')!;
    s.saveWork(todo.id, { answers: { findings: 'x' } });
    expect(s.tasks().find(t => t.id === todo.id)!.status).toBe('in_progress');
  });

  it('assignAll reassigns selected and clears selection', () => {
    const ids = s.tasks().slice(0,2).map(t => t.id);
    ids.forEach(i => s.select(i, true));
    s.assignAll('u3');
    expect(s.tasks().filter(t => ids.includes(t.id)).every(t => t.assigneeId === 'u3')).toBe(true);
    expect(s.selectedIds().length).toBe(0);
  });

  it('filtered honors status filter', () => {
    s.currentUserId.set('u1');
    s.filters.update(f => ({ ...f, status: 'accepted' }));
    expect(s.filtered().every(t => t.status === 'accepted')).toBe(true);
  });
});
```

- [ ] **Step 2: Run** → fails (no AppStore).
- [ ] **Step 3: Implement** `AppStore` porting `App.jsx` (lines for `baseTasks`, `filtered`, all handlers, `reconcileTasks`). Use `signal()`/`computed()`; `today()` = `new Date().toISOString().slice(0,10)`.
- [ ] **Step 4: Run** → 5 specs pass.
- [ ] **Step 5: Commit** `feat(angular): add signal-based AppStore`

---

## Task 5: Shared presentational components

**Files:**
- Create: `angular/src/app/shared/status-mark.component.ts` (`<app-status-mark [status]>` → dot + label from `STATUS`)
- Create: `angular/src/app/shared/avatar.component.ts` (`<app-avatar [user] [size]>` → tone class + initials)
- Create: `angular/src/app/shared/mini-bar.component.ts` (`<app-mini-bar [tasks]>` → status-colored segments; empty state grey)
- Create: `angular/src/app/shared/replica-strip.component.ts` (`<app-replica-strip [tasks]>` → colored initials circles)
- Create: `angular/src/app/shared/dialog.component.ts` (`<app-dialog [open] (close)>` → backdrop + centered panel with `<ng-content>`, `rgba(70,70,70,.8)` overlay)
- Create: `angular/src/app/shared/format.pipes.ts` (`bytes` pipe → `formatBytes`)

**Produces:** the six selectors above, imported standalone by later components.

- [ ] **Step 1:** Implement all six as standalone components/pipes (inline templates, small). Behavior mirrors the equivalent inline React atoms (`StatusMark`, `avatar`, `MiniBar`, `ReplicaStrip`) in the JSX files.
- [ ] **Step 2: Verify** `npx ng build` succeeds.
- [ ] **Step 3: Commit** `feat(angular): add shared UI atoms (status-mark, avatar, mini-bar, dialog)`

---

## Task 6: Shell — AppComponent, routes, Masthead

**Files:**
- Modify: `angular/src/app/app.component.{ts,html,css}`
- Create/Modify: `angular/src/app/app.routes.ts`
- Create: `angular/src/app/masthead/masthead.component.{ts,html,css}`

**Consumes:** `AppStore`, `AvatarComponent`.
**Produces:** app shell with masthead + `<router-outlet>` + overlay hosts (ReviewDrawer/AnnotateModal added in Task 10). Routes: `''`→redirect `projects`; `projects`, `annotations`, `templates` lazy `loadComponent`.

- [ ] **Step 1:** `app.routes.ts` with the three routes + default redirect.
- [ ] **Step 2:** `MastheadComponent` (port `Masthead.jsx`): brand block (`M` chip + title), nav tabs using `routerLink`/`routerLinkActive="active"`, "Signed in as" `<select>` bound to `store.currentUserId`, `<app-avatar>` for current user. Options = `USERS` (`handle — role`).
- [ ] **Step 3:** `AppComponent` template = `<app-masthead/>` + layout wrapper + `<router-outlet/>`.
- [ ] **Step 4: Verify** `ng serve`; masthead shows, nav switches routes, user switcher changes the avatar. (Views are placeholders until their tasks.)
- [ ] **Step 5: Commit** `feat(angular): app shell, routing, and masthead`

---

## Task 7: Annotations view (densest — de-risks the store)

**Files:**
- Create: `angular/src/app/annotations/annotations.component.{ts,html,css}`
- Create: `angular/src/app/annotations/annotations-sidebar.component.ts`
- Create: `angular/src/app/annotations/overview.component.ts`
- Create: `angular/src/app/annotations/bulk-action-bar.component.ts`
- Create: `angular/src/app/annotations/task-table.component.{ts,html,css}`

**Consumes:** `AppStore`, all shared atoms.
**Produces:** route component for `/annotations`. Ports `Sidebar.jsx`, `Overview.jsx`, `BulkActionBar.jsx`, `TaskTable.jsx`, and the `view==='annotations'` block of `App.jsx` (header, search, counts).

- [ ] **Step 1:** `AnnotationsSidebarComponent` — scope (all/mine), project facet, status facet, annotator facet, each with counts from `store.baseTasks()`; clicking sets `store.filters`. Footer "v0.6 · CIBM / Mock data — no PHI".
- [ ] **Step 2:** `OverviewComponent` — the five metric tiles (accepted %/submitted/in-progress/revisions/todo) + the status density bar. Port `Overview.jsx`.
- [ ] **Step 3:** `BulkActionBarComponent` — visible to managers when `selectedIds` non-empty; assign-all `<select>`, split-across (multi), delete, clear. Calls `store.assignAll/splitAcross/bulkRemove/clearSelection`.
- [ ] **Step 4:** `TaskTableComponent` — subject-grouped table (port `TaskTable.jsx`): group header rows with select-all-in-subject, per-row exam link, date, project pip, assignee (+ unassign ✕ for managers), status (manager `<select>` vs `<app-status-mark>`), output badges (SEG/IMG/TXT counts), `<app-replica-strip>`, action buttons (View / Annotate|Write / Open / Review) gated by role/assignment/status. Wire to `store` methods and `store.openAnnotate`/`store.openReview`.
- [ ] **Step 5:** `AnnotationsComponent` — header ("Annotations", visible count + "· filtered"), search input bound to `store.filters.search`, then `<app-overview>`, `<app-bulk-action-bar>` (manager), `<app-task-table>`. Left column = `<app-annotations-sidebar>`.
- [ ] **Step 6: Verify** `ng serve` on `/annotations`: switch to manager → bulk bar + status editing + review; switch to an annotator → only own tasks, no bulk bar; filters and search narrow the table; counts match.
- [ ] **Step 7: Commit** `feat(angular): annotations view (sidebar, overview, bulk bar, task table)`

---

## Task 8: Templates view + editor

**Files:**
- Create: `angular/src/app/templates/templates-view.component.{ts,html,css}`
- Create: `angular/src/app/templates/template-editor.component.{ts,html,css}`

**Consumes:** `AppStore`, `DialogComponent`.
**Produces:** route component for `/templates`. Ports `TemplatesView.jsx`, `TemplateEditor.jsx`.

- [ ] **Step 1:** `TemplatesViewComponent` — left note rail + grid of template cards (swatch, name, code, "N labels · used in M projects", label chips with color+hex, filename pattern). "+ New template" (manager). Usage count = projects referencing `template.id`.
- [ ] **Step 2:** `TemplateEditorComponent` — dialog to create/edit: name, labels (add/remove, name+color), screenshot filename pattern. Calls `store.saveTemplate`/`store.deleteTemplate`.
- [ ] **Step 3: Verify** `ng serve` on `/templates`: cards render with correct usage counts; as manager, create a template → appears; edit → persists; delete → removed.
- [ ] **Step 4: Commit** `feat(angular): templates view and editor`

---

## Task 9: Projects workspace + project editor

**Files:**
- Create: `angular/src/app/projects/projects-workspace.component.{ts,html,css}`
- Create: `angular/src/app/projects/project-tree-pane.component.ts`
- Create: `angular/src/app/projects/project-browser.component.ts`
- Create: `angular/src/app/projects/project-task-list.component.ts`
- Create: `angular/src/app/projects/project-preview.component.ts`
- Create: `angular/src/app/projects/project-editor.component.{ts,html,css}`

**Consumes:** `AppStore`, shared atoms, `DialogComponent`.
**Produces:** route component for `/projects`. Ports `ProjectsWorkspace.jsx` (all four inner panes + collapse/pin logic) and `ProjectEditor.jsx`.

- [ ] **Step 1:** `ProjectTreePaneComponent` — outline tree (project → sample → task), expand/collapse, collapsed rail with color chips; emits selection.
- [ ] **Step 2:** `ProjectBrowserComponent` — card/list toggle, "+ New project" (manager), per-project progress + members; collapsed rail variant.
- [ ] **Step 3:** `ProjectTaskListComponent` — selected project's tasks grouped by sample; Edit button (manager); row select.
- [ ] **Step 4:** `ProjectPreviewComponent` — project overview (instructions, fields/labels) when no task; task preview (screenshots grid, DICOM-SEG list, OHIF links, status select, open-editor / view) when a task is selected.
- [ ] **Step 5:** `ProjectsWorkspaceComponent` — hosts the four panes; ports the progressive-collapse state (`treePinned`/`browserPinned`, `treeCollapsed`/`browserCollapsed`) and selection wiring; `visible` filtered by role.
- [ ] **Step 6:** `ProjectEditorComponent` — dialog: name, type (segmentation+template / text+fields), member checkboxes, sample picker with per-subject "select all", validation ("Name, ≥1 member, ≥1 sample required"), Create/Save, Delete (manager, existing). Calls `store.saveProject`/`store.deleteProject`.
- [ ] **Step 7: Verify** `ng serve` on `/projects`: selecting a project collapses the tree; selecting a task opens the preview and collapses the browser; pin re-expands; create/edit project reconciles tasks (new member×sample tasks appear); annotator sees only their member projects.
- [ ] **Step 8: Commit** `feat(angular): projects workspace and project editor`

---

## Task 10: Overlays — review drawer + annotate modal

**Files:**
- Create: `angular/src/app/overlays/review-drawer.component.{ts,html,css}`
- Create: `angular/src/app/overlays/annotate-modal.component.{ts,html,css}`
- Modify: `angular/src/app/app.component.html` (mount both, bound to store signals)

**Consumes:** `AppStore`, `DialogComponent`, shared atoms.
**Produces:** the two global overlays, open/closed via `store.review` / `store.annotateTaskId`.

- [ ] **Step 1:** `ReviewDrawerComponent` (port `ReviewDrawer.jsx`) — side drawer listing all submissions for `review.examId`/`review.projectId`, side by side, manager status change per task; close clears `store.review`.
- [ ] **Step 2:** `AnnotateModalComponent` (port `AnnotateModal.jsx`) — segmentation mode (upload seg/screenshot via `store.saveWork`, OHIF view/editor links) and text mode (fill project fields → `store.saveWork` answers); `saveWork` bumps `todo → in_progress`; never sets submitted. Close clears `store.annotateTaskId`.
- [ ] **Step 3:** Mount `<app-review-drawer/>` and `<app-annotate-modal/>` in `AppComponent`.
- [ ] **Step 4: Verify** `ng serve`: from the task table "Review" opens the drawer with submissions; "Annotate"/"Write" opens the modal; saving work updates status to in-progress and the row output badges; closing works.
- [ ] **Step 5: Commit** `feat(angular): review drawer and annotate modal overlays`

---

## Task 11: Docker/Caddy dev service (optional deployment)

**Files:**
- Create: `angular/Dockerfile.dev`
- Modify: `docker-compose.yml`
- Modify: `README.md`

- [ ] **Step 1:** `angular/Dockerfile.dev` — Node 22 base, `npm ci`, `CMD ng serve --host 0.0.0.0 --port 4200`.
- [ ] **Step 2:** Add an `angular` service to `docker-compose.yml` (expose 4200, internal only) and a second Caddy site (or a compose profile) so it sits behind the same basic-auth pattern. Keep the React `app` service untouched.
- [ ] **Step 3:** Update `README.md` with an "Angular app" section (how to run: `cd angular && nvm use && npm i && npm start`, plus the compose option).
- [ ] **Step 4: Verify** `docker compose config` parses; document the run in README.
- [ ] **Step 5: Commit** `feat(angular): dev container and compose service behind Caddy`

---

## Self-review notes

- **Spec coverage:** §5 architecture → Tasks 4/6; §4 visual system → Task 2; §6 parity checklist → Tasks 6–10 (masthead/roles T6, projects+editor T9, annotations T7, templates T8, review+annotate T10); §7 layout → all; §8 phases → Tasks 1–11; §9 deployment → Task 11.
- **Node constraint** repeated in Global Constraints and Task 1.
- **Type consistency:** method names in Task 4 (`saveWork`, `assignAll`, `splitAcross`, `openAnnotate`, `openReview`) are the exact names consumed in Tasks 7/9/10.
- **Testing altitude:** real unit tests where logic lives (data helpers T3, store T4); build + browser verification for presentational/UI tasks (Angular UI parity is verified visually, matching how the React app was validated).
