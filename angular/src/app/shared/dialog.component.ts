import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  template: `
    @if (open()) {
      <div class="dialog-backdrop" (click)="close.emit()">
        <div class="dialog-panel" [style.width]="width()" (click)="$event.stopPropagation()">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(70, 70, 70, 0.8);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .dialog-panel {
      background: #fff; border-radius: 2px; max-width: 92vw; max-height: 90vh;
      overflow: auto; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }
  `],
})
export class Dialog {
  open = input.required<boolean>();
  width = input<string>('auto');
  close = output<void>();
}
