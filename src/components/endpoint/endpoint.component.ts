import { Component, ChangeDetectionStrategy, input, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Endpoint } from '../../services/api-spec.service';

interface ApiResponse {
  status: number;
  statusText: string;
  body: any;
  headers: HttpHeaders;
}

@Component({
  selector: 'app-endpoint',
  templateUrl: './endpoint.component.html',
  styleUrls: ['./endpoint.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class EndpointComponent {
  endpoint = input.required<Endpoint>();
  
  private http = inject(HttpClient);
  
  isExpanded = signal(false);
  authToken = signal('');
  requestBody = signal('');

  constructor() {
    effect(() => {
      this.requestBody.set(this.endpoint().requestBodyExample || '');
    });
  }
  
  // Use a signal to hold path parameter values
  private pathParamValues = signal<{[key: string]: string}>({});

  // Computed signal to build the final path
  finalPath = computed(() => {
    let path = this.endpoint().path;
    const params = this.pathParamValues();
    for (const key in params) {
      path = path.replace(`{${key}}`, encodeURIComponent(params[key] || `{${key}}`));
    }
    return path;
  });

  isLoading = signal(false);
  apiResponse = signal<ApiResponse | null>(null);
  error = signal<string | null>(null);

  toggleExpand() {
    this.isExpanded.update(v => !v);
  }

  updatePathParam(name: string, value: string) {
    this.pathParamValues.update(current => ({ ...current, [name]: value }));
  }

  getMethodClass(): string {
    const method = this.endpoint().method;
    switch (method) {
      case 'GET': return 'bg-blue-600 hover:bg-blue-700';
      case 'POST': return 'bg-green-600 hover:bg-green-700';
      case 'PUT': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'DELETE': return 'bg-red-600 hover:bg-red-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  }

  getResponseStatusClass(): string {
    const status = this.apiResponse()?.status ?? 0;
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  }

  async executeRequest() {
    this.isLoading.set(true);
    this.apiResponse.set(null);
    this.error.set(null);

    const baseUrl = 'http://localhost:8080';
    const url = `${baseUrl}${this.finalPath()}`;

    let headers = new HttpHeaders();
    if (this.endpoint().needsAuth && this.authToken()) {
      headers = headers.set('Authorization', `Bearer ${this.authToken()}`);
    }

    if (this.endpoint().method === 'POST' || this.endpoint().method === 'PUT') {
        headers = headers.set('Content-Type', 'application/json');
    }

    try {
        let body: any = null;
        if ((this.endpoint().method === 'POST' || this.endpoint().method === 'PUT') && this.requestBody()) {
            try {
                body = JSON.parse(this.requestBody());
            } catch (e) {
                this.error.set('Invalid JSON in request body.');
                this.isLoading.set(false);
                return;
            }
        }
        
        const response$ = this.http.request(this.endpoint().method, url, {
            body: body,
            headers: headers,
            observe: 'response',
            responseType: 'json'
        });

        const response = await firstValueFrom(response$);
        
        this.apiResponse.set({
            status: response.status,
            statusText: response.statusText,
            body: response.body,
            headers: response.headers,
        });

    } catch (err) {
        if (err instanceof HttpErrorResponse) {
             this.apiResponse.set({
                status: err.status,
                statusText: err.statusText,
                body: err.error,
                headers: err.headers,
            });
        } else if(err instanceof Error) {
            this.error.set(err.message || 'An unknown error occurred.');
        } else {
             this.error.set('An unknown error occurred.');
        }
    } finally {
        this.isLoading.set(false);
    }
  }

  formatResponseBody(body: any): string {
    if (typeof body === 'string') {
        try {
            return JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
            return body; // Not a JSON string, return as is
        }
    }
    if(body === null || body === undefined) return '';
    return JSON.stringify(body, null, 2);
  }
}