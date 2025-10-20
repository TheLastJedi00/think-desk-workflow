import { Routes } from '@angular/router';
import { WorkflowComponent } from './pages/workflow/workflow.component';
import { AboutComponent } from './pages/about/about.component';

export const routes: Routes = [
  { path: 'workflow', component: WorkflowComponent },
  { path: 'home', component: AboutComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' } // Fallback route
];