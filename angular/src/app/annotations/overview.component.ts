import { Component, computed, input } from '@angular/core';
import { STATUS, STATUS_ORDER, isDone } from '../data/mock-data';
import { StatusId, Task } from '../data/models';

@Component({
  selector: 'app-overview',
  template: `
    <div class="card">
      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Accepted</div>
          <div class="row">
            <span class="metric-value" style="color: var(--brand)">{{ pct() }}%</span>
            <span class="caption num">{{ accepted() }}/{{ total() }}</span>
          </div>
        </div>
        <div class="metric">
          <div class="metric-label">Submitted</div>
          <div class="row"><span class="metric-value">{{ counts()['submitted'] }}</span><span class="caption">awaiting review</span></div>
        </div>
        <div class="metric">
          <div class="metric-label">In progress</div>
          <div class="row"><span class="metric-value">{{ counts()['in_progress'] }}</span><span class="caption">active</span></div>
        </div>
        <div class="metric">
          <div class="metric-label">Revisions</div>
          <div class="row"><span class="metric-value">{{ counts()['revisions'] }}</span><span class="caption">returned</span></div>
        </div>
        <div class="metric">
          <div class="metric-label">To do</div>
          <div class="row"><span class="metric-value">{{ counts()['todo'] }}</span><span class="caption num">{{ subjects() }} subj · {{ unassignedExams() }} unassigned</span></div>
        </div>
      </div>

      <div class="density-wrap">
        <div class="density-row">
          @for (t of sorted(); track t.id) {
            <div class="density-cell" [style.background]="STATUS[t.status].bar" [title]="'#' + t.examId + ' · ' + STATUS[t.status].label"></div>
          }
        </div>
        <div class="legend">
          <div class="keys">
            @for (s of STATUS_ORDER; track s) {
              <span class="key"><span class="sw" [style.background]="STATUS[s].bar"></span>{{ STATUS[s].label }}</span>
            }
          </div>
          <span class="caption">1 cell ≈ 1 task</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics { display: flex; }
    .metric { flex: 1; }
    .row { display: flex; align-items: baseline; gap: 6px; }
    .density-wrap { padding: 4px 14px 12px; }
    .density-row { height: 8px; display: flex; border: 1px solid var(--grey-border); background: #fff; border-radius: 2px; overflow: hidden; }
    .legend { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
    .keys { display: flex; gap: 12px; }
    .key { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--grey-mid); }
    .sw { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  `],
})
export class Overview {
  tasks = input.required<Task[]>();
  totalExams = input.required<number>();
  readonly STATUS = STATUS;
  readonly STATUS_ORDER = STATUS_ORDER;

  total = computed(() => this.tasks().length);
  counts = computed<Record<StatusId, number>>(() =>
    STATUS_ORDER.reduce((acc, s) => {
      acc[s] = this.tasks().filter(t => t.status === s).length;
      return acc;
    }, {} as Record<StatusId, number>));
  accepted = computed(() => this.tasks().filter(t => isDone(t.status)).length);
  pct = computed(() => this.total() ? Math.round((this.accepted() / this.total()) * 100) : 0);
  subjects = computed(() => new Set(this.tasks().map(t => t.subjectId)).size);
  unassignedExams = computed(() => this.totalExams() - new Set(this.tasks().map(t => t.examId)).size);
  sorted = computed(() =>
    [...this.tasks()].sort((a, b) => STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status)));
}
