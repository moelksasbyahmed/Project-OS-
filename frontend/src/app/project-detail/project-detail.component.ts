import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {State} from '../state';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  state = inject(State);
  route = inject(ActivatedRoute);
  router = inject(Router);

  showAlert = signal<boolean>(true);

  projectId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  
  project = computed(() => {
    const id = this.projectId();
    return this.state.projects().find(p => p._id === id);
  });

  projectMembers = computed(() => {
    const p = this.project();
    if (!p || !p.teamMembers) return [];
    return p.teamMembers.map((m: any) => {
      return {
        id: m._id || m,
        name: m.name || 'Specialist',
        roleName: 'Software Engineer',
        avatar: '',
        permissionRole: 'Editor',
        activeTasks: 1,
        progress: 60
      };
    });
  });

  projectTasks = computed(() => {
    const id = this.projectId();
    return this.state.tasks().filter(t => t.projectId === id);
  });

  activeTasksCount = computed(() => {
    return this.projectTasks().filter(t => t.status === 'in_progress').length;
  });

  dismissAlert() {
    this.showAlert.set(false);
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.state.deleteTask(id).subscribe({
        error: (err) => alert(err.error?.message || err.message || 'Failed to delete task.')
      });
    }
  }

  removeMember(id: string) {
    if (confirm('Are you sure you want to remove this member from the project subscription?')) {
      this.state.removeMember(this.projectId(), id).subscribe({
        error: (err) => alert(err.error?.message || err.message || 'Failed to remove member.')
      });
    }
  }
}
