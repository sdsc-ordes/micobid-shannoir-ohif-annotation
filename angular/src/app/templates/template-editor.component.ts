import { Component, HostListener, computed, effect, input, output, signal } from '@angular/core';
import { Label, Template } from '../data/models';
import { Dialog } from '../shared/dialog.component';

const blank = (): Template => ({
  id: '',
  name: '',
  color: '#0F766E',
  labels: [{ name: '', color: '#0F766E' }],
  screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}.png',
});

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

@Component({
  selector: 'app-template-editor',
  imports: [Dialog],
  templateUrl: './template-editor.component.html',
  styleUrl: './template-editor.component.css',
})
export class TemplateEditor {
  open = input.required<boolean>();
  template = input<Template | null>(null);
  isNew = input<boolean>(false);
  canDelete = input<boolean>(false);

  save = output<Template>();
  close = output<void>();
  remove = output<string>();

  draft = signal<Template>(blank());

  constructor() {
    // reset the draft whenever the dialog opens or the target template changes
    effect(() => {
      this.open();
      const t = this.template();
      this.draft.set(t ? { ...t, labels: t.labels.map(l => ({ ...l })) } : blank());
    });
  }

  canSave = computed(() => {
    const d = this.draft();
    return !!d.name.trim() && d.labels.length > 0 && d.labels.every(l => l.name.trim());
  });

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open()) this.close.emit(); }

  setField<K extends keyof Template>(k: K, v: Template[K]): void {
    this.draft.update(d => ({ ...d, [k]: v }));
  }
  setLabel(i: number, patch: Partial<Label>): void {
    this.draft.update(d => ({ ...d, labels: d.labels.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));
  }
  addLabel(): void {
    this.draft.update(d => ({ ...d, labels: [...d.labels, { name: '', color: d.color }] }));
  }
  removeLabel(i: number): void {
    this.draft.update(d => ({ ...d, labels: d.labels.filter((_, idx) => idx !== i) }));
  }

  handleSave(): void {
    const d = this.draft();
    const id = d.id || slugify(d.name);
    this.save.emit({ ...d, id, name: d.name.trim(), labels: d.labels.map(l => ({ ...l, name: l.name.trim() })) });
    this.close.emit();
  }

  onName(e: Event): void { this.setField('name', (e.target as HTMLInputElement).value); }
  onColor(e: Event): void { this.setField('color', (e.target as HTMLInputElement).value); }
  onPattern(e: Event): void { this.setField('screenshotPattern', (e.target as HTMLInputElement).value); }
  onLabelName(i: number, e: Event): void { this.setLabel(i, { name: (e.target as HTMLInputElement).value }); }
  onLabelColor(i: number, e: Event): void { this.setLabel(i, { color: (e.target as HTMLInputElement).value }); }
  onDelete(): void { const t = this.template(); if (t) { this.remove.emit(t.id); this.close.emit(); } }
}
