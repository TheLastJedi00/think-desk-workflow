import { Routes } from '@angular/router';
import { WorkflowComponent } from './pages/workflow/workflow.component';
import { DocsComponent } from './pages/docs/docs.component';

export const routes: Routes = [
  { path: 'workflow', component: WorkflowComponent },
  { path: 'docs', component: DocsComponent },
  { path: '', redirectTo: '/workflow', pathMatch: 'full' },
  { path: '**', redirectTo: '/workflow' } // Fallback route
];
