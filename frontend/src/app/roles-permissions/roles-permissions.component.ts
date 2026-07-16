import {Component, inject, ChangeDetectionStrategy, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {State} from '../state';

@Component({
  selector: 'app-roles-permissions',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './roles-permissions.component.html',
  styleUrl: './roles-permissions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPermissionsComponent {
  state = inject(State);

  roleDefinitions = signal([
    { roleName: 'Project Manager', icon: 'manage_accounts', tier: '0', allowedCount: 32, description: 'Highest system authorization. Deploy core infrastructure, terminate portfolios, assign keys, modify configuration frameworks, and override consensus parameters.' },
    { roleName: 'Engineer / Contributor', icon: 'developer_mode_tv', tier: '1', allowedCount: 12, description: 'Standard squad development clearance. Commit deliverable progresses, execute subtask checklists, and log operational details.' }
  ]);

  matrixRows = signal([
    { name: 'Deploy Core Infrastructure', description: 'Create and initialize scale-out project portfolios.', manager: true, engineer: false },
    { name: 'Terminate Portfolios', description: 'Terminate and delete enterprise project entries and tasks.', manager: true, engineer: false },
    { name: 'Assign Security Credentials', description: 'Configure fine-grained roles and override user clearances.', manager: true, engineer: false },
    { name: 'Create Deliverables', description: 'Deploy and schedule operational sprint tasks.', manager: true, engineer: true },
    { name: 'Log Progress Matrix', description: 'Update progress percentages and complete subtask checks.', manager: true, engineer: true }
  ]);

  updateRoleAssignment(email: string, event: string) {
    this.state.updateUserRoleAssignment(email, event);
    alert(`Access level elevated successfully for ${email} to ${event}. Clearances synchronized.`);
  }

  loadAllSquadMembers() {
    // Populate Role Hub dynamically with people from our engineers list!
    const currentEmails = this.state.usersForRoles().map(u => u.email.toLowerCase());
    const additionalSpecialists = this.state.engineers()
      .filter(e => !currentEmails.includes(e.email.toLowerCase()))
      .map(e => ({
        name: e.name,
        avatar: e.avatar,
        email: e.email,
        title: e.role,
        currentRole: e.role.includes('Lead') || e.role.includes('Senior') ? 'Project Manager' : 'Engineer'
      }));

    if (additionalSpecialists.length === 0) {
      alert('Workspace directory is fully synchronized.');
      return;
    }

    this.state.usersForRoles.update(prev => [...prev, ...additionalSpecialists]);
    alert(`${additionalSpecialists.length} specialists synchronized from LDAP workspace directory.`);
  }
}
