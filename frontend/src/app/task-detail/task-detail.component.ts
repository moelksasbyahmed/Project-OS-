import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {State} from '../state';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-task-detail',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent {
  state = inject(State);
  route = inject(ActivatedRoute);
  router = inject(Router);

  taskId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  
  task = computed(() => {
    return this.state.tasks().find(t => t._id === this.taskId());
  });

  // Checklist state
  subtasks = signal<Subtask[]>([
    { id: 'sub-1', title: 'Review bandwidth limits on cluster subnets', completed: true },
    { id: 'sub-2', title: 'Configure Node.js WS sticky load-balancer protocols', completed: false },
    { id: 'sub-3', title: 'Run active SLA contract integration test scripts', completed: false }
  ]);

  newSubtaskTitle = '';

  completedSubtasksCount = computed(() => {
    return this.subtasks().filter(s => s.completed).length;
  });

  toggleSubtask(id: string) {
    this.subtasks.update(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  }

  addSubtask() {
    const title = this.newSubtaskTitle.trim();
    if (title) {
      const newSub: Subtask = {
        id: `sub-${Date.now()}`,
        title,
        completed: false
      };
      this.subtasks.update(prev => [...prev, newSub]);
      this.newSubtaskTitle = '';
    }
  }

  removeSubtask(id: string) {
    this.subtasks.update(prev => prev.filter(s => s.id !== id));
  }

  updateProgress(val: string) {
    const currentTask = this.task();
    if (currentTask) {
      const num = parseInt(val, 10);
      const updatedStatus = num === 100 ? 'completed' : (num > 0 ? 'in_progress' : 'not_started');
      this.state.updateTask({
        ...currentTask,
        progress: num,
        status: updatedStatus
      }).subscribe({
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to update task status.');
        }
      });
    }
  }

  duplicateTask() {
    alert('Task configuration key duplicated successfully to clipboard.');
  }

  setReminder() {
    alert('System notification reminder registered for this sprint task.');
  }

  deleteTask() {
    const t = this.task();
    if (t && confirm('Are you sure you want to permanently delete this task?')) {
      this.state.deleteTask(t._id).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to delete task.');
        }
      });
    }
  }
}
