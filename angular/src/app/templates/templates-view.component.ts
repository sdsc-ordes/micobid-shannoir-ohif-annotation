import { Component, computed, inject, signal } from '@angular/core';
import { AppStore } from '../core/app.store';
import { Template } from '../data/models';
import { TemplateEditor } from './template-editor.component';

@Component({
  selector: 'app-templates-view',
  imports: [TemplateEditor],
  template: `
    <main class="content">
      <div class="head">
        <div>
          <h2>Templates</h2>
          <div class="caption sub">
            {{ store.templates().length }} template{{ store.templates().length !== 1 ? 's' : '' }}{{ !isManager() ? ' · read-only — only managers can edit' : '' }}
          </div>
        </div>
        @if (isManager()) {
          <button class="btn btn-primary" (click)="create()">+ New template</button>
        }
      </div>

      <div class="grid">
        @for (t of store.templates(); track t.id) {
          <article class="card tpl">
            <header class="tpl-head">
              <div class="swatch" [style.background]="t.color"></div>
              <div class="tpl-meta">
                <div class="tpl-title">
                  <h3>{{ t.name }}</h3>
                  <span class="mono id">{{ t.id }}</span>
                </div>
                <div class="caption">
                  {{ t.labels.length }} label{{ t.labels.length !== 1 ? 's' : '' }} · used in {{ usageCount(t.id) }} project{{ usageCount(t.id) !== 1 ? 's' : '' }}
                </div>
              </div>
              @if (isManager()) {
                <button class="btn btn-sm btn-secondary" (click)="edit(t)">Edit</button>
              }
            </header>

            <div class="chips">
              @for (l of t.labels; track l.name) {
                <span class="chip">
                  <span class="sw" [style.background]="l.color"></span>
                  <span>{{ l.name }}</span>
                  <span class="mono hex num">{{ l.color }}</span>
                </span>
              }
            </div>

            <div class="instructions">
              @if (t.instructions) { {{ t.instructions }} }
              @else { <span class="muted">No instructions yet</span> }
            </div>

            <div class="caption mono pattern" [title]="t.screenshotPattern">⌘ {{ t.screenshotPattern }}</div>
          </article>
        }
      </div>
    </main>

    <app-template-editor
      [open]="editing() !== null || isNew()"
      [template]="editing()"
      [isNew]="isNew()"
      [canDelete]="isManager()"
      (save)="store.saveTemplate($event)"
      (remove)="store.deleteTemplate($event)"
      (close)="close()" />
  `,
  styles: [`
    :host { display: block; flex: 1; min-height: 0; overflow-y: auto; }
    .content { padding: 18px 22px; display: flex; flex-direction: column; gap: 18px; }
    .head { display: flex; align-items: center; justify-content: space-between; }
    h2 { font-size: 18px; font-weight: 700; color: var(--grey-dark); }
    .sub { margin-top: 2px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
    .tpl { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .tpl-head { display: flex; align-items: flex-start; gap: 12px; }
    .swatch { width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0; border: 1px solid var(--grey-border); }
    .tpl-meta { flex: 1; min-width: 0; }
    .tpl-title { display: flex; align-items: center; gap: 8px; }
    .tpl-title h3 { font-size: 15px; font-weight: 700; color: var(--grey-dark); }
    .id { font-size: 11px; color: var(--grey-mid); }
    .mono { font-family: "Open Sans", monospace; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border: 1px solid #eee; border-radius: 2px; font-size: 11px; background: #fff; }
    .chip .sw { width: 10px; height: 10px; border-radius: 2px; border: 1px solid var(--grey-border); }
    .chip .hex { font-size: 10px; color: var(--grey-mid); }
    .instructions { font-size: 12px; color: var(--grey-dark); background: var(--bg-alt); border: 1px solid #eee; border-radius: 2px; padding: 10px; line-height: 1.5; max-height: 96px; overflow-y: auto; white-space: pre-wrap; }
    .muted { color: #aaa; font-style: italic; }
    .pattern { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class TemplatesView {
  store = inject(AppStore);
  editing = signal<Template | null>(null);
  isNew = signal<boolean>(false);

  isManager = computed(() => this.store.currentUser().role === 'manager');
  usageCount = (id: string) => this.store.projects().filter(p => p.templateId === id).length;

  edit(t: Template): void { this.editing.set(t); this.isNew.set(false); }
  create(): void { this.editing.set(null); this.isNew.set(true); }
  close(): void { this.editing.set(null); this.isNew.set(false); }
}
