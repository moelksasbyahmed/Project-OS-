import {Component, inject, ChangeDetectionStrategy, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {State} from '../state';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  state = inject(State);
  router = inject(Router);
  fb = inject(FormBuilder);

  showPassword = signal<boolean>(false);

  loginForm = this.fb.group({
    email: ['alex.rivera@projectos.com', [Validators.required, Validators.email]],
    password: ['AdminSecure2026!', [Validators.required, Validators.minLength(8)]]
  });

  togglePassword() {
    this.showPassword.update(prev => !prev);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.value.email || '';
      const password = this.loginForm.value.password || '';
      this.state.login(email, password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          alert(err.error?.message || err.message || 'Login failed.');
        }
      });
    }
  }

  ssoLogin(provider: string) {
    if (provider) {
      console.log('Logging in via:', provider);
    }
    this.state.login('alex.rivera@projectos.com').subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'SSO Login failed.');
      }
    });
  }
}
