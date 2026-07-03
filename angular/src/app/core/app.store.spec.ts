import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AppStore } from './app.store';

describe('AppStore', () => {
  let s: AppStore;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    s = TestBed.inject(AppStore);
  });

  it('annotator baseTasks are only their own', () => {
    s.currentUserId.set('u2');
    expect(s.baseTasks().length).toBeGreaterThan(0);
    expect(s.baseTasks().every(t => t.assigneeId === 'u2')).toBe(true);
  });

  it('manager baseTasks include everyone', () => {
    s.currentUserId.set('u1');
    expect(s.baseTasks().length).toBe(s.tasks().length);
  });

  it('statusChange updates a task', () => {
    const id = s.tasks()[0].id;
    s.statusChange(id, 'accepted');
    expect(s.tasks().find(t => t.id === id)!.status).toBe('accepted');
  });

  it('saveWork bumps todo to in_progress and never auto-submits', () => {
    const todo = s.tasks().find(t => t.status === 'todo')!;
    s.saveWork(todo.id, { answers: { findings: 'x' } });
    const after = s.tasks().find(t => t.id === todo.id)!;
    expect(after.status).toBe('in_progress');
    expect(after.answers['findings']).toBe('x');
  });

  it('assignAll reassigns selected tasks and clears selection', () => {
    const ids = s.tasks().slice(0, 2).map(t => t.id);
    ids.forEach(i => s.select(i, true));
    s.assignAll('u3');
    expect(s.tasks().filter(t => ids.includes(t.id)).every(t => t.assigneeId === 'u3')).toBe(true);
    expect(s.selectedIds().length).toBe(0);
  });

  it('splitAcross round-robins selected tasks over the given users', () => {
    const ids = s.tasks().slice(0, 4).map(t => t.id);
    ids.forEach(i => s.select(i, true));
    s.splitAcross(['u2', 'u3']);
    const assigned = s.tasks().filter(t => ids.includes(t.id)).map(t => t.assigneeId);
    expect(assigned.filter(a => a === 'u2').length).toBe(2);
    expect(assigned.filter(a => a === 'u3').length).toBe(2);
  });

  it('filtered honors the status filter', () => {
    s.currentUserId.set('u1');
    s.setFilter({ status: 'accepted' });
    expect(s.filtered().every(t => t.status === 'accepted')).toBe(true);
  });

  it('saveProject creates tasks for each new member x sample', () => {
    s.currentUserId.set('u1');
    const before = s.tasks().length;
    const proj = s.projects().find(p => p.id === 'p-brain')!;
    // add a new member; reconcile should create tasks for that member x each sample
    s.saveProject({ ...proj, memberIds: [...proj.memberIds, 'u1'] });
    const created = s.tasks().filter(t => t.projectId === 'p-brain' && t.assigneeId === 'u1');
    expect(created.length).toBe(proj.sampleExamIds.length);
    expect(s.tasks().length).toBe(before + proj.sampleExamIds.length);
  });

  it('deleteProject removes the project and its tasks', () => {
    s.deleteProject('p-tumor');
    expect(s.projects().some(p => p.id === 'p-tumor')).toBe(false);
    expect(s.tasks().some(t => t.projectId === 'p-tumor')).toBe(false);
  });
});
