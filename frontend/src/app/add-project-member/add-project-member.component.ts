import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {State} from '../state';

interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  currentAllocation: number; // percentage
  rating: number; // out of 5
  role: 'Project Manager' | 'Editor' | 'Viewer';
  title: string;
}

@Component({
  selector: 'app-add-project-member',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './add-project-member.component.html',
  styleUrl: './add-project-member.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProjectMemberComponent {
  state = inject(State);
  route = inject(ActivatedRoute);
  router = inject(Router);

  searchQuery = '';
  deptFilter = 'All';

  projectId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  
  project = computed(() => {
    return this.state.projects().find(p => p._id === this.projectId());
  });

  // Dynamically derive candidates from the engineers squad
  candidates = computed<Candidate[]>(() => {
    return this.state.engineers().map(e => ({
      id: e.id,
      name: e.name,
      department: 'Engineering',
      currentAllocation: 80,
      rating: 4.8,
      role: 'Editor',
      title: e.role || 'Software Specialist'
    }));
  });

  selectedCandidates = signal<Candidate[]>([]);

  filteredCandidates = computed(() => {
    let list = this.candidates();

    // Do not show candidates who are already active project members
    const activeMemberIds = (this.project()?.teamMembers || []).map((m: any) => (m._id || m).toString());
    list = list.filter(c => !activeMemberIds.includes(c.id.toString()));

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
    }

    if (this.deptFilter !== 'All') {
      list = list.filter(c => c.department === this.deptFilter);
    }

    return list;
  });

  isCandidateSelected(id: string) {
    return this.selectedCandidates().some(c => c.id === id);
  }

  selectCandidate(candidate: Candidate) {
    if (!this.isCandidateSelected(candidate.id)) {
      this.selectedCandidates.update(prev => [...prev, { ...candidate }]);
    }
  }

  deselectCandidate(id: string) {
    this.selectedCandidates.update(prev => prev.filter(c => c.id !== id));
  }

  updateRole(id: string, role: 'Project Manager' | 'Editor' | 'Viewer') {
    this.selectedCandidates.update(prev => prev.map(c => c.id === id ? { ...c, role } : c));
  }

  confirmAllocation() {
    // Add all selected candidates to project team members in backend
    this.selectedCandidates().forEach(sc => {
      this.state.addMember(this.projectId(), sc.id).subscribe({
        error: (err) => {
          alert(err.error?.message || err.message || 'Failed to add member.');
        }
      });
    });

    // Redirect back to project details
    this.router.navigate(['/projects', this.projectId()]);
  }
}
