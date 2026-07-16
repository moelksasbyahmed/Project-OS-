import {Routes, Router} from '@angular/router';
import {inject} from '@angular/core';
import {State} from './state';

export const authGuard = () => {
  const router = inject(Router);
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
  if (!hasToken) {
    return router.parseUrl('/login');
  }
  return true;
};

export const pmGuard = () => {
  return true;
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./sign-up/sign-up.component').then(m => m.SignUpComponent),
  },
  {
    path: '',
    loadComponent: () => import('./main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects-list/projects-list.component').then(m => m.ProjectsListComponent),
      },
      {
        path: 'projects/create',
        loadComponent: () => import('./create-project/create-project.component').then(m => m.CreateProjectComponent),
        canActivate: [pmGuard],
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
      },
      {
        path: 'projects/:id/add-member',
        loadComponent: () => import('./add-project-member/add-project-member.component').then(m => m.AddProjectMemberComponent),
        canActivate: [pmGuard],
      },
      {
        path: 'tasks',
        loadComponent: () => import('./tasks-list/tasks-list.component').then(m => m.TasksListComponent),
      },
      {
        path: 'tasks/create',
        loadComponent: () => import('./create-task/create-task.component').then(m => m.CreateTaskComponent),
        canActivate: [pmGuard],
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./task-detail/task-detail.component').then(m => m.TaskDetailComponent),
      },
      {
        path: 'tasks/:id/edit',
        loadComponent: () => import('./create-task/create-task.component').then(m => m.CreateTaskComponent),
        canActivate: [pmGuard],
      },
      {
        path: 'team',
        loadComponent: () => import('./team-settings/team-settings.component').then(m => m.TeamSettingsComponent),
        canActivate: [pmGuard],
      },
      {
        path: 'permissions',
        loadComponent: () => import('./roles-permissions/roles-permissions.component').then(m => m.RolesPermissionsComponent),
        canActivate: [pmGuard],
      },
      {
        path: 'profile',
        loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

