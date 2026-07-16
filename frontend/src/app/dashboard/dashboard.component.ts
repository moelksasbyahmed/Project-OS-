import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {RouterLink, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {State} from '../state';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  state = inject(State);
  fb = inject(FormBuilder);
  router = inject(Router);

  showQuickTaskPanel = signal<boolean>(false);

  quickTaskForm = this.fb.group({
    title: ['', Validators.required],
    assignee: ['Sarah Chen', Validators.required]
  });

  teamAvailability = computed(() => {
    const activeEngs = this.state.engineers().filter(e => e.active).length;
    const totalEngs = this.state.engineers().length;
    return totalEngs > 0 ? Math.round((activeEngs / totalEngs) * 100) : 0;
  });

  oooCount = computed(() => {
    return this.state.engineers().filter(e => !e.active).length;
  });

  avgProjectProgress = computed(() => {
    const projs = this.state.projects();
    if (projs.length === 0) return 0;
    const sum = projs.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(sum / projs.length);
  });

  toggleQuickTask() {
    this.showQuickTaskPanel.update(prev => !prev);
  }

  submitQuickTask() {
    if (this.quickTaskForm.valid) {
      const formValue = this.quickTaskForm.value;
      const title = formValue.title || '';
      const assigneeName = formValue.assignee || 'Sarah Chen';

      // Load a random project to attach the task to
      const randomProject = this.state.projects()[0];

      this.state.addTask({
        title,
        description: `Quickly deployed dashboard task for ${assigneeName}.`,
        projectId: randomProject?._id || '',
        projectName: randomProject?.name || 'Nexus Cloud Integration',
        status: 'in_progress',
        priority: 'high',
        assignee: assigneeName,
        dueDate: '2026-07-31',
        estimateHours: 8,
        sprint: 'Sprint 14',
        progress: 0
      }).subscribe({
        next: () => {
          this.quickTaskForm.reset({
            title: '',
            assignee: 'Sarah Chen'
          });
          this.showQuickTaskPanel.set(false);
        },
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to add task.');
        }
      });
    }
  }

  deleteProject(id: string) {
    if (confirm('Are you sure you want to delete this project? This will also remove associated tasks.')) {
      this.state.deleteProject(id).subscribe({
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to delete project.');
        }
      });
    }
  }
}
