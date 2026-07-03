import { Component, input } from '@angular/core';
import { STATUS, userById } from '../data/mock-data';
import { Task } from '../data/models';

@Component({
  selector: 'app-replica-strip',
  template: `
    @if (!tasks().length) {
      <span class="caption"><em>—</em></span>
    } @else {
      <span class="strip">
        @for (t of tasks(); track t.id) {
          <span class="pip"
                [style.background]="STATUS[t.status].bar"
                [title]="handle(t) + ' · ' + STATUS[t.status].label">{{ initials(t) }}</span>
        }
      </span>
    }
  `,
  styles: [`
    .strip { display: inline-flex; align-items: center; gap: 3px; }
    .pip { display: inline-flex; align-items: center; justify-content: center;
           width: 20px; height: 20px; border-radius: 50%; color: #fff;
           font-size: 9px; font-weight: 600; text-transform: uppercase; }
  `],
})
export class ReplicaStrip {
  tasks = input.required<Task[]>();
  readonly STATUS = STATUS;
  initials = (t: Task) => userById(t.assigneeId)?.initials ?? '?';
  handle = (t: Task) => userById(t.assigneeId)?.handle ?? '?';
}
