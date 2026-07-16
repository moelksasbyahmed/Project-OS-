import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {State} from '../state';

@Component({
  selector: 'app-projects-list',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListComponent {
  state = inject(State);

  searchQuery = '';
  statusFilter = 'All';
  priorityFilter = 'All';
  viewMode = signal<'grid' | 'list'>('grid');

  filteredProjects = computed(() => {
    let projs = this.state.projects();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      projs = projs.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    if (this.statusFilter !== 'All') {
      projs = projs.filter(p => p.status === this.statusFilter);
    }

    if (this.priorityFilter !== 'All') {
      projs = projs.filter(p => p.priority === this.priorityFilter);
    }

    return projs;
  });

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = 'All';
    this.priorityFilter = 'All';
  }

  deleteProject(id: string) {
    if (confirm('Are you sure you want to delete this project portfolio and all its contents?')) {
      this.state.deleteProject(id).subscribe({
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to delete project.');
        }
      });
    }
  }
}
