import { Component, HostListener, computed, inject } from '@angular/core';
import { AppStore } from '../core/app.store';
import {
  STATUS, examById, ohifAnnotateUrl, ohifViewUrl, shanoirExamUrl, userById,
} from '../data/mock-data';
import { Submission, Task } from '../data/models';
import { Avatar } from '../shared/avatar.component';
import { BytesPipe } from '../shared/format.pipes';

@Component({
  selector: 'app-review-drawer',
  imports: [Avatar, BytesPipe],
  templateUrl: './review-drawer.component.html',
  styleUrl: './review-drawer.component.css',
})
export class ReviewDrawer {
  store = inject(AppStore);
  readonly STATUS = STATUS;
  readonly userById = userById;
  readonly shanoirExamUrl = shanoirExamUrl;

  review = computed(() => this.store.review());
  exam = computed(() => { const r = this.review(); return r ? examById(r.examId) : undefined; });
  project = computed(() => { const r = this.review(); return r ? this.store.projectsById()[r.projectId] : undefined; });
  isText = computed(() => this.project()?.type === 'text');
  tasks = computed<Task[]>(() => {
    const r = this.review();
    return r ? this.store.tasks().filter(t => t.examId === r.examId && t.projectId === r.projectId) : [];
  });

  ohifView = computed(() => { const e = this.exam(); return e ? ohifViewUrl(e.studyInstanceUID) : '#'; });
  ohifEdit = computed(() => { const e = this.exam(); return e ? ohifAnnotateUrl(e.studyInstanceUID) : '#'; });

  files = (t: Task): Submission[] => [
    ...t.submissions.filter(f => f.kind === 'seg'),
    ...t.submissions.filter(f => f.kind === 'screenshot'),
  ];
  hasAnswers = (t: Task) => Object.values(t.answers ?? {}).some(v => v && v.trim());

  close(): void { this.store.closeReview(); }
  setStatus(id: string, status: 'accepted' | 'revisions' | 'submitted'): void { this.store.statusChange(id, status); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.review()) this.close(); }
}
