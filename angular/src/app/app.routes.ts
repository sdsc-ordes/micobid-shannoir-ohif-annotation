import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },
  { path: 'projects', loadComponent: () => import('./projects/projects-workspace.component').then(m => m.ProjectsWorkspace) },
  { path: 'annotations', loadComponent: () => import('./annotations/annotations.component').then(m => m.Annotations) },
  { path: 'templates', loadComponent: () => import('./templates/templates-view.component').then(m => m.TemplatesView) },
  { path: '**', redirectTo: 'projects' },
];
