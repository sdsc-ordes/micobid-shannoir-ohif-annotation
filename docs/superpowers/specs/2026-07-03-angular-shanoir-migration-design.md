# Migrate the Annotation Panel to Angular (Shanoir-styled)

**Date:** 2026-07-03
**Status:** Draft — awaiting user approval before implementation

## 1. Goal

Re-implement the existing React + Vite + Tailwind annotation panel as an Angular
application that looks like and reuses the conventions of the Shanoir stack
([`shanoir-ng-front`](https://github.com/fli-iam/shanoir-ng/tree/develop/shanoir-ng-front)).
Full feature parity with the current app, on mock data, in one planned migration
executed in phases.

The React app under `app/` stays in place and working; the Angular app is added
alongside under `angular/`. Nothing is deleted.

## 2. Decisions & assumptions

These were chosen as defaults while the user was away. Any can be vetoed before
implementation starts.

| # | Decision | Rationale | Confirm? |
|---|----------|-----------|----------|
| D1 | **Standalone look-alike**, not a fork of `shanoir-ng-front` | User picked this. Self-contained demo that mimics Shanoir structure/style. | ✅ user-chosen |
| D2 | **Full parity in one plan**, phased execution | User picked this. | ✅ user-chosen |
| D3 | **Adopt Shanoir's real theme** (purple `#5f0f4e`, Open Sans, dense) | Best reading of "make it look like Shanoir". | ⚠️ assumed |
| D4 | **Angular 21** to match Shanoir's version | Mirrors the stack; latest. | ⚠️ assumed |
| D5 | **Standalone components + Angular signals** for state (no NgModules, no NgRx) | Modern Angular default; signals map 1:1 onto the React `useState` model; Shanoir itself uses no NgRx. Structure (feature folders, `shared/`) still mirrors Shanoir. | ⚠️ assumed |
| D6 | **Router** for the three views (`/projects`, `/annotations`, `/templates`) | Shanoir is route-driven; replaces the `view` state tab switch. | ⚠️ assumed |
| D7 | Placement in **`angular/`** beside `app/` | Don't disturb the working React app. | ⚠️ assumed |
| D8 | Docker/Caddy integration is a **later phase**; initial target is local `ng serve` | Keeps the first runnable milestone small. | ⚠️ assumed |

**Environment constraint:** the dev machine has Node 18.12; Angular 21 requires
Node ≥ 20.19. Phase 0 installs Node 20 LTS (via nvm) before scaffolding.

## 3. Target stack

- **Angular ^21** (standalone components, signals, new control flow `@if`/`@for`)
- **TypeScript ~5.9**
- **Plain CSS** — global `styles.css` + a `shanoir-tokens.css` design-token layer,
  plus per-component `.css`. No Tailwind, no Sass (matches Shanoir).
- **Open Sans** (web font) + **Font Awesome** for icons (matches Shanoir).
- **@angular/cdk** available for overlays/dialogs (matches Shanoir; optional).
- Testing: Angular's default (Karma/Jasmine or the modern web-test-runner as
  scaffolded). Component smoke tests for the store and key components.

## 4. Visual system — Shanoir tokens

Recreate the current Tailwind component layer (`app/src/index.css`) as plain CSS
classes in Shanoir's palette. Tokens are extracted from
`shanoir-ng-front/src/assets/css/common.css`:

```css
:root {
  --brand:        #5f0f4e;  /* headings, active nav, primary accents */
  --brand-light:  #6C1C5B;
  --btn:          #675682;  /* default button bg */
  --btn-hover:    #827498;
  --btn-alt:      darkgreen; /* alt/confirm button */
  --btn-alt-hover:#67977f;
  --accent-soft:  #E3E0E8;
  --error:        #BA2D0B;
  --error-light:  #F2D8D2;
  --grey-border:  #BEC3C7;
  --grey-mid:     #777;
  --grey-dark:    #333;
  --bg:           #fdfdfd;
  --bg-alt:       #fafafa;
  --bg-panel:     #f1f1f1;
  --font:         "Open Sans", Arial, sans-serif;
  --fs-base:      12px;
  --radius:       2px;
}
```

Class equivalents to port (same names where sensible, so component templates read
like the React ones): `.btn` / `.btn-primary` / `.btn-alt` / `.btn-ghost`,
`.field` / `.select`, `.card`, `.data-table`, `.avatar` (+ tone modifiers),
`.mark` / `.mark-dot`, `.label`, `.caption`, `.rail-item`, `.metric`, `.link`.

Buttons: `--btn` bg, light text, `2px` radius, `5px 10px` padding. Inputs:
bottom border `1px solid --grey-border`, focus `2px inset --brand`. Headings in
`--brand`. Base font 12px Open Sans.

**Status colors** stay as the app's semantic set (todo grey, in-progress blue,
submitted amber, revisions red, accepted green) — these are data semantics, not
brand, and Shanoir has no conflicting convention.

**Note on avatar tones:** the mock data uses tone names (`brand`, `rust`, `moss`,
`slate`); these get remapped to Shanoir-friendly swatches in the token file.

## 5. Architecture

### 5.1 State — `AppStore` (signal service)

A single injectable `AppStore` holds the app state as signals, porting
`app/src/App.jsx` one-to-one:

- **Signals:** `tasks`, `templates`, `projects`, `currentUserId`, `selectedIds`,
  `filters` (`mineOnly`, `status`, `assignee`, `project`, `search`), `review`
  (`{examId, projectId} | null`), `annotateTaskId`.
- **Computed:** `currentUser`, `templatesById`, `projectsById`, `baseTasks`
  (annotator sees only their own), `filtered` (applies filters).
- **Mutations** (methods, same semantics as the React handlers): `select`,
  `selectAll`, `selectSubject`, `clearSelection`; `updateTask`, `statusChange`,
  `assignAll`, `splitAcross`, `bulkRemove`, `unassign`; `saveWork` (files/answers,
  bumps `todo → in_progress`, never auto-submits); project ops `saveProject`
  (+ `reconcileTasks`), `deleteProject`; template ops `saveTemplate`,
  `deleteTemplate`. `_nextTaskId` counter preserved.

Rationale: signals give the exact reactive semantics of the React state with no
external library, and keep every component a thin projection of the store.

### 5.2 Routing

`app.routes.ts`: `/projects` (default redirect), `/annotations`, `/templates`.
The masthead nav uses `routerLink` + `routerLinkActive`. Modals/drawers are driven
by store signals, not routes (they overlay whatever view is active), matching the
React behavior.

### 5.3 Component tree (React → Angular parity)

Every React component maps to a standalone Angular component. Suffix `.component`.

```
AppComponent (shell: masthead + <router-outlet> + global overlays)
├─ MastheadComponent            ← Masthead.jsx (nav, user switcher, avatar)
│
├─ projects/ (route /projects)
│  └─ ProjectsWorkspaceComponent          ← ProjectsWorkspace.jsx
│     ├─ ProjectTreePaneComponent         ← TreePane
│     ├─ ProjectBrowserComponent          ← ProjectBrowser (card/list modes)
│     ├─ ProjectTaskListComponent         ← TaskListPane
│     ├─ ProjectPreviewComponent          ← PreviewPane
│     └─ ProjectEditorComponent (dialog)  ← ProjectEditor.jsx
│
├─ annotations/ (route /annotations)
│  └─ AnnotationsComponent                ← the `view==='annotations'` block in App.jsx
│     ├─ AnnotationsSidebarComponent      ← Sidebar.jsx (faceted filters)
│     ├─ OverviewComponent                ← Overview.jsx (metrics + density bar)
│     ├─ BulkActionBarComponent           ← BulkActionBar.jsx
│     └─ TaskTableComponent               ← TaskTable.jsx (subject-grouped table)
│
├─ templates/ (route /templates)
│  └─ TemplatesViewComponent              ← TemplatesView.jsx
│     └─ TemplateEditorComponent (dialog) ← TemplateEditor.jsx
│
└─ global overlays (driven by AppStore signals)
   ├─ ReviewDrawerComponent              ← ReviewDrawer.jsx
   └─ AnnotateModalComponent             ← AnnotateModal.jsx
```

Shared presentational pieces (`shared/`): `StatusMarkComponent`,
`AvatarComponent`, `MiniBarComponent`, `ReplicaStripComponent`,
`DialogComponent` (backdrop + panel wrapper), plus pure pipes/helpers for
`formatBytes`, filename rendering, and URL builders.

### 5.4 Data & helpers

Port `app/src/data/mockData.js` to `angular/src/app/data/mock-data.ts` with
explicit TypeScript interfaces: `Study`, `User`, `Examination`, `StatusMeta`,
`Template`, `Label`, `ProjectField`, `Project`, `Task`, `Submission`. Keep the
same seed values, `STATUS`/`STATUS_ORDER`, predicates (`isAnnotated`, `isDone`),
URL builders (`ohifViewUrl`, `ohifAnnotateUrl`, `shanoirExamUrl`), and filename
helpers (`renderFilename`, `timestampToken`, `segFilename`, `formatBytes`).

Interactions in components use Angular idioms: `@if`/`@for` for the JSX
conditionals/maps, `[class.x]` / `[style.background]` bindings for the inline
styles, `(click)` handlers calling `AppStore` methods, `[(ngModel)]` or signal
inputs for form controls.

## 6. Feature parity checklist

- [ ] Masthead: brand, three nav tabs (routerLink), "signed in as" user switcher
      (manager ↔ annotators), avatar. Role drives visibility everywhere.
- [ ] Projects workspace: 4-pane progressive-collapse layout (tree → browser →
      task list → preview), pin/expand rails, card/list toggle, mini progress
      bars, per-project overview, task preview (screenshots, DICOM-SEG, OHIF
      deep links, status select, open-editor).
- [ ] Project editor dialog: create/edit, type (segmentation+template / text+fields),
      member picker, sample (examination) picker with "select all", validation
      ("Name, ≥1 member, ≥1 sample"), delete (manager, existing only), task
      reconciliation on save.
- [ ] Annotations view: scope/project/status/annotator facets with counts,
      search, per-subject grouping, status density overview, bulk action bar
      (assign-all / split-across / delete) for managers, per-row actions
      (View / Annotate|Write / Open / Review), replica strip, output badges.
- [ ] Templates view: grid of label sets, label swatches, filename pattern,
      usage counts, new/edit template dialog.
- [ ] Review drawer: all submissions for an examination, side by side, with
      manager status changes.
- [ ] Annotate modal: segmentation (upload seg/screenshot, OHIF links) and text
      (fill fields) work; save bumps `todo → in_progress`; never auto-submits.
- [ ] Role rules: annotators see only their own tasks; managers get bulk ops,
      status editing, review, project/template create/edit/delete.
- [ ] "Mock data — no PHI" footer marker preserved.

## 7. Folder layout

```
angular/
  package.json, angular.json, tsconfig*.json
  Dockerfile.dev                 (Phase 8)
  src/
    index.html, main.ts, styles.css
    assets/css/shanoir-tokens.css
    app/
      app.component.ts/html/css
      app.routes.ts
      core/         app.store.ts, (interceptors later if needed)
      data/         mock-data.ts, models.ts
      shared/       status-mark/, avatar/, mini-bar/, replica-strip/, dialog/, pipes/
      masthead/
      projects/     workspace + tree/browser/task-list/preview/editor
      annotations/  view + sidebar/overview/bulk-action-bar/task-table
      templates/    view + editor
      overlays/     review-drawer/, annotate-modal/
```

## 8. Implementation phases

0. **Env + scaffold** — Node 20 LTS; `ng new angular` (standalone, CSS, routing);
   add Open Sans + Font Awesome; drop in `shanoir-tokens.css`; verify `ng serve`.
1. **Data layer** — port `mock-data.ts` + `models.ts`; unit-check a few helpers.
2. **Shell + theme** — AppComponent, MastheadComponent, routes, shared atoms
   (status-mark, avatar, mini-bar, dialog). App boots, nav switches routes.
3. **Annotations** — Sidebar, Overview, BulkActionBar, TaskTable + AppStore
   filter/selection/mutation logic. (This is the densest view; do it early to
   de-risk the store.)
4. **Templates** — TemplatesView + TemplateEditor.
5. **Projects workspace** — the four panes + collapse logic.
6. **Project editor** — dialog + reconciliation.
7. **Overlays** — ReviewDrawer + AnnotateModal.
8. **Deployment** — `angular/Dockerfile.dev`, optional `docker-compose` service
   behind Caddy; README + screenshots refresh.

Each phase ends runnable and visually checkable in the browser.

## 9. Deployment (Phase 8)

`angular/Dockerfile.dev` runs `ng serve --host 0.0.0.0`. Either add a second
compose service (`angular`) fronted by the same Caddy basic-auth pattern, or keep
it standalone. Decide at Phase 8; not on the critical path.

## 10. Risks & open questions

- **Node upgrade** on the dev box is a hard prerequisite (Angular 21 ⇒ Node ≥20).
- **Pixel-faithful Shanoir look** vs. the current polished layout: the dense 12px
  Open Sans utilitarian style will visibly change spacing/feel. That is intended
  per D3, but is the main thing to confirm.
- The React app leans on Tailwind's utility density; some bespoke layouts (the
  progressive-collapse rails, the density bar) need hand-written CSS in Angular.
- Angular Reactive Forms vs. template-driven for the editors — will pick per
  editor during Phase 6/7 (template-driven is closer to the React inline style).

## 11. Out of scope

- Real backend / Shanoir API / Keycloak auth (stays mock data).
- OHIF embedding (deep links only, as today).
- Deleting or changing the React `app/`.
- Pixel-identical parity with the *current* teal design (we are re-theming to
  Shanoir on purpose).
