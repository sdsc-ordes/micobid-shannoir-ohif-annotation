import { Component, computed, input, output } from '@angular/core';
import { STATUS, examById, isDone, shanoirExamUrl, userById } from '../data/mock-data';
import { Project, Task } from '../data/models';
import { MiniBar } from '../shared/mini-bar.component';
import { Avatar } from '../shared/avatar.component';
import { StatusMark } from '../shared/status-mark.component';

@Component({
  selector: 'app-project-task-list',
  imports: [MiniBar, Avatar, StatusMark],
  template: `
    @if (!project()) {
      <div class="empty-pane">
        <div>
          <div class="e-title">Select a project</div>
          <div class="caption">Pick a project from the tree or the list to see its tasks.</div>
        </div>
      </div>
    } @else {
      <div class="pane">
        <div class="head">
          <div class="min0">
            <div class="title-row">
              <span class="sw" [style.background]="project()!.color"></span>
              <h2>{{ project()!.name }}</h2>
              <span class="type">{{ project()!.type === 'text' ? 'text' : 'seg' }}</span>
            </div>
            <div class="caption">{{ tasks().length }} tasks · {{ pct() }}% accepted</div>
          </div>
          <div class="head-right">
            <div class="bar28"><app-mini-bar [tasks]="tasks()" /></div>
            @if (isManager()) { <button class="btn btn-sm btn-secondary" (click)="edit.emit(project()!)">Edit</button> }
          </div>
        </div>

        <div class="body">
          @for (examId of project()!.sampleExamIds; track examId) {
            <div class="sample">
              <div class="s-head">
                <a [href]="shanoirExamUrl(examId)" target="_blank" rel="noreferrer" class="link mono">#{{ examId }}</a>
                <span class="caption">subj {{ examById(examId)?.subjectId }} · {{ examById(examId)?.date }} · {{ examById(examId)?.series?.length }} series</span>
                <span class="spacer"></span>
                <span class="caption num">{{ doneCount(examId) }}/{{ sampleTasks(examId).length }} done</span>
              </div>
              <div class="rows">
                @if (sampleTasks(examId).length === 0) { <div class="caption none">no tasks for this sample</div> }
                @for (t of sampleTasks(examId); track t.id) {
                  <button class="t-row" [class.sel]="t.id === selectedTaskId()" (click)="selectTask.emit(t.id)">
                    <app-avatar [user]="userById(t.assigneeId)" size="sm" />
                    <span class="handle">{{ userById(t.assigneeId)?.handle }}</span>
                    <app-status-mark [status]="t.status" />
                    <span class="out caption">{{ outLabel(t) }}</span>
                    <span class="chev">›</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { flex: 1; min-width: 0; display: flex; }
    .empty-pane { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; }
    .e-title { font-size: 14px; font-weight: 600; color: var(--grey-mid); }
    .pane { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .mono { font-family: "Open Sans", monospace; }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--grey-border); background: #fff; }
    .min0 { min-width: 0; }
    .title-row { display: flex; align-items: center; gap: 8px; }
    .title-row h2 { font-size: 15px; font-weight: 700; color: var(--grey-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sw { width: 10px; height: 10px; border-radius: 2px; }
    .type { font-size: 10px; font-family: "Open Sans", monospace; text-transform: uppercase; padding: 1px 5px; border-radius: 2px; background: var(--bg-panel); color: var(--grey-mid); }
    .head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .bar28 { width: 112px; }
    .body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 16px; }
    .s-head { display: flex; align-items: center; gap: 8px; padding: 0 4px 6px; }
    .spacer { flex: 1; }
    .rows { display: flex; flex-direction: column; gap: 4px; }
    .none { padding: 6px 4px; font-style: italic; }
    .t-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid var(--grey-border); border-radius: 2px; background: #fff; cursor: pointer; font: inherit; text-align: left; }
    .t-row.sel { border-color: var(--brand); background: var(--accent-soft); }
    .handle { font-size: 13px; color: var(--grey-dark); width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .out { margin-left: auto; }
    .chev { color: #ccc; }
  `],
})
export class ProjectTaskList {
  project = input<Project | null>(null);
  tasks = input.required<Task[]>();
  selectedTaskId = input<string | null>(null);
  isManager = input<boolean>(false);

  selectTask = output<string>();
  edit = output<Project>();

  readonly examById = examById;
  readonly userById = userById;
  readonly shanoirExamUrl = shanoirExamUrl;

  pct = computed(() => {
    const ts = this.tasks();
    return ts.length ? Math.round(ts.filter(t => isDone(t.status)).length / ts.length * 100) : 0;
  });

  sampleTasks = (examId: string) => this.tasks().filter(t => t.examId === examId);
  doneCount = (examId: string) => this.sampleTasks(examId).filter(t => isDone(t.status)).length;

  outLabel = (t: Task): string => {
    if (this.project()?.type === 'text') {
      const answers = Object.values(t.answers ?? {}).filter(v => v && v.trim()).length;
      return `${answers}/${this.project()?.fields?.length ?? 0} fields`;
    }
    return t.submissions.length ? `${t.submissions.length} file${t.submissions.length !== 1 ? 's' : ''}` : '—';
  };
}
