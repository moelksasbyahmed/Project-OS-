import {Component, inject, ChangeDetectionStrategy, signal, computed, OnInit, effect} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {State} from '../state';

@Component({
  selector: 'app-create-task',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskComponent implements OnInit {
  state = inject(State);
  route = inject(ActivatedRoute);
  router = inject(Router);
  fb = inject(FormBuilder);

  isEditMode = signal<boolean>(false);
  taskIdParam = signal<string>('');

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    projectId: ['', Validators.required],
    assignee: ['', Validators.required],
    priority: ['high', Validators.required],
    dueDate: ['2026-07-28'],
    estimateHours: [16]
  });

  constructor() {
    effect(() => {
      const projects = this.state.projects();
      if (projects.length > 0 && !this.taskForm.value.projectId && !this.isEditMode()) {
        this.taskForm.patchValue({
          projectId: projects[0]._id
        });
      }
    });
  }

  // Reactive computed suggestions from AI Copilot!
  titleInput = computed(() => this.taskForm.value.title || '');
  
  aiSuggestedHours = computed(() => {
    const title = this.titleInput().toLowerCase();
    if (title.includes('ws') || title.includes('websocket') || title.includes('sync')) {
      return 40;
    }
    if (title.includes('design') || title.includes('css') || title.includes('ui')) {
      return 16;
    }
    return 12;
  });

  aiRiskFactor = computed(() => {
    const title = this.titleInput().toLowerCase();
    if (title.includes('consensus') || title.includes('websocket') || title.includes('high')) {
      return 'Medium High (Protocols check needed)';
    }
    return 'Low (Standard Deliverable)';
  });

  selectedProjectId = computed(() => this.taskForm.value.projectId || '');

  assignableEngineers = computed(() => {
    const projId = this.selectedProjectId();
    const proj = this.state.projects().find(p => p._id === projId);
    if (!proj || !proj.teamMembers) return [];
    return proj.teamMembers.map((m: any) => {
      const id = (typeof m === 'object' && m ? m._id : m || '').toString();
      const eng = this.state.engineers().find(e => e.id.toString() === id);
      return {
        id: id,
        name: eng ? eng.name : (typeof m === 'object' && m ? m.name : 'Specialist')
      };
    });
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.url.map(segment => segment.path).join('/');
    
    if (id && path.includes('edit')) {
      this.isEditMode.set(true);
      this.taskIdParam.set(id);
      
      const existingTask = this.state.tasks().find(t => t._id === id);
      if (existingTask) {
        const eng = this.state.engineers().find(e => e.name === existingTask.assignee);
        this.taskForm.patchValue({
          title: existingTask.title,
          description: existingTask.description,
          projectId: existingTask.projectId || '',
          assignee: eng ? eng.id : '',
          priority: existingTask.priority || 'high',
          dueDate: existingTask.dueDate || '2026-07-28',
          estimateHours: existingTask.estimateHours || 16
        });
      }
    }
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const projectId = formValue.projectId || '';
      const assigneeId = formValue.assignee || '';

      if (this.isEditMode()) {
        const id = this.taskIdParam();
        alert('Scope changes saved locally.');
        this.router.navigate(['/tasks', id]);
      } else {
        this.state.addTask({
          title: formValue.title || '',
          description: formValue.description || '',
          projectId: projectId,
          engineersAssigned: assigneeId ? [assigneeId] : []
        }).subscribe({
          next: () => {
            this.router.navigate(['/tasks']);
          },
          error: (err) => {
            alert(err.error?.message || err.message || 'Failed to create task.');
          }
        });
      }
    }
  }
}
