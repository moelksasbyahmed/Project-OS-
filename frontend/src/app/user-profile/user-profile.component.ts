import {Component, inject, ChangeDetectionStrategy, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {State} from '../state';

@Component({
  selector: 'app-user-profile',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  state = inject(State);
  fb = inject(FormBuilder);

  mfaEnabled = signal<boolean>(true);

  profileForm = this.fb.group({
    name: [this.state.profile()?.name || '', Validators.required],
    title: ['Specialist', Validators.required],
    email: [this.state.profile()?.email || '', [Validators.required, Validators.email]],
    phone: [this.state.profile()?.profile?.phone || '', Validators.required],
    github: [this.state.profile()?.profile?.github || ''],
    linkedin: [this.state.profile()?.profile?.linkedin || '']
  });

  toggleMfa() {
    this.mfaEnabled.update(prev => !prev);
  }

  onSubmit() {
    if (this.profileForm.valid) {
      const val = this.profileForm.value;
      this.state.updateProfile({
        name: val.name || '',
        phone: val.phone || '',
        github: val.github || '',
        linkedin: val.linkedin || ''
      }).subscribe({
        next: () => {
          alert('Personal details committed successfully. Workspace LDAPs synchronized.');
        },
        error: (err) => {
          alert(err.error?.message || err.message || 'Profile update failed.');
        }
      });
    }
  }
}
