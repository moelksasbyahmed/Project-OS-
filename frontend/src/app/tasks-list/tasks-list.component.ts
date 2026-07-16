import {Component, inject, ChangeDetectionStrategy, computed} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {State} from '../state';

@Component({
  selector: 'app-tasks-list',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListComponent {
  state = inject(State);

  searchQuery = '';
  projectFilter = 'All';
  statusFilter = 'All';
  priorityFilter = 'All';

  filteredTasks = computed(() => {
    let tList = this.state.tasks();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      tList = tList.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }

    if (this.projectFilter !== 'All') {
      tList = tList.filter(t => t.projectId === this.projectFilter);
    }

    if (this.statusFilter !== 'All') {
      tList = tList.filter(t => t.status === this.statusFilter);
    }

    if (this.priorityFilter !== 'All') {
      tList = tList.filter(t => t.priority === this.priorityFilter);
    }

    return tList;
  });

  resetFilters() {
    this.searchQuery = '';
    this.projectFilter = 'All';
    this.statusFilter = 'All';
    this.priorityFilter = 'All';
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to permanently delete this task?')) {
      this.state.deleteTask(id).subscribe({
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to delete task.');
        }
      });
    }
  }
}
