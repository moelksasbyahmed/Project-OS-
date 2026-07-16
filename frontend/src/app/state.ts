import {Injectable, signal, computed, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap, map, catchError, throwError, forkJoin} from 'rxjs';

function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'project_manager' | 'engineer';
  lastlogin?: string | null;
  completedProjects?: number[];
  profile?: {
    phone?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectManager: string | { _id: string; name: string; email: string };
  teamMembers: (string | { _id: string; name: string; email: string })[];
  tasks: (string | Task)[];
  progress?: number;
  manager?: string;
  securityLevel?: string;
  updatedAt?: string;
  team?: string[];
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  engineersAssigned: (string | { _id: string; name: string; email: string })[];
  status: 'not_started' | 'in_progress' | 'completed';
  project: string | { _id: string; name: string; status: string };
  projectId?: string; // helper for UI filters
  projectName?: string; // helper for UI filters
  dueDate?: string; // helper
  estimateHours?: number; // helper
  sprint?: string; // helper
  progress?: number; // helper (derived from status)
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
}

export interface Member {
  id: string;
  name: string;
  roleName: string;
  avatar?: string;
  permissionRole: 'Project Manager' | 'Editor' | 'Viewer';
  activeTasks: number;
  progress: number;
}

export interface Engineer {
  id: string;
  name: string;
  email: string;
  role: string;
  currentProject: string;
  currentTask: string;
  avatar?: string;
  availability: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class State {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api';

  // Auth Session State
  isAuthenticated = signal<boolean>(false);
  currentUserRole = signal<string>('');

  // User Profile State
  profile = signal<UserProfile | null>(null);

  // Core collections
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  engineers = signal<Engineer[]>([]);
  usersForRoles = signal<{ name: string; avatar?: string; email: string; title: string; currentRole: string }[]>([]);

  // Computed Properties for dashboard
  activeProjectsCount = computed(() => this.projects().length);
  completedProjectsCount = computed(() => this.projects().filter(p => p.status === 'completed').length);
  pendingTasksCount = computed(() => this.tasks().filter(t => t.status !== 'completed').length);
  activeTasksCount = computed(() => this.tasks().filter(t => t.status === 'in_progress').length);

  constructor() {
    this.checkSession();
  }

  private checkSession() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          this.isAuthenticated.set(true);
          this.currentUserRole.set(user.role);
          this.profile.set(user);
          this.loadInitialData();
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  loadInitialData() {
    const role = this.currentUserRole();
    const userId = this.profile()?._id;

    if (role === 'project_manager' || role === 'admin') {
      forkJoin({
        projectsRes: this.http.get<{ data: Project[] }>(`${this.baseUrl}/projects`),
        engineersRes: this.http.get<{ data: UserProfile[] }>(`${this.baseUrl}/engineers/search/role/engineer`)
      }).subscribe({
        next: ({ projectsRes, engineersRes }) => {
          const rawProjects = projectsRes.data || [];
          const engUsers = engineersRes.data || [];

          // Map engineers
          const mappedEngs: Engineer[] = engUsers.map(u => ({
            id: u._id || '',
            name: u.name,
            email: u.email,
            role: 'Software Engineer',
            currentProject: 'Unassigned',
            currentTask: 'None',
            availability: 100,
            active: true
          }));
          this.engineers.set(mappedEngs);

          // Populate users for permissions management
          const mappedPermissions = engUsers.map(u => ({
            name: u.name,
            email: u.email,
            title: 'Engineer',
            currentRole: 'Engineer'
          }));
          this.usersForRoles.set(mappedPermissions);

          // Map projects
          const projects = rawProjects.map(p => {
            const projTasks = p.tasks || [];
            const completed = projTasks.filter((t: any) => t.status === 'completed').length;
            const progress = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
            
            let managerName = 'Unassigned';
            if (p.projectManager) {
              managerName = typeof p.projectManager === 'object' ? p.projectManager.name : p.projectManager;
            }

            const teamNames = (p.teamMembers || []).map((m: any) => {
              if (typeof m === 'object' && m) return m.name;
              const eng = engUsers.find((u: any) => u._id === m);
              return eng ? eng.name : m;
            });

            return {
              ...p,
              progress,
              manager: managerName,
              team: teamNames,
              securityLevel: p.securityLevel || 'Internal Only',
              updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Just Now'
            };
          });
          this.projects.set(projects);

          // Extract tasks from projects
          const allTasks: Task[] = [];
          projects.forEach(p => {
            if (p.tasks) {
              p.tasks.forEach((t: any) => {
                let assigneeNames: string[] = [];
                if (t.engineersAssigned && t.engineersAssigned.length > 0) {
                  assigneeNames = t.engineersAssigned.map((engIdOrObj: any) => {
                    if (typeof engIdOrObj === 'object' && engIdOrObj) {
                      return engIdOrObj.name;
                    }
                    const eng = engUsers.find((u: any) => u._id === engIdOrObj);
                    return eng ? eng.name : 'Unassigned';
                  });
                }
                const assigneeDisplay = assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Unassigned';

                allTasks.push({
                  ...t,
                  projectId: p._id,
                  projectName: p.name,
                  progress: t.status === 'completed' ? 100 : (t.status === 'in_progress' ? 50 : 0),
                  dueDate: t.due_date || '2026-07-31',
                  estimateHours: t.estimateHours || 16,
                  sprint: 'Sprint 14',
                  priority: t.priority || 'medium',
                  assignee: assigneeDisplay
                });
              });
            }
          });
          this.tasks.set(allTasks);
        },
        error: (err) => console.error('Error loading PM initial data', err)
      });
    } else if (role === 'engineer' && userId) {
      // Load engineer's assignments
      this.http.get<{ data: any }>(`${this.baseUrl}/engineers/${userId}/assignments`).subscribe({
        next: (res) => {
          const assignments = res.data.assignments || {};
          const rawProjects = assignments.projects || [];
          const rawTasks = assignments.Tasks || [];

          const mappedProjects: Project[] = rawProjects.map((p: any) => {
            const projTasks = rawTasks.filter((t: any) => {
              const projId = typeof t.project === 'object' ? t.project?._id : t.project;
              return projId === p._id;
            });
            const completed = projTasks.filter((t: any) => t.status === 'completed').length;
            const progress = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
            return {
              _id: p._id,
              name: p.name,
              status: p.status || 'not_started',
              priority: p.priority || 'medium',
              projectManager: p.projectManager || 'Unknown PM',
              teamMembers: [],
              tasks: [],
              progress
            };
          });
          this.projects.set(mappedProjects);

          const mappedTasks: Task[] = rawTasks.map((t: any) => ({
            _id: t._id,
            title: t.title,
            description: t.description || '',
            status: t.status || 'not_started',
            engineersAssigned: t.engineersAssigned || [],
            project: t.project || '',
            projectId: typeof t.project === 'object' ? t.project._id : t.project,
            projectName: typeof t.project === 'object' ? t.project.name : 'Active Project',
            progress: t.status === 'completed' ? 100 : (t.status === 'in_progress' ? 50 : 0),
            dueDate: t.due_date || '2026-07-31',
            estimateHours: 16,
            sprint: 'Sprint 14'
          }));
          this.tasks.set(mappedTasks);
        },
        error: (err) => console.error('Error loading engineer assignments', err)
      });
    }
  }

  login(email: string, password?: string): Observable<any> {
    const payload = { email, password: password || 'AdminSecure2026!' };
    return this.http.post<{ token: string; data: any }>('http://localhost:5000/api/auth/signin', payload).pipe(
      tap(res => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.token);
          const decoded = decodeToken(res.token);
          const user: UserProfile = {
            _id: decoded?.id || res.data._id || 'me',
            name: res.data.name,
            email: res.data.email,
            role: res.data.role
          };
          localStorage.setItem('user', JSON.stringify(user));
          this.isAuthenticated.set(true);
          this.currentUserRole.set(user.role);
          this.profile.set(user);
          this.loadInitialData();
        }
      })
    );
  }

  signup(name: string, email: string, password?: string, role?: string): Observable<any> {
    const payload = {
      name,
      email,
      password: password || 'AdminSecure2026!',
      role: role || 'engineer'
    };
    return this.http.post<{ token: string; data: any }>('http://localhost:5000/api/auth/signup', payload).pipe(
      tap(res => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.token);
          const decoded = decodeToken(res.token);
          const user: UserProfile = {
            _id: decoded?.id || res.data._id || 'me',
            name: res.data.name,
            email: res.data.email,
            role: res.data.role
          };
          localStorage.setItem('user', JSON.stringify(user));
          this.isAuthenticated.set(true);
          this.currentUserRole.set(user.role);
          this.profile.set(user);
          this.loadInitialData();
        }
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.isAuthenticated.set(false);
    this.currentUserRole.set('');
    this.profile.set(null);
    this.projects.set([]);
    this.tasks.set([]);
    this.engineers.set([]);
    this.usersForRoles.set([]);
  }

  addProject(projectData: Partial<Project>): Observable<any> {
    const payload = {
      name: projectData.name,
      description: projectData.description,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      status: projectData.status || 'not_started',
      priority: projectData.priority || 'medium',
      teamMembers: projectData.teamMembers || []
    };
    return this.http.post<any>(`${this.baseUrl}/projects`, payload).pipe(
      tap(() => this.loadInitialData())
    );
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/projects/${id}`).pipe(
      tap(() => this.loadInitialData())
    );
  }

  addTask(taskData: any): Observable<any> {
    const projectId = taskData.projectId;
    const payload = {
      title: taskData.title,
      description: taskData.description,
      engineersAssigned: taskData.engineersAssigned || []
    };
    return this.http.post<any>(`${this.baseUrl}/tasks/project/${projectId}`, payload).pipe(
      tap(() => this.loadInitialData())
    );
  }

  updateTask(updatedTask: any): Observable<any> {
    const taskId = updatedTask._id || updatedTask.id;
    const payload = { status: updatedTask.status };
    return this.http.patch<any>(`${this.baseUrl}/tasks/${taskId}/status`, payload).pipe(
      tap(() => this.loadInitialData())
    );
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tasks/${id}`).pipe(
      tap(() => this.loadInitialData())
    );
  }

  addMember(projectId: string, engineerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projects/${projectId}/team-members`, { engineerId }).pipe(
      tap(() => this.loadInitialData())
    );
  }

  removeMember(projectId: string, engineerId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/projects/${projectId}/team-members/${engineerId}`).pipe(
      tap(() => this.loadInitialData())
    );
  }

  searchEngineerByEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/engineers/search/email/${email}`);
  }

  updateProfile(profileData: any): Observable<any> {
    // Backend profile patch unnested parameters: phone, linkedin, github, name
    const payload = {
      name: profileData.name,
      phone: profileData.phone,
      linkedin: profileData.linkedin,
      github: profileData.github
    };
    return this.http.patch<any>(`${this.baseUrl}/users/profile`, payload).pipe(
      tap((res) => {
        if (typeof window !== 'undefined' && res.data) {
          const userJson = localStorage.getItem('user');
          if (userJson) {
            const user = JSON.parse(userJson);
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.profile.set(updatedUser);
          }
        }
      })
    );
  }

  updateUserRoleAssignment(email: string, role: string) {
    // Locally mock role modification display
    this.usersForRoles.update(prev => prev.map(u => u.email === email ? { ...u, currentRole: role } : u));
  }

  toggleEngineerActive(id: string) {
    this.engineers.update(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
  }

  batchAssignEngineers(ids: string[], projectId: string): Observable<any> {
    const payload = { engineerIds: ids, projectId };
    return this.http.post<any>(`${this.baseUrl}/engineers/batch/current-project`, payload).pipe(
      tap(() => this.loadInitialData())
    );
  }
}
