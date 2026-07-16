import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {RouterOutlet, RouterLink, RouterLinkActive, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {State} from '../state';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  state = inject(State);
  router = inject(Router);

  logout() {
    this.state.logout();
    this.router.navigate(['/login']);
  }
}
