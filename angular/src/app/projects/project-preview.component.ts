import { Component, computed, inject, input, output } from '@angular/core';
import { AppStore } from '../core/app.store';
import {
  STATUS, STATUS_ORDER, examById, ohifAnnotateUrl, ohifViewUrl, userById,
} from '../data/mock-data';
import { Project, StatusId, Task, Template } from '../data/models';
import { Avatar } from '../shared/avatar.component';
import { StatusMark } from '../shared/status-mark.component';
import { BytesPipe } from '../shared/format.pipes';

@Component({
  selector: 'app-project-preview',
  imports: [Avatar, StatusMark, BytesPipe],
  templateUrl: './project-preview.component.html',
  styleUrl: './project-preview.component.css',
})
export class ProjectPreview {
  store = inject(AppStore);
  project = input<Project | null>(null);
  template = input<Template | null>(null);
  task = input<Task | null>(null);

  openEditor = output<string>();
  close = output<void>();

  readonly STATUS = STATUS;
  readonly STATUS_ORDER = STATUS_ORDER;
  readonly userById = userById;

  isManager = computed(() => this.store.currentUser().role === 'manager');
  isText = computed(() => this.project()?.type === 'text');
  exam = computed(() => { const t = this.task(); return t ? examById(t.examId) : undefined; });
  user = computed(() => { const t = this.task(); return t ? userById(t.assigneeId) : null; });
  segs = computed(() => this.task()?.submissions.filter(f => f.kind === 'seg') ?? []);
  pngs = computed(() => this.task()?.submissions.filter(f => f.kind === 'screenshot') ?? []);

  ohifView = computed(() => { const e = this.exam(); return e ? ohifViewUrl(e.studyInstanceUID) : '#'; });
  ohifEdit = computed(() => { const e = this.exam(); return e ? ohifAnnotateUrl(e.studyInstanceUID) : '#'; });

  onStatus(e: Event): void {
    const t = this.task();
    if (t) this.store.statusChange(t.id, (e.target as HTMLSelectElement).value as StatusId);
  }
}
