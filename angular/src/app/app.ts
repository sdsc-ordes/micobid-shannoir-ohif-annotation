import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Masthead } from './masthead/masthead.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Masthead],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
