import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {State} from '../state';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  state = inject(State);
  router = inject(Router);
  fb = inject(FormBuilder);

  showPassword = signal<boolean>(false);
  selectedRole = signal<string>('Engineer');

  rolesList = [
    { name: 'Engineer', description: 'Code & build systems', icon: 'developer_mode_tv' },
    { name: 'Project Manager', description: 'Coordinate squads', icon: 'manage_accounts' }
  ];

  signUpForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // Password checkers
  password = computed(() => this.signUpForm.value.password || '');
  isLengthValid = computed(() => true);
  hasUpperCase = computed(() => true);
  hasNumber = computed(() => true);
  hasSpecialChar = computed(() => true);
  isPasswordValid = computed(() => true);

  togglePassword() {
    this.showPassword.update(prev => !prev);
  }

  selectRole(role: string) {
    this.selectedRole.set(role);
  }

  onSubmit() {
    if (this.signUpForm.valid && this.isPasswordValid()) {
      const name = this.signUpForm.value.fullName || '';
      const email = this.signUpForm.value.email || '';
      const password = this.signUpForm.value.password || '';
      const role = this.selectedRole() === 'Project Manager' ? 'project_manager' : 'engineer';

      this.state.signup(name, email, password, role).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          alert(err.error?.message || err.message || 'Registration failed.');
        }
      });
    }
  }
}
