import { Component, computed, inject } from '@angular/core';
import { AppStore } from '../core/app.store';
import {
  EXAMINATIONS, STATUS, examById, userById, ohifViewUrl, shanoirExamUrl,
} from '../data/mock-data';
import { Project, StatusId, Task, User } from '../data/models';
import { StatusMark } from '../shared/status-mark.component';
import { Avatar } from '../shared/avatar.component';
import { ReplicaStrip } from '../shared/replica-strip.component';

interface Group { subjectId: string; rows: Task[]; }

@Component({
  selector: 'app-task-table',
  imports: [StatusMark, Avatar, ReplicaStrip],
  templateUrl: './task-table.component.html',
  styleUrl: './task-table.component.css',
})
export class TaskTable {
  store = inject(AppStore);
  readonly STATUS = STATUS;
  readonly statusList = Object.values(STATUS);

  isManager = computed(() => this.store.currentUser().role === 'manager');
  filtered = computed(() => this.store.filtered());
  allTasks = computed(() => this.store.tasks());
  selectedIds = computed(() => this.store.selectedIds());

  grouped = computed<Group[]>(() => {
    const out: Group[] = [];
    const idx: Record<string, number> = {};
    for (const t of this.filtered()) {
      if (!(t.subjectId in idx)) { idx[t.subjectId] = out.length; out.push({ subjectId: t.subjectId, rows: [] }); }
      out[idx[t.subjectId]].rows.push(t);
    }
    return out;
  });

  allSelected = computed(() =>
    this.filtered().length > 0 && this.filtered().every(t => this.selectedIds().includes(t.id)));

  // ─── per-row derivations ───────────────────────────────────────────────────
  exam = (t: Task) => examById(t.examId)!;
  user = (t: Task): User | null => userById(t.assigneeId);
  project = (t: Task): Project | undefined => this.store.projectsById()[t.projectId];
  isText = (t: Task) => this.project(t)?.type === 'text';
  isSelected = (t: Task) => this.selectedIds().includes(t.id);
  isAssigned = (t: Task) => t.assigneeId === this.store.currentUser().id;
  replicas = (t: Task) =>
    this.allTasks().filter(x => x.examId === t.examId && x.projectId === t.projectId && x.id !== t.id);
  segCount = (t: Task) => t.submissions.filter(f => f.kind === 'seg').length;
  pngCount = (t: Task) => t.submissions.filter(f => f.kind === 'screenshot').length;
  answerCount = (t: Task) => Object.values(t.answers ?? {}).filter(v => v && v.trim()).length;
  fieldCount = (t: Task) => this.project(t)?.fields?.length ?? 0;
  canReview = (t: Task) => this.isManager() &&
    this.replicas(t).some(r => r.submissions.length > 0 || Object.keys(r.answers ?? {}).length > 0);
  canWork = (t: Task) => this.isManager() || this.isAssigned(t);

  seriesPreview = (t: Task) => {
    const s = this.exam(t).series;
    return s.slice(0, 3).join(' · ') + (s.length > 3 ? ` · +${s.length - 3}` : '');
  };
  seriesTitle = (t: Task) => this.exam(t).series.join(', ');

  // ─── subject group helpers ─────────────────────────────────────────────────
  subjectExamCount = (subjectId: string) => EXAMINATIONS.filter(e => e.subjectId === subjectId).length;
  subjectTaskCount = (subjectId: string) => this.allTasks().filter(t => t.subjectId === subjectId).length;
  subjectAllSelected = (rows: Task[]) => rows.length > 0 && rows.every(r => this.selectedIds().includes(r.id));

  // ─── links / actions ───────────────────────────────────────────────────────
  shanoirExamUrl = shanoirExamUrl;
  ohifUrl = (t: Task) => ohifViewUrl(this.exam(t).studyInstanceUID);

  onSelect(t: Task, e: Event): void { this.store.select(t.id, (e.target as HTMLInputElement).checked); }
  onSelectAll(e: Event): void { this.store.selectAll((e.target as HTMLInputElement).checked); }
  onStatus(t: Task, e: Event): void { this.store.statusChange(t.id, (e.target as HTMLSelectElement).value as StatusId); }
}
