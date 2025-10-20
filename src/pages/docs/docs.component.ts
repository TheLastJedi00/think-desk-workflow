import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiSpec, ApiSpecService } from '../../services/api-spec.service';
import { EndpointGroupComponent } from '../../components/endpoint-group/endpoint-group.component';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EndpointGroupComponent],
})
export class DocsComponent {
  private apiSpecService = inject(ApiSpecService);
  apiSpec = signal<ApiSpec>(this.apiSpecService.getApiSpec());
}
