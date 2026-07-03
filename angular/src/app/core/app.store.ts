// Central application state — a signal-based port of app/src/App.jsx.
// One store; components are thin projections of it.

import { Injectable, computed, signal } from '@angular/core';
import {
  USERS, INITIAL_TASKS, SEED_TEMPLATES, SEED_PROJECTS, examById,
} from '../data/mock-data';
import {
  Filters, Project, StatusId, Submission, Task, Template, User,
} from '../data/models';

const today = (): string => new Date().toISOString().slice(0, 10);

export interface ReviewTarget { examId: string; projectId: string; }
export interface SaveWorkPayload { addFiles?: Submission[]; answers?: Record<string, string> | null; }

@Injectable({ providedIn: 'root' })
export class AppStore {
  // ─── state ───────────────────────────────────────────────────────────────
  readonly tasks = signal<Task[]>(INITIAL_TASKS);
  readonly templates = signal<Template[]>(SEED_TEMPLATES);
  readonly projects = signal<Project[]>(SEED_PROJECTS);
  readonly currentUserId = signal<string>('u1');
  readonly selectedIds = signal<string[]>([]);
  readonly filters = signal<Filters>({
    mineOnly: false, status: null, assignee: null, project: null, search: '',
  });
  readonly review = signal<ReviewTarget | null>(null);
  readonly annotateTaskId = signal<string | null>(null);

  private nextTaskId = 1000;

  // ─── derived ───────────────────────────────────────────────────────────────
  readonly currentUser = computed<User>(() =>
    USERS.find(u => u.id === this.currentUserId())!);

  readonly templatesById = computed<Record<string, Template>>(() =>
    Object.fromEntries(this.templates().map(t => [t.id, t])));

  readonly projectsById = computed<Record<string, Project>>(() =>
    Object.fromEntries(this.projects().map(p => [p.id, p])));

  // annotators only ever see their own tasks
  readonly baseTasks = computed<Task[]>(() => {
    const u = this.currentUser();
    return u.role === 'annotator'
      ? this.tasks().filter(t => t.assigneeId === u.id)
      : this.tasks();
  });

  readonly filtered = computed<Task[]>(() => {
    const f = this.filters();
    const uid = this.currentUser().id;
    return this.baseTasks().filter(t => {
      if (f.mineOnly && t.assigneeId !== uid) return false;
      if (f.status && t.status !== f.status) return false;
      if (f.assignee && t.assigneeId !== f.assignee) return false;
      if (f.project && t.projectId !== f.project) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        const e = examById(t.examId);
        const hay = `${e?.series.join(' ') ?? ''} ${t.subjectId} ${t.examId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  // ─── selection ─────────────────────────────────────────────────────────────
  select(id: string, on: boolean): void {
    this.selectedIds.update(prev => on ? [...prev, id] : prev.filter(x => x !== id));
  }
  selectAll(on: boolean): void {
    this.selectedIds.set(on ? this.filtered().map(t => t.id) : []);
  }
  selectSubject(subjectId: string, on: boolean): void {
    const ids = this.filtered().filter(t => t.subjectId === subjectId).map(t => t.id);
    this.selectedIds.update(prev => on
      ? Array.from(new Set([...prev, ...ids]))
      : prev.filter(id => !ids.includes(id)));
  }
  clearSelection(): void { this.selectedIds.set([]); }

  // ─── task mutations (manager) ────────────────────────────────────────────────
  updateTask(id: string, patch: Partial<Task>): void {
    this.tasks.update(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }
  statusChange(id: string, status: StatusId): void {
    this.updateTask(id, { status, updatedAt: today() });
  }
  assignAll(userId: string): void {
    const sel = this.selectedIds();
    this.tasks.update(prev => prev.map(t =>
      sel.includes(t.id) ? { ...t, assigneeId: userId, updatedAt: today() } : t));
    this.clearSelection();
  }
  splitAcross(userIds: string[]): void {
    if (!userIds.length) return;
    const sel = this.selectedIds();
    let i = 0;
    this.tasks.update(prev => prev.map(t => {
      if (!sel.includes(t.id)) return t;
      const a = userIds[i % userIds.length]; i++;
      return { ...t, assigneeId: a, updatedAt: today() };
    }));
    this.clearSelection();
  }
  bulkRemove(): void {
    const sel = this.selectedIds();
    this.tasks.update(prev => prev.filter(t => !sel.includes(t.id)));
    this.clearSelection();
  }
  unassign(id: string): void {
    this.tasks.update(prev => prev.filter(t => t.id !== id));
  }

  // ─── annotation work (annotator or manager) ─────────────────────────────────
  // Saves files / text answers. Never sets status to submitted — that is a
  // manager action. Bumps todo → in_progress on first work.
  saveWork(taskId: string, { addFiles = [], answers = null }: SaveWorkPayload = {}): void {
    this.tasks.update(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const submissions = addFiles.length ? [...t.submissions, ...addFiles] : t.submissions;
      const nextAnswers = answers !== null ? answers : t.answers;
      const status: StatusId = t.status === 'todo' ? 'in_progress' : t.status;
      return { ...t, submissions, answers: nextAnswers, status, updatedAt: today() };
    }));
  }

  // ─── projects ────────────────────────────────────────────────────────────────
  private reconcileTasks(project: Project): void {
    this.tasks.update(prev => {
      const others = prev.filter(t => t.projectId !== project.id);
      const mine = prev.filter(t => t.projectId === project.id);

      // keep valid combos; drop tasks whose member/sample was removed AND has no work
      const kept = mine.filter(t => {
        const valid = project.memberIds.includes(t.assigneeId) && project.sampleExamIds.includes(t.examId);
        const hasWork = t.submissions.length > 0 || Object.values(t.answers ?? {}).some(v => v && v.trim());
        return valid || hasWork;
      });

      const existing = new Set(kept.map(t => `${t.examId}:${t.assigneeId}`));
      const created: Task[] = [];
      project.sampleExamIds.forEach(examId => {
        const e = examById(examId);
        if (!e) return;
        project.memberIds.forEach(uid => {
          if (existing.has(`${examId}:${uid}`)) return;
          created.push({
            id: `n${++this.nextTaskId}`,
            projectId: project.id,
            examId, subjectId: e.subjectId, assigneeId: uid,
            status: 'todo', submissions: [], answers: {}, updatedAt: today(), notes: '',
          });
        });
      });
      return [...others, ...kept, ...created];
    });
  }

  saveProject(project: Project): void {
    this.projects.update(prev => {
      const i = prev.findIndex(p => p.id === project.id);
      return i >= 0 ? prev.map((p, idx) => idx === i ? project : p) : [...prev, project];
    });
    this.reconcileTasks(project);
  }
  deleteProject(id: string): void {
    this.projects.update(prev => prev.filter(p => p.id !== id));
    this.tasks.update(prev => prev.filter(t => t.projectId !== id));
  }

  // ─── templates ───────────────────────────────────────────────────────────────
  saveTemplate(tpl: Template): void {
    this.templates.update(prev => {
      const i = prev.findIndex(t => t.id === tpl.id);
      return i >= 0 ? prev.map((t, idx) => idx === i ? tpl : t) : [...prev, tpl];
    });
  }
  deleteTemplate(id: string): void {
    this.templates.update(prev => prev.filter(t => t.id !== id));
  }

  // ─── overlays ──────────────────────────────────────────────────────────────
  openReview(examId: string, projectId: string): void { this.review.set({ examId, projectId }); }
  closeReview(): void { this.review.set(null); }
  openAnnotate(taskId: string): void { this.annotateTaskId.set(taskId); }
  closeAnnotate(): void { this.annotateTaskId.set(null); }

  // ─── id helpers for editors creating new entities ──────────────────────────
  newProjectId(): string { return `p${++this.nextTaskId}`; }
  newTemplateId(): string { return `tpl${++this.nextTaskId}`; }

  setFilter(patch: Partial<Filters>): void { this.filters.update(f => ({ ...f, ...patch })); }
}
