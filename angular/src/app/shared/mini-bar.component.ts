import { Component, computed, input } from '@angular/core';
import { STATUS, STATUS_ORDER } from '../data/mock-data';
import { Task } from '../data/models';

@Component({
  selector: 'app-mini-bar',
  template: `
    @if (!tasks().length) {
      <div class="mini-bar empty"></div>
    } @else {
      <div class="mini-bar">
        @for (t of sorted(); track t.id) {
          <span class="seg" [style.background]="STATUS[t.status].bar" [title]="STATUS[t.status].label"></span>
        }
      </div>
    }
  `,
  styles: [`
    .mini-bar { height: 6px; display: flex; border-radius: 2px; overflow: hidden; background: #eee; }
    .mini-bar.empty { background: #eee; }
    .seg { flex: 1 1 0; }
  `],
})
export class MiniBar {
  tasks = input.required<Task[]>();
  readonly STATUS = STATUS;
  sorted = computed(() =>
    [...this.tasks()].sort((a, b) => STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status)));
}
