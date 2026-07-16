import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {State} from '../state';

@Component({
  selector: 'app-team-settings',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './team-settings.component.html',
  styleUrl: './team-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSettingsComponent {
  state = inject(State);

  selectedEngineerIds = signal<string[]>([]);
  bulkProjectSelected = '';

  pipeline = signal([
    { title: 'Senior Frontend Architect', department: 'Engineering', stage: 'Offer Negotiation' },
    { title: 'Principal Kubernetes Lead', department: 'Operations', stage: 'SLA Technical Panel' },
    { title: 'UX Bento Grid Spec.', department: 'Design', stage: 'Portfolio Evaluation' }
  ]);

  filteredEngineers = computed(() => {
    const assignedIds = new Set<string>();
    for (const proj of this.state.projects()) {
      if (proj.teamMembers) {
        for (const m of proj.teamMembers) {
          const id = (typeof m === 'object' && m ? m._id : m || '').toString();
          if (id) {
            assignedIds.add(id);
          }
        }
      }
    }
    return this.state.engineers().filter(e => assignedIds.has(e.id.toString()));
  });

  isEngineerSelected(id: string) {
    return this.selectedEngineerIds().includes(id);
  }

  toggleEngineerSelection(id: string) {
    this.selectedEngineerIds.update(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  selectAllEngineers() {
    const allIds = this.filteredEngineers().map(e => e.id);
    if (this.selectedEngineerIds().length === allIds.length) {
      this.selectedEngineerIds.set([]);
    } else {
      this.selectedEngineerIds.set(allIds);
    }
  }

  clearSelection() {
    this.selectedEngineerIds.set([]);
    this.bulkProjectSelected = '';
  }

  toggleEngineerActive(id: string) {
    this.state.toggleEngineerActive(id);
  }

  applyBulkAssignment() {
    if (this.bulkProjectSelected) {
      this.state.batchAssignEngineers(this.selectedEngineerIds(), this.bulkProjectSelected).subscribe({
        next: () => {
          alert(`Bulk allocation completed successfully for ${this.selectedEngineerIds().length} specialists.`);
          this.clearSelection();
        },
        error: (err: any) => {
          alert(err.error?.message || err.message || 'Bulk allocation failed.');
        }
      });
    }
  }

  openRecruitingAlert() {
    alert('Enterprise recruiting portal sync initiated. Job postings synchronized with Workday and greenhouse.');
  }

  // Popup Modal search & add logic
  showSearchModal = signal<boolean>(false);
  searchEmail = '';
  foundEngineer = signal<any | null>(null);
  selectedProjectForAdd = signal<string>('');
  searchError = signal<string>('');

  openSearchModal() {
    this.showSearchModal.set(true);
  }

  closeSearchModal() {
    this.showSearchModal.set(false);
    this.searchEmail = '';
    this.foundEngineer.set(null);
    this.selectedProjectForAdd.set('');
    this.searchError.set('');
  }

  searchEngineer() {
    this.searchError.set('');
    this.foundEngineer.set(null);
    const email = this.searchEmail.trim();
    if (!email) return;

    this.state.searchEngineerByEmail(email).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.foundEngineer.set(res.data);
        } else {
          this.searchError.set('Specialist not found in register.');
        }
      },
      error: (err: any) => {
        this.searchError.set(err.error?.message || err.message || 'Specialist not found in register.');
      }
    });
  }

  addFoundEngineerToProject() {
    const eng = this.foundEngineer();
    const projId = this.selectedProjectForAdd();
    if (eng && projId) {
      this.state.addMember(projId, eng._id).subscribe({
        next: () => {
          alert(`${eng.name} assigned to the project squad successfully!`);
          this.closeSearchModal();
        },
        error: (err: any) => {
          alert(err.error?.message || err.message || 'Failed to assign specialist.');
        }
      });
    }
  }

  getAssignedProjectName(engineerId: string): string {
    const proj = this.state.projects().find(p => 
      p.teamMembers.some((m: any) => (typeof m === 'object' && m ? m._id : m || '').toString() === engineerId.toString())
    );
    return proj ? proj.name : 'Unassigned';
  }

  removeEngineerFromProject(engineerId: string) {
    const proj = this.state.projects().find(p => 
      p.teamMembers.some((m: any) => (typeof m === 'object' && m ? m._id : m || '').toString() === engineerId.toString())
    );
    if (proj) {
      if (confirm(`Are you sure you want to remove this specialist from ${proj.name}?`)) {
        this.state.removeMember(proj._id, engineerId).subscribe({
          error: (err: any) => alert(err.error?.message || err.message || 'Failed to remove member.')
        });
      }
    } else {
      alert('This specialist is not assigned to any active project tracks.');
    }
  }
}
