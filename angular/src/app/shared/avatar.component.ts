import { Component, computed, input } from '@angular/core';
import { User } from '../data/models';

@Component({
  selector: 'app-avatar',
  template: `<span [class]="classes()" [title]="user()?.handle ?? ''">{{ user()?.initials ?? '?' }}</span>`,
})
export class Avatar {
  user = input<User | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');

  classes = computed(() => {
    const u = this.user();
    const sizeClass = this.size() === 'sm' ? ' avatar-sm' : this.size() === 'lg' ? ' avatar-lg' : '';
    const tone = u ? ` avatar-${u.tone}` : '';
    return `avatar${sizeClass}${tone}`;
  });
}
