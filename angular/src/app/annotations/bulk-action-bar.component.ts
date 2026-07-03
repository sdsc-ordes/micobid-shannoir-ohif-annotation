import { Component, computed, inject, signal } from '@angular/core';
import { AppStore } from '../core/app.store';
import { annotators } from '../data/mock-data';
import { Avatar } from '../shared/avatar.component';

@Component({
  selector: 'app-bulk-action-bar',
  imports: [Avatar],
  template: `
    @if (selectedIds().length > 0) {
      <div class="card bar">
        <div class="head">
          <div class="count-lbl"><span class="n num">{{ selectedIds().length }}</span><span class="sel">selected</span></div>
          <div class="actions">
            <button class="btn btn-sm" [class.btn-primary]="open() === 'assign'" [class.btn-secondary]="open() !== 'assign'"
                    (click)="setOpen('assign')">Assign all</button>
            <button class="btn btn-sm" [class.btn-primary]="open() === 'split'" [class.btn-secondary]="open() !== 'split'"
                    (click)="setOpen('split')">Split across</button>
            <div class="divider"></div>
            <button class="btn btn-sm btn-danger" (click)="store.bulkRemove(); close()">Remove tasks</button>
            <button class="btn btn-sm btn-ghost" (click)="store.clearSelection(); close()">Clear</button>
          </div>
        </div>

        @if (open() === 'assign') {
          <div class="panel">
            <div class="label">Assign all {{ selectedIds().length }} tasks to one annotator</div>
            <div class="chips">
              @for (u of annotators; track u.id) {
                <button class="btn btn-sm btn-secondary" (click)="store.assignAll(u.id); close()">
                  <app-avatar [user]="u" size="sm" />{{ u.handle }}
                </button>
              }
            </div>
          </div>
        }

        @if (open() === 'split') {
          <div class="panel">
            <div class="label">Distribute {{ selectedIds().length }} tasks across annotators (round-robin)</div>
            <div class="grid">
              @for (u of annotators; track u.id) {
                <label class="opt">
                  <input type="checkbox" [checked]="splitChecks()[u.id]" (change)="setCheck(u.id, $event)" />
                  <app-avatar [user]="u" size="sm" /><span>{{ u.handle }}</span>
                </label>
              }
            </div>
            <div class="split-foot">
              <div class="caption">
                @if (splitTargets().length > 0) {
                  ≈ {{ perEach() }} task{{ perEach() !== 1 ? 's' : '' }} per annotator · {{ splitTargets().length }} annotator{{ splitTargets().length !== 1 ? 's' : '' }}
                } @else {
                  <span class="err">Pick at least one annotator</span>
                }
              </div>
              <button class="btn btn-sm btn-primary" [disabled]="splitTargets().length === 0"
                      (click)="store.splitAcross(splitTargets()); close()">Apply split</button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .bar { overflow: hidden; }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 16px;
            padding: 8px 14px; background: var(--accent-soft); border-bottom: 1px solid #d8d3e0; }
    .count-lbl { display: flex; align-items: baseline; gap: 6px; }
    .n { font-size: 18px; font-weight: 700; }
    .sel { font-size: 13px; color: var(--grey-mid); }
    .actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .divider { width: 1px; height: 18px; background: var(--grey-border); margin: 0 4px; }
    .panel { padding: 10px 14px; border-bottom: 1px solid var(--grey-border); }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; max-width: 520px; margin: 6px 0 10px; }
    .opt { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 3px 0; }
    .split-foot { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--grey-border); }
    .err { color: var(--error); }
  `],
})
export class BulkActionBar {
  store = inject(AppStore);
  readonly annotators = annotators();
  open = signal<'assign' | 'split' | null>(null);
  splitChecks = signal<Record<string, boolean>>(
    Object.fromEntries(annotators().map(a => [a.id, true])));

  selectedIds = computed(() => this.store.selectedIds());
  splitTargets = computed(() => Object.entries(this.splitChecks()).filter(([, on]) => on).map(([id]) => id));
  perEach = computed(() => this.splitTargets().length ? Math.ceil(this.selectedIds().length / this.splitTargets().length) : 0);

  setOpen(which: 'assign' | 'split'): void { this.open.update(o => o === which ? null : which); }
  close(): void { this.open.set(null); }
  setCheck(id: string, e: Event): void {
    const on = (e.target as HTMLInputElement).checked;
    this.splitChecks.update(c => ({ ...c, [id]: on }));
  }
}
