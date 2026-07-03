import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppStore } from '../core/app.store';
import { USERS } from '../data/mock-data';
import { Avatar } from '../shared/avatar.component';

@Component({
  selector: 'app-masthead',
  imports: [RouterLink, RouterLinkActive, Avatar],
  template: `
    <header class="masthead">
      <div class="brand">
        <div class="logo">M</div>
        <h1 class="title">MicoBID / Shanoir Annotation Panel</h1>
      </div>

      <nav class="nav">
        <a routerLink="/projects" routerLinkActive="active" class="tab">Projects</a>
        <a routerLink="/annotations" routerLinkActive="active" class="tab">Annotations</a>
        <a routerLink="/templates" routerLinkActive="active" class="tab">Templates</a>
      </nav>

      <div class="spacer"></div>

      <div class="user">
        <span class="caption signed">Signed in as</span>
        <select class="field field-sm select" [value]="store.currentUserId()" (change)="onUserChange($event)">
          @for (u of USERS; track u.id) {
            <option [value]="u.id">{{ u.handle }} — {{ u.role }}</option>
          }
        </select>
        <app-avatar [user]="store.currentUser()" />
      </div>
    </header>
  `,
  styles: [`
    .masthead {
      height: 48px; display: flex; align-items: center; gap: 24px;
      padding: 0 18px; background: var(--brand); border-bottom: 1px solid var(--brand-light);
      flex-shrink: 0;
    }
    .brand { display: flex; align-items: center; gap: 9px; }
    .logo {
      width: 26px; height: 26px; border-radius: 3px; background: #fff;
      color: var(--brand); display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px;
    }
    .title { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; }
    .nav { display: flex; align-items: center; gap: 2px; height: 100%; }
    .tab {
      display: inline-flex; align-items: center; height: 100%; padding: 0 12px;
      font-size: 13px; font-weight: 600; color: rgba(255,255,255,.72); text-decoration: none;
      border-bottom: 2px solid transparent;
    }
    .tab:hover { color: #fff; }
    .tab.active { color: #fff; border-bottom-color: #fff; }
    .spacer { flex: 1; }
    .user { display: flex; align-items: center; gap: 8px; }
    .signed { white-space: nowrap; color: rgba(255,255,255,.85); }
    .user .select {
      min-width: 168px; color: #fff;
      background-color: rgba(255,255,255,.14); border-color: rgba(255,255,255,.4);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/%3E%3C/svg%3E");
    }
    .user .select option { color: var(--grey-dark); }
  `],
})
export class Masthead {
  store = inject(AppStore);
  readonly USERS = USERS;
  onUserChange(e: Event): void {
    this.store.currentUserId.set((e.target as HTMLSelectElement).value);
  }
}
