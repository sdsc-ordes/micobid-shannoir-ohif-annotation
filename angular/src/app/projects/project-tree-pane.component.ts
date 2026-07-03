import { Component, computed, input, output, signal } from '@angular/core';
import { STATUS, examById, userById } from '../data/mock-data';
import { Project, Task } from '../data/models';
import { MiniBar } from '../shared/mini-bar.component';

@Component({
  selector: 'app-project-tree-pane',
  imports: [MiniBar],
  template: `
    @if (collapsed()) {
      <div class="rail">
        <button class="ico" title="Expand outline" (click)="expand.emit()">☰</button>
        <div class="sep"></div>
        @for (p of projects(); track p.id) {
          <button class="dot" [class.on]="p.id === selectedProjectId()" [style.background]="p.color"
                  [title]="p.name" (click)="selectProject.emit(p.id)">{{ p.type === 'text' ? 'T' : 'S' }}</button>
        }
      </div>
    } @else {
      <div class="pane">
        <div class="hd-row">
          <span class="label">Outline</span>
          @if (selectedProjectId()) {
            <button class="collapse" title="Collapse outline" (click)="collapse.emit()">‹</button>
          }
        </div>
        <div class="tree">
          @for (p of projects(); track p.id) {
            <div class="p-row" [class.sel]="p.id === selectedProjectId()">
              <button class="chev" (click)="toggle(p.id)">{{ isOpen(p.id) ? '▾' : '▸' }}</button>
              <button class="p-btn" (click)="selectProject.emit(p.id)">
                <span class="sw" [style.background]="p.color"></span>
                <span class="p-name">{{ p.name }}</span>
                <span class="cnt num">{{ tasksOf(p.id).length }}</span>
              </button>
            </div>
            @if (isOpen(p.id)) {
              @for (examId of p.sampleExamIds; track examId) {
                <div class="s-row">
                  <button class="chev" (click)="toggleSample(p.id + examId)">{{ isSampleOpen(p.id + examId) ? '▾' : '▸' }}</button>
                  <span class="mono">#{{ examId }}</span>
                  <span class="subj">{{ examById(examId)?.subjectId }}</span>
                  <span class="bar"><app-mini-bar [tasks]="sampleTasks(p.id, examId)" /></span>
                </div>
                @if (isSampleOpen(p.id + examId)) {
                  @for (t of sampleTasks(p.id, examId); track t.id) {
                    <button class="t-row" [class.sel]="t.id === selectedTaskId()" (click)="selectTask.emit({ projectId: p.id, taskId: t.id })">
                      <span class="mark-dot" [style.background]="STATUS[t.status].bar"></span>
                      <span class="handle">{{ userById(t.assigneeId)?.handle }}</span>
                    </button>
                  }
                  @if (sampleTasks(p.id, examId).length === 0) { <div class="empty">no tasks</div> }
                }
              }
            }
          }
          @if (projects().length === 0) { <div class="empty pad">No projects</div> }
        </div>
      </div>
    }
  `,
  styles: [`
    .rail { width: 46px; flex-shrink: 0; background: #fff; border-right: 1px solid var(--grey-border); display: flex; flex-direction: column; align-items: center; padding: 10px 0; gap: 8px; }
    .ico { background: none; border: none; cursor: pointer; color: var(--grey-mid); width: 28px; height: 28px; border-radius: 3px; }
    .ico:hover { background: var(--bg-panel); }
    .sep { width: 24px; border-top: 1px solid var(--grey-border); }
    .dot { width: 32px; height: 32px; border-radius: 50%; border: none; color: #fff; font-size: 9px; font-weight: 700; cursor: pointer; }
    .dot.on { outline: 2px solid var(--brand); outline-offset: 1px; }

    .pane { width: 220px; flex-shrink: 0; background: #fff; border-right: 1px solid var(--grey-border); overflow-y: auto; }
    .hd-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 12px 8px; }
    .collapse { background: none; border: none; cursor: pointer; color: var(--grey-mid); font-size: 15px; line-height: 1; width: 22px; height: 22px; border-radius: 3px; }
    .collapse:hover { background: var(--bg-panel); color: var(--brand); }
    .tree { padding-bottom: 14px; }
    .mono { font-family: "Open Sans", monospace; font-size: 12px; }
    .p-row { display: flex; align-items: center; gap: 4px; padding: 5px 6px; margin: 0 4px; border-radius: 2px; }
    .p-row.sel { background: var(--accent-soft); }
    .p-row.sel .p-name { color: var(--brand); }
    .chev { background: none; border: none; cursor: pointer; color: var(--grey-mid); font-size: 9px; padding: 2px; }
    .p-btn { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; background: none; border: none; cursor: pointer; text-align: left; font: inherit; color: var(--grey-dark); }
    .sw { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .p-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .cnt { margin-left: auto; font-size: 10px; color: var(--grey-mid); }
    .s-row { display: flex; align-items: center; gap: 6px; padding: 3px 6px 3px 26px; margin: 0 4px; font-size: 12px; color: var(--grey-mid); }
    .subj { color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar { margin-left: auto; width: 32px; }
    .t-row { display: flex; align-items: center; gap: 8px; padding: 3px 6px 3px 46px; margin: 0 4px; width: calc(100% - 8px); border: none; background: none; cursor: pointer; text-align: left; font: inherit; color: var(--grey-mid); border-radius: 2px; }
    .t-row.sel { background: var(--accent-soft); color: var(--brand); }
    .handle { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .empty { padding: 3px 6px 3px 46px; font-size: 11px; color: #aaa; font-style: italic; }
    .empty.pad { padding-left: 12px; }
  `],
})
export class ProjectTreePane {
  projects = input.required<Project[]>();
  scopedTasks = input.required<Task[]>();
  selectedProjectId = input<string | null>(null);
  selectedTaskId = input<string | null>(null);
  collapsed = input<boolean>(false);

  selectProject = output<string>();
  selectTask = output<{ projectId: string; taskId: string }>();
  expand = output<void>();
  collapse = output<void>();

  readonly STATUS = STATUS;
  readonly examById = examById;
  readonly userById = userById;

  private expanded = signal<Set<string>>(new Set());
  private expandedSamples = signal<Set<string>>(new Set());

  isOpen = (id: string) => this.expanded().has(id);
  isSampleOpen = (id: string) => this.expandedSamples().has(id);
  toggle(id: string): void { this.flip(this.expanded, id); }
  toggleSample(id: string): void { this.flip(this.expandedSamples, id); }
  private flip(sig: ReturnType<typeof signal<Set<string>>>, id: string): void {
    sig.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  tasksOf = (pid: string) => this.scopedTasks().filter(t => t.projectId === pid);
  sampleTasks = (pid: string, examId: string) => this.tasksOf(pid).filter(t => t.examId === examId);
}
