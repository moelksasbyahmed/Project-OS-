import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'projects/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'projects/:id/add-member',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tasks/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tasks/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
