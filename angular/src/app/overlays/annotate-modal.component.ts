import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { AppStore } from '../core/app.store';
import {
  STATUS, STATUS_ORDER, examById, userById,
  ohifAnnotateUrl, ohifViewUrl, shanoirExamUrl,
  timestampToken, renderFilename, segFilename,
} from '../data/mock-data';
import { StatusId, Submission } from '../data/models';
import { BytesPipe } from '../shared/format.pipes';

@Component({
  selector: 'app-annotate-modal',
  imports: [BytesPipe],
  templateUrl: './annotate-modal.component.html',
  styleUrl: './annotate-modal.component.css',
})
export class AnnotateModal {
  store = inject(AppStore);
  readonly STATUS = STATUS;
  readonly STATUS_ORDER = STATUS_ORDER;
  readonly shanoirExamUrl = shanoirExamUrl;

  answers = signal<Record<string, string>>({});
  stagedFiles = signal<Submission[]>([]);
  copied = signal<string | null>(null);
  private ts = signal<string>('');

  task = computed(() => {
    const id = this.store.annotateTaskId();
    return id ? this.store.tasks().find(t => t.id === id) ?? null : null;
  });
  project = computed(() => { const t = this.task(); return t ? this.store.projectsById()[t.projectId] ?? null : null; });
  template = computed(() => {
    const p = this.project();
    return p?.type === 'segmentation' && p.templateId ? this.store.templatesById()[p.templateId] ?? null : null;
  });
  currentUser = computed(() => this.store.currentUser());

  exam = computed(() => { const t = this.task(); return t ? examById(t.examId) : undefined; });
  assignee = computed(() => { const t = this.task(); return t ? userById(t.assigneeId) : null; });
  isManager = computed(() => this.currentUser().role === 'manager');
  isAssigned = computed(() => this.task()?.assigneeId === this.currentUser().id);
  canWork = computed(() => this.isManager() || this.isAssigned());
  isText = computed(() => this.project()?.type === 'text');
  locked = computed(() => this.task()?.status === 'accepted');

  ohifView = computed(() => { const e = this.exam(); return e ? ohifViewUrl(e.studyInstanceUID) : '#'; });
  ohifEdit = computed(() => { const e = this.exam(); return e ? ohifAnnotateUrl(e.studyInstanceUID) : '#'; });

  labelsBlock = computed(() => { const t = this.template(); return t ? t.labels.map(l => `${l.name}\t${l.color}`).join('\n') : ''; });
  screenshotFilename = computed(() => {
    const tpl = this.template(); const e = this.exam();
    if (!tpl || !e) return '';
    return renderFilename(tpl.screenshotPattern, { exam: e, annotator: this.assignee() ?? this.currentUser(), ts: this.ts() });
  });
  segDefaultFilename = computed(() => this.template() ? segFilename(this.screenshotFilename()) : '');

  segCount = computed(() =>
    this.stagedFiles().filter(f => f.kind === 'seg').length + (this.task()?.submissions.filter(f => f.kind === 'seg').length ?? 0));
  pngCount = computed(() =>
    this.stagedFiles().filter(f => f.kind === 'screenshot').length + (this.task()?.submissions.filter(f => f.kind === 'screenshot').length ?? 0));

  answersDirty = computed(() =>
    this.isText() && JSON.stringify(this.answers()) !== JSON.stringify(this.task()?.answers ?? {}));
  hasWork = computed(() => this.stagedFiles().length > 0 || this.answersDirty());

  constructor() {
    // reset local editing state whenever the target task changes
    effect(() => {
      this.store.annotateTaskId();
      const t = this.task();
      this.answers.set(t?.answers ? { ...t.answers } : {});
      this.stagedFiles.set([]);
      this.ts.set(timestampToken());
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.task()) this.close(); }

  close(): void { this.store.closeAnnotate(); }

  setAnswer(fieldId: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.answers.update(a => ({ ...a, [fieldId]: v }));
  }

  onFilePick(kind: 'seg' | 'screenshot', e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length) {
      this.stagedFiles.update(prev => [
        ...prev,
        ...files.map(f => ({ kind, filename: f.name, size: f.size, uploadedAt: '2026-07-03' } as Submission)),
      ]);
    }
    input.value = '';
  }
  removeStaged(i: number): void { this.stagedFiles.update(prev => prev.filter((_, idx) => idx !== i)); }

  copy(text: string, key: string): void {
    navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(key);
      setTimeout(() => this.copied.set(null), 1200);
    });
  }

  onStatus(e: Event): void {
    const t = this.task();
    if (t) this.store.statusChange(t.id, (e.target as HTMLSelectElement).value as StatusId);
  }

  handleSave(): void {
    const t = this.task();
    if (!t) return;
    this.store.saveWork(t.id, { addFiles: this.stagedFiles(), answers: this.isText() ? this.answers() : null });
    this.close();
  }
}
