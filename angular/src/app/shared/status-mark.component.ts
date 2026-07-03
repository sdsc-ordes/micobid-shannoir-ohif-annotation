import { Component, computed, input } from '@angular/core';
import { STATUS } from '../data/mock-data';
import { StatusId } from '../data/models';

@Component({
  selector: 'app-status-mark',
  template: `<span class="mark"><span class="mark-dot" [style.background]="meta().bar"></span><span>{{ meta().label }}</span></span>`,
})
export class StatusMark {
  status = input.required<StatusId>();
  meta = computed(() => STATUS[this.status()]);
}
