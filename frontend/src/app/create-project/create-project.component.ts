import {Component, inject, ChangeDetectionStrategy, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {State} from '../state';

export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  if (start && end && new Date(end) < new Date(start)) {
    return { dateRangeInvalid: true };
  }
  return null;
};

@Component({
  selector: 'app-create-project',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectComponent {
  state = inject(State);
  fb = inject(FormBuilder);
  router = inject(Router);

  selectedTeam = signal<string[]>([]);

  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(15)]],
    securityLevel: ['Internal Only', Validators.required],
    startDate: ['2026-07-15'],
    endDate: ['2026-12-31']
  }, { validators: dateRangeValidator });

  addTeamChip(id: string) {
    if (id && !this.selectedTeam().includes(id)) {
      this.selectedTeam.update(prev => [...prev, id]);
    }
  }

  removeTeamChip(id: string) {
    this.selectedTeam.update(prev => prev.filter(c => c !== id));
  }

  getEngineerName(id: string): string {
    const eng = this.state.engineers().find(e => e.id === id);
    return eng ? eng.name : 'Unknown Specialist';
  }

  onSubmit() {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      
      this.state.addProject({
        name: formValue.name || '',
        description: formValue.description || '',
        teamMembers: this.selectedTeam(),
        startDate: formValue.startDate || undefined,
        endDate: formValue.endDate || undefined,
        status: 'not_started',
        priority: 'medium'
      }).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to deploy project.');
        }
      });
    }
  }
}
