import { Component, computed, inject } from '@angular/core';
import { AppStore } from '../core/app.store';
import { EXAMINATIONS } from '../data/mock-data';
import { AnnotationsSidebar } from './annotations-sidebar.component';
import { Overview } from './overview.component';
import { BulkActionBar } from './bulk-action-bar.component';
import { TaskTable } from './task-table.component';

@Component({
  selector: 'app-annotations',
  imports: [AnnotationsSidebar, Overview, BulkActionBar, TaskTable],
  template: `
    <app-annotations-sidebar />
    <main class="content">
      <div class="head">
        <div>
          <h2>Annotations</h2>
          <div class="caption sub">
            {{ store.filtered().length }} task{{ store.filtered().length !== 1 ? 's' : '' }} visible{{ isFiltered() ? ' · filtered' : '' }}
          </div>
        </div>
        <input type="search" class="field search" [value]="store.filters().search"
               (input)="onSearch($event)" placeholder="Search exam, subject…" />
      </div>

      <app-overview [tasks]="store.baseTasks()" [totalExams]="totalExams" />

      @if (isManager()) { <app-bulk-action-bar /> }

      <app-task-table />
    </main>
  `,
  styles: [`
    :host { display: flex; flex: 1; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; padding: 18px 22px; display: flex; flex-direction: column; gap: 18px; }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    h2 { font-size: 18px; font-weight: 700; color: var(--grey-dark); }
    .sub { margin-top: 2px; }
    .search { width: 240px; }
  `],
})
export class Annotations {
  store = inject(AppStore);
  readonly totalExams = EXAMINATIONS.length;
  isManager = computed(() => this.store.currentUser().role === 'manager');
  isFiltered = computed(() => {
    const f = this.store.filters();
    return !!(f.status || f.assignee || f.project);
  });
  onSearch(e: Event): void { this.store.setFilter({ search: (e.target as HTMLInputElement).value }); }
}
