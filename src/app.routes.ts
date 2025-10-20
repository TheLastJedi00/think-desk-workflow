import { Routes } from '@angular/router';
import { WorkflowComponent } from './pages/workflow/workflow.component';
import { AboutComponent } from './pages/about/about.component';

export const routes: Routes = [
  { path: 'workflow', component: WorkflowComponent },
  { path: 'docs', component: AboutComponent },
  { path: '', redirectTo: '/workflow', pathMatch: 'full' },
  { path: '**', redirectTo: '/workflow' } // Fallback route
];