import { Component, computed, effect, inject, signal } from '@angular/core';
import { AppStore } from '../core/app.store';
import { Project, Task } from '../data/models';
import { ProjectTreePane } from './project-tree-pane.component';
import { ProjectBrowser } from './project-browser.component';
import { ProjectTaskList } from './project-task-list.component';
import { ProjectPreview } from './project-preview.component';
import { ProjectEditor } from './project-editor.component';

@Component({
  selector: 'app-projects-workspace',
  imports: [ProjectTreePane, ProjectBrowser, ProjectTaskList, ProjectPreview, ProjectEditor],
  template: `
    <app-project-tree-pane
      [projects]="visible()"
      [scopedTasks]="scopedTasks()"
      [selectedProjectId]="selectedProjectId()"
      [selectedTaskId]="selectedTaskId()"
      [collapsed]="treeCollapsed()"
      (selectProject)="selectProject($event)"
      (selectTask)="selectTaskFromTree($event)"
      (expand)="treePinned.set(true)" />

    <app-project-browser
      [projects]="visible()"
      [scopedTasks]="scopedTasks()"
      [selectedProjectId]="selectedProjectId()"
      [isManager]="isManager()"
      [collapsed]="browserCollapsed()"
      (select)="selectProject($event)"
      (newProject)="openNew()"
      (expand)="browserPinned.set(true)" />

    <app-project-task-list
      [project]="project()"
      [tasks]="projectTasks()"
      [selectedTaskId]="selectedTaskId()"
      [isManager]="isManager()"
      (selectTask)="selectTaskInProject($event)"
      (edit)="openEdit($event)" />

    <app-project-preview
      [project]="project()"
      [template]="template()"
      [task]="selectedTask()"
      (openEditor)="store.openAnnotate($event)"
      (close)="selectedTaskId.set(null)" />

    <app-project-editor
      [open]="editing() !== null || isNew()"
      [project]="editing()"
      [isNew]="isNew()"
      [canDelete]="isManager()"
      (save)="store.saveProject($event)"
      (remove)="store.deleteProject($event)"
      (close)="closeEditor()" />
  `,
  styles: [`:host { display: flex; flex: 1; min-height: 0; }`],
})
export class ProjectsWorkspace {
  store = inject(AppStore);

  selectedProjectId = signal<string | null>(null);
  selectedTaskId = signal<string | null>(null);
  editing = signal<Project | null>(null);
  isNew = signal<boolean>(false);
  treePinned = signal<boolean>(false);
  browserPinned = signal<boolean>(false);

  isManager = computed(() => this.store.currentUser().role === 'manager');

  visible = computed<Project[]>(() => {
    const u = this.store.currentUser();
    return u.role === 'manager'
      ? this.store.projects()
      : this.store.projects().filter(p => p.memberIds.includes(u.id));
  });

  scopedTasks = computed<Task[]>(() => {
    const u = this.store.currentUser();
    return this.store.tasks().filter(t => u.role === 'manager' || t.assigneeId === u.id);
  });

  project = computed<Project | null>(() =>
    this.visible().find(p => p.id === this.selectedProjectId()) ?? null);

  projectTasks = computed<Task[]>(() => {
    const p = this.project();
    return p ? this.scopedTasks().filter(t => t.projectId === p.id) : [];
  });

  selectedTask = computed<Task | null>(() => {
    const id = this.selectedTaskId();
    return id ? this.store.tasks().find(t => t.id === id) ?? null : null;
  });

  template = computed(() => {
    const p = this.project();
    return p?.type === 'segmentation' && p.templateId ? this.store.templatesById()[p.templateId] ?? null : null;
  });

  treeCollapsed = computed(() => !!this.selectedProjectId() && !this.treePinned());
  browserCollapsed = computed(() => !!this.selectedTask() && !this.browserPinned());

  constructor() {
    // keep selection valid as visible projects change (role switch, deletion)
    effect(() => {
      const vis = this.visible();
      const sel = this.selectedProjectId();
      if (!vis.find(p => p.id === sel)) {
        this.selectedProjectId.set(vis[0]?.id ?? null);
        this.selectedTaskId.set(null);
      }
    });
  }

  selectProject(id: string): void {
    this.selectedProjectId.set(id); this.selectedTaskId.set(null); this.treePinned.set(false);
  }
  selectTaskInProject(taskId: string): void {
    this.selectedTaskId.set(taskId); this.browserPinned.set(false);
  }
  selectTaskFromTree(ev: { projectId: string; taskId: string }): void {
    this.selectedProjectId.set(ev.projectId); this.selectedTaskId.set(ev.taskId);
    this.treePinned.set(false); this.browserPinned.set(false);
  }
  openNew(): void { this.editing.set(null); this.isNew.set(true); }
  openEdit(p: Project): void { this.editing.set(p); this.isNew.set(false); }
  closeEditor(): void { this.editing.set(null); this.isNew.set(false); }
}
