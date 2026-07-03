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
      padding: 0 18px; background: #fff; border-bottom: 1px solid var(--grey-border);
      flex-shrink: 0;
    }
    .brand { display: flex; align-items: center; gap: 9px; }
    .logo {
      width: 26px; height: 26px; border-radius: 3px; background: var(--brand);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px;
    }
    .title { font-size: 14px; font-weight: 700; color: var(--grey-dark); white-space: nowrap; }
    .nav { display: flex; align-items: center; gap: 2px; height: 100%; }
    .tab {
      display: inline-flex; align-items: center; height: 100%; padding: 0 12px;
      font-size: 13px; font-weight: 600; color: var(--grey-mid); text-decoration: none;
      border-bottom: 2px solid transparent;
    }
    .tab:hover { color: var(--grey-dark); }
    .tab.active { color: var(--brand); border-bottom-color: var(--brand); }
    .spacer { flex: 1; }
    .user { display: flex; align-items: center; gap: 8px; }
    .signed { white-space: nowrap; }
    .user .select { min-width: 168px; }
  `],
})
export class Masthead {
  store = inject(AppStore);
  readonly USERS = USERS;
  onUserChange(e: Event): void {
    this.store.currentUserId.set((e.target as HTMLSelectElement).value);
  }
}
