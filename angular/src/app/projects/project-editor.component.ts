import { Component, HostListener, computed, effect, inject, input, output, signal } from '@angular/core';
import { AppStore } from '../core/app.store';
import { EXAMINATIONS, annotators } from '../data/mock-data';
import { Examination, FieldKind, Project, ProjectField, ProjectType, Template } from '../data/models';
import { Dialog } from '../shared/dialog.component';
import { Avatar } from '../shared/avatar.component';

const slugify = (s: string): string =>
  'p-' + s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);

interface Draft {
  id: string; name: string; type: ProjectType; color: string;
  templateId: string; fields: ProjectField[]; instructions: string;
  memberIds: string[]; sampleExamIds: string[]; createdAt: string;
}

let fieldSeq = 100;

@Component({
  selector: 'app-project-editor',
  imports: [Dialog, Avatar],
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.css',
})
export class ProjectEditor {
  store = inject(AppStore);
  open = input.required<boolean>();
  project = input<Project | null>(null);
  isNew = input<boolean>(false);
  canDelete = input<boolean>(false);

  save = output<Project>();
  close = output<void>();
  remove = output<string>();

  readonly annotators = annotators();
  readonly subjects: { subjectId: string; list: Examination[] }[] = (() => {
    const map: Record<string, Examination[]> = {};
    EXAMINATIONS.forEach(e => { (map[e.subjectId] = map[e.subjectId] ?? []).push(e); });
    return Object.entries(map).map(([subjectId, list]) => ({ subjectId, list }));
  })();

  templates = computed<Template[]>(() => this.store.templates());
  draft = signal<Draft>(this.blank());

  constructor() {
    effect(() => {
      this.open();
      const p = this.project();
      this.draft.set(p ? {
        id: p.id, name: p.name, type: p.type, color: p.color,
        templateId: p.templateId ?? this.templates()[0]?.id ?? '',
        fields: p.fields ? p.fields.map(f => ({ ...f })) : this.blank().fields,
        instructions: p.instructions, memberIds: [...p.memberIds],
        sampleExamIds: [...p.sampleExamIds], createdAt: p.createdAt,
      } : this.blank());
    });
  }

  private blank(): Draft {
    return {
      id: '', name: '', type: 'segmentation', color: '#0F766E',
      templateId: this.store.templates()[0]?.id ?? '',
      fields: [{ id: 'f1', label: '', kind: 'long', required: true }],
      instructions: '', memberIds: [], sampleExamIds: [], createdAt: '2026-07-03',
    };
  }

  tplColor = computed(() => this.templates().find(t => t.id === this.draft().templateId)?.color);
  currentTemplate = computed(() => this.templates().find(t => t.id === this.draft().templateId));
  taskPreview = computed(() => this.draft().sampleExamIds.length * this.draft().memberIds.length);

  canSave = computed(() => {
    const d = this.draft();
    return !!d.name.trim() && d.memberIds.length > 0 && d.sampleExamIds.length > 0 &&
      (d.type === 'segmentation' ? !!d.templateId : d.fields.length > 0 && d.fields.every(f => f.label.trim()));
  });

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open()) this.close.emit(); }

  set<K extends keyof Draft>(k: K, v: Draft[K]): void { this.draft.update(d => ({ ...d, [k]: v })); }
  isMember = (id: string) => this.draft().memberIds.includes(id);
  isSample = (id: string) => this.draft().sampleExamIds.includes(id);
  toggleMember(id: string): void { this.toggle('memberIds', id); }
  toggleSample(id: string): void { this.toggle('sampleExamIds', id); }
  private toggle(k: 'memberIds' | 'sampleExamIds', val: string): void {
    this.draft.update(d => ({ ...d, [k]: d[k].includes(val) ? d[k].filter(x => x !== val) : [...d[k], val] }));
  }

  allPicked = (list: Examination[]) => list.every(e => this.isSample(e.examId));
  toggleSubject(list: Examination[]): void {
    const ids = list.map(e => e.examId);
    const all = this.allPicked(list);
    this.draft.update(d => ({
      ...d,
      sampleExamIds: all ? d.sampleExamIds.filter(x => !ids.includes(x)) : Array.from(new Set([...d.sampleExamIds, ...ids])),
    }));
  }

  setField(i: number, patch: Partial<ProjectField>): void {
    this.draft.update(d => ({ ...d, fields: d.fields.map((f, idx) => idx === i ? { ...f, ...patch } : f) }));
  }
  addField(): void {
    this.draft.update(d => ({ ...d, fields: [...d.fields, { id: `f${++fieldSeq}`, label: '', kind: 'short', required: false }] }));
  }
  removeField(i: number): void {
    this.draft.update(d => ({ ...d, fields: d.fields.filter((_, idx) => idx !== i) }));
  }

  onName(e: Event): void { this.set('name', (e.target as HTMLInputElement).value); }
  onTemplate(e: Event): void { this.set('templateId', (e.target as HTMLSelectElement).value); }
  onInstructions(e: Event): void { this.set('instructions', (e.target as HTMLTextAreaElement).value); }
  onFieldLabel(i: number, e: Event): void { this.setField(i, { label: (e.target as HTMLInputElement).value }); }
  onFieldKind(i: number, e: Event): void { this.setField(i, { kind: (e.target as HTMLSelectElement).value as FieldKind }); }
  onFieldReq(i: number, e: Event): void { this.setField(i, { required: (e.target as HTMLInputElement).checked }); }

  handleSave(): void {
    const d = this.draft();
    const id = d.id || slugify(d.name);
    const color = d.type === 'segmentation' ? (this.tplColor() ?? d.color) : d.color;
    const out: Project = {
      id, name: d.name.trim(), type: d.type, color, instructions: d.instructions,
      memberIds: d.memberIds, sampleExamIds: d.sampleExamIds, createdAt: d.createdAt,
      ...(d.type === 'segmentation'
        ? { templateId: d.templateId }
        : { fields: d.fields.map(f => ({ ...f, label: f.label.trim() })) }),
    };
    this.save.emit(out);
    this.close.emit();
  }

  onDelete(): void { const p = this.project(); if (p) { this.remove.emit(p.id); this.close.emit(); } }
}
