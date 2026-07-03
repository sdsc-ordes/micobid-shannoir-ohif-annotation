import { Component, input, output, signal } from '@angular/core';
import { isDone, userById } from '../data/mock-data';
import { Project, Task } from '../data/models';
import { MiniBar } from '../shared/mini-bar.component';
import { Avatar } from '../shared/avatar.component';

@Component({
  selector: 'app-project-browser',
  imports: [MiniBar, Avatar],
  template: `
    @if (collapsed()) {
      <div class="rail">
        <button class="ico" title="Expand projects" (click)="expand.emit()">▦</button>
        <div class="sep"></div>
        @for (p of projects(); track p.id) {
          <button class="chip" [class.on]="p.id === selectedProjectId()" [style.background]="p.color"
                  [title]="p.name + ' · ' + pct(p.id) + '%'" (click)="select.emit(p.id)">
            {{ p.type === 'text' ? 'TXT' : 'SEG' }}
            <span class="badge num">{{ pct(p.id) }}</span>
          </button>
        }
      </div>
    } @else {
      <div class="pane">
        <div class="head">
          <span class="label">Projects · {{ projects().length }}</span>
          <div class="head-right">
            <div class="modes">
              <button class="mbtn" [class.on]="mode() === 'card'" (click)="mode.set('card')" title="Cards">▦</button>
              <button class="mbtn" [class.on]="mode() === 'list'" (click)="mode.set('list')" title="List">≣</button>
            </div>
            @if (canCollapse()) {
              <button class="collapse" title="Collapse projects" (click)="collapse.emit()">‹</button>
            }
          </div>
        </div>

        @if (isManager()) {
          <div class="new-wrap"><button class="btn btn-sm btn-primary full" (click)="newProject.emit()">+ New project</button></div>
        }

        <div class="list">
          @for (p of projects(); track p.id) {
            @if (mode() === 'list') {
              <button class="litem" [class.sel]="p.id === selectedProjectId()" (click)="select.emit(p.id)">
                <div class="litem-top">
                  <span class="sw" [style.background]="p.color"></span>
                  <span class="name">{{ p.name }}</span>
                  <span class="pctv num">{{ pct(p.id) }}%</span>
                </div>
                <div class="litem-bar"><app-mini-bar [tasks]="tasksOf(p.id)" /><span class="caption num">{{ tasksOf(p.id).length }}</span></div>
              </button>
            } @else {
              <button class="citem" [class.sel]="p.id === selectedProjectId()" (click)="select.emit(p.id)">
                <div class="citem-top">
                  <div class="cico" [style.background]="p.color"><span>{{ p.type === 'text' ? 'TXT' : 'SEG' }}</span></div>
                  <div class="cmeta">
                    <div class="name">{{ p.name }}</div>
                    <div class="caption">{{ p.sampleExamIds.length }} samples · {{ p.memberIds.length }} annotators</div>
                  </div>
                </div>
                <div class="citem-bar"><app-mini-bar [tasks]="tasksOf(p.id)" /><span class="pctv num">{{ pct(p.id) }}%</span></div>
                <div class="members">
                  @for (id of p.memberIds; track id) { <app-avatar [user]="userById(id)" size="sm" /> }
                </div>
              </button>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .rail { width: 54px; flex-shrink: 0; background: var(--bg-alt); border-right: 1px solid var(--grey-border); display: flex; flex-direction: column; align-items: center; padding: 10px 0; gap: 8px; overflow-y: auto; }
    .ico { background: none; border: none; cursor: pointer; color: var(--grey-mid); width: 28px; height: 28px; }
    .sep { width: 28px; border-top: 1px solid var(--grey-border); }
    .chip { position: relative; width: 38px; height: 38px; border-radius: 6px; border: none; color: #fff; font-size: 9px; font-weight: 700; cursor: pointer; }
    .chip.on { outline: 2px solid var(--brand); outline-offset: 1px; }
    .chip .badge { position: absolute; bottom: -3px; right: -3px; font-size: 8px; font-weight: 600; color: var(--grey-dark); background: #fff; border: 1px solid var(--grey-border); border-radius: 8px; padding: 0 3px; }

    .pane { width: 276px; flex-shrink: 0; background: var(--bg-alt); border-right: 1px solid var(--grey-border); display: flex; flex-direction: column; }
    .head { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-bottom: 1px solid var(--grey-border); background: #fff; }
    .head-right { display: flex; align-items: center; gap: 6px; }
    .collapse { background: none; border: none; cursor: pointer; color: var(--grey-mid); font-size: 15px; line-height: 1; width: 22px; height: 22px; border-radius: 3px; }
    .collapse:hover { background: var(--bg-panel); color: var(--brand); }
    .modes { display: flex; border: 1px solid var(--grey-border); border-radius: 2px; overflow: hidden; }
    .mbtn { padding: 2px 7px; border: none; background: #fff; color: var(--grey-mid); cursor: pointer; }
    .mbtn.on { background: var(--btn); color: #fff; }
    .mbtn + .mbtn { border-left: 1px solid var(--grey-border); }
    .new-wrap { padding: 8px 12px; border-bottom: 1px solid var(--grey-border); background: #fff; }
    .full { width: 100%; justify-content: center; }
    .list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
    .name { font-size: 13px; font-weight: 600; color: var(--grey-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sw { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
    .pctv { font-size: 11px; font-weight: 700; color: var(--brand); }

    .litem, .citem { text-align: left; background: #fff; border: 1px solid var(--grey-border); border-radius: 2px; padding: 10px; cursor: pointer; font: inherit; }
    .litem.sel, .citem.sel { border-color: var(--brand); background: var(--accent-soft); }
    .litem-top { display: flex; align-items: center; gap: 8px; }
    .litem-top .name { flex: 1; }
    .litem-bar { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .litem-bar app-mini-bar { flex: 1; }

    .citem-top { display: flex; align-items: flex-start; gap: 10px; }
    .cico { width: 32px; height: 32px; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; font-weight: 700; }
    .cmeta { min-width: 0; flex: 1; }
    .citem-bar { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
    .citem-bar app-mini-bar { flex: 1; }
    .members { display: flex; margin-top: 8px; }
    .members app-avatar { margin-right: -6px; }
  `],
})
export class ProjectBrowser {
  projects = input.required<Project[]>();
  scopedTasks = input.required<Task[]>();
  selectedProjectId = input<string | null>(null);
  isManager = input<boolean>(false);
  collapsed = input<boolean>(false);
  canCollapse = input<boolean>(false);

  select = output<string>();
  newProject = output<void>();
  expand = output<void>();
  collapse = output<void>();

  mode = signal<'card' | 'list'>('card');
  readonly userById = userById;

  tasksOf = (pid: string) => this.scopedTasks().filter(t => t.projectId === pid);
  pct = (pid: string) => {
    const ts = this.tasksOf(pid);
    return ts.length ? Math.round(ts.filter(t => isDone(t.status)).length / ts.length * 100) : 0;
  };
}
