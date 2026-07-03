import { Component, computed, inject } from '@angular/core';
import { AppStore } from '../core/app.store';
import { STATUS, STATUS_ORDER, USERS } from '../data/mock-data';
import { StatusId } from '../data/models';
import { Avatar } from '../shared/avatar.component';

@Component({
  selector: 'app-annotations-sidebar',
  imports: [Avatar],
  template: `
    <aside class="sidebar">
      <div class="rail-section">
        <div class="label sec">Scope</div>
        <button class="rail-item" [class.active]="!filters().mineOnly" (click)="store.setFilter({ mineOnly: false })">
          <span class="lbl">All annotations</span><span class="count">{{ tasks().length }}</span>
        </button>
        @if (!isManager()) {
          <button class="rail-item" [class.active]="filters().mineOnly" (click)="store.setFilter({ mineOnly: true })">
            <span class="lbl">My queue</span><span class="count">{{ myTasks().length }}</span>
          </button>
        }
      </div>

      <div class="rail-section">
        <div class="label sec">Project</div>
        @for (p of store.projects(); track p.id) {
          @if (countProject(p.id) > 0 || isManager()) {
            <button class="rail-item" [class.active]="filters().project === p.id" (click)="toggle('project', p.id)">
              <span class="lbl"><span class="mark-dot" [style.background]="p.color"></span><span class="truncate">{{ p.name }}</span></span>
              <span class="count">{{ countProject(p.id) }}</span>
            </button>
          }
        }
      </div>

      <div class="rail-section">
        <div class="label sec">Status</div>
        @for (s of STATUS_ORDER; track s) {
          <button class="rail-item" [class.active]="filters().status === s" (click)="toggle('status', s)">
            <span class="lbl"><span class="mark-dot" [style.background]="STATUS[s].bar"></span>{{ STATUS[s].label }}</span>
            <span class="count">{{ countStatus(s) }}</span>
          </button>
        }
      </div>

      @if (isManager()) {
        <div class="rail-section">
          <div class="label sec">Annotator</div>
          @for (u of annotators; track u.id) {
            <button class="rail-item" [class.active]="filters().assignee === u.id" (click)="toggle('assignee', u.id)">
              <span class="lbl"><app-avatar [user]="u" size="sm" /><span class="truncate">{{ u.handle }}</span></span>
              <span class="count">{{ countAssignee(u.id) }}</span>
            </button>
          }
        </div>
      }

      <div class="footer caption">v0.6 · CIBM<br /><span class="muted">Mock data — no PHI</span></div>
    </aside>
  `,
  styles: [`
    .sidebar { width: 232px; flex-shrink: 0; background: #fff; border-right: 1px solid var(--grey-border);
               padding: 14px 10px; overflow-y: auto; }
    .sec { padding: 0 8px; margin-bottom: 8px; display: block; }
    .rail-item .lbl { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px; }
    .footer { padding: 8px; margin-top: 8px; line-height: 1.5; }
    .muted { color: #aaa; }
  `],
})
export class AnnotationsSidebar {
  store = inject(AppStore);
  readonly STATUS = STATUS;
  readonly STATUS_ORDER = STATUS_ORDER;
  readonly annotators = USERS.filter(u => u.role === 'annotator');

  tasks = computed(() => this.store.baseTasks());
  filters = computed(() => this.store.filters());
  isManager = computed(() => this.store.currentUser().role === 'manager');
  myTasks = computed(() => this.tasks().filter(t => t.assigneeId === this.store.currentUser().id));

  countProject = (id: string) => this.tasks().filter(t => t.projectId === id).length;
  countStatus = (s: StatusId) => this.tasks().filter(t => t.status === s).length;
  countAssignee = (id: string) => this.tasks().filter(t => t.assigneeId === id).length;

  toggle(key: 'project' | 'status' | 'assignee', value: string): void {
    const cur = this.store.filters()[key];
    this.store.setFilter({ [key]: cur === value ? null : value });
  }
}
