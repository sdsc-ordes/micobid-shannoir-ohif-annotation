import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Masthead } from './masthead/masthead.component';
import { ReviewDrawer } from './overlays/review-drawer.component';
import { AnnotateModal } from './overlays/annotate-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Masthead, ReviewDrawer, AnnotateModal],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
