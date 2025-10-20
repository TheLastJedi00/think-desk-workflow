
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EndpointGroup } from '../../services/api-spec.service';
import { EndpointComponent } from '../endpoint/endpoint.component';

@Component({
  selector: 'app-endpoint-group',
  templateUrl: './endpoint-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EndpointComponent]
})
export class EndpointGroupComponent {
  group = input.required<EndpointGroup>();
}
