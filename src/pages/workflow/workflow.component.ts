import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type WorkflowStep = 'login' | 'tenant' | 'role' | 'user' | 'sla' | 'ticket' | 'complete';

interface ApiResponse {
  status: number;
  body: any;
}

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class WorkflowComponent {
  private http = inject(HttpClient);

  // Workflow state
  currentStep = signal<WorkflowStep>('login');
  isLoading = signal(false);
  error = signal<string | null>(null);
  lastResponse = signal<ApiResponse | null>(null);

  // API data state
  authToken = signal<string | null>(null);
  createdIds = signal<{
    tenantId: number | null,
    roleId: number | null,
    userId: number | null,
    categoryId: number | null,
    priorityId: number | null,
    slaPolicyId: number | null,
    ticketId: number | null,
  }>({ 
    tenantId: null, roleId: null, userId: null, 
    categoryId: null, priorityId: null, slaPolicyId: null, ticketId: null 
  });

  // Form data signals
  loginEmail = signal('tecnico@example.com');
  loginPassword = signal('password123');
  
  tenantTradingName = signal('Empresa Exemplo SA');
  tenantLegalName = signal('Empresa Exemplo LTDA');
  tenantTaxID = signal('12.345.678/0001-99');
  tenantSettings = signal('{"theme":"dark"}');
  
  roleName = signal('ROLE_TECHNICIAN');

  userName = signal('Usuário Final');
  userEmail = signal('usuario@exemplo.com');
  userPassword = signal('password123');
  userPosition = signal('Analista de Marketing');

  slaName = signal('SLA Padrão - TI');
  slaResponseTime = signal(120);
  slaResolutionTime = signal(480);
  slaOperationalHoursOnly = signal(true);
  slaIsActive = signal(true);
  slaCategoryName = signal('Infraestrutura');
  slaCategoryDesc = signal('Problemas de infraestrutura');
  slaPriorityName = signal('Média');

  ticketTitle = signal('Impressora não funciona');
  ticketDescription = signal('A impressora do 2º andar parou de funcionar.');
  ticketType = signal<'INCIDENT' | 'REQUEST' | 'PROBLEM'>('INCIDENT');
  ticketDueDate = signal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16));


  private async executeRequest<T>(method: 'POST', path: string, body: string, needsAuth: boolean): Promise<T> {
    this.isLoading.set(true);
    this.error.set(null);
    this.lastResponse.set(null);

    const baseUrl = 'http://localhost:8080';
    const url = `${baseUrl}${path}`;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (needsAuth) {
      if (!this.authToken()) {
        throw new Error('Authentication token is missing.');
      }
      headers = headers.set('Authorization', `Bearer ${this.authToken()}`);
    }

    try {
      const parsedBody = JSON.parse(body);
      const response$ = this.http.request<T>(method, url, {
        body: parsedBody,
        headers: headers,
        observe: 'response'
      });
      const response = await firstValueFrom(response$);
      this.lastResponse.set({ status: response.status, body: response.body });
      return response.body as T;
    } catch (err) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof HttpErrorResponse) {
        if (err.status === 403) {
          errorMessage = 'Access Forbidden (403). Your token may be invalid or lack permissions.';
        } else {
          errorMessage = `Error: ${err.status} ${err.statusText}. Check the console for more details.`;
          this.lastResponse.set({ status: err.status, body: err.error });
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      this.error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleLogin() {
    try {
      const body = JSON.stringify({ login: this.loginEmail(), password: this.loginPassword() });
      const response = await this.executeRequest<{ token: string }>('POST', '/login', body, false);
      this.authToken.set(response.token);
      this.currentStep.set('tenant');
    } catch (e) {
      console.error('Login failed', e);
    }
  }

  async handleCreateTenant() {
    try {
      const body = JSON.stringify({
        tradingName: this.tenantTradingName(),
        legalName: this.tenantLegalName(),
        taxID: this.tenantTaxID(),
        settings: this.tenantSettings()
      });
      const response = await this.executeRequest<{ id: number }>('POST', '/tenants', body, true);
      this.createdIds.update(ids => ({ ...ids, tenantId: response.id }));
      this.currentStep.set('role');
    } catch (e) {
      console.error('Create Tenant failed', e);
    }
  }

  async handleCreateRole() {
    try {
      const body = JSON.stringify({ name: this.roleName() });
      const response = await this.executeRequest<{ id: number }>('POST', '/roles', body, true);
      this.createdIds.update(ids => ({ ...ids, roleId: response.id }));
      this.currentStep.set('user');
    } catch (e) {
      console.error('Create Role failed', e);
    }
  }

  async handleCreateUser() {
    try {
      const body = JSON.stringify({
        name: this.userName(),
        email: this.userEmail(),
        password: this.userPassword(),
        position: this.userPosition(),
        tenantId: this.createdIds().tenantId
      });
      const response = await this.executeRequest<{ id: number }>('POST', '/users', body, true);
      this.createdIds.update(ids => ({ ...ids, userId: response.id }));
      this.currentStep.set('sla');
    } catch (e) {
      console.error('Create User failed', e);
    }
  }

  async handleCreateSla() {
    try {
      const body = JSON.stringify({
        name: this.slaName(),
        responseTimeMinutes: this.slaResponseTime(),
        resolutionTimeMinutes: this.slaResolutionTime(),
        operationalHoursOnly: this.slaOperationalHoursOnly(),
        isActive: this.slaIsActive(),
        categoryDto: {
          name: this.slaCategoryName(),
          description: this.slaCategoryDesc()
        },
        tenantId: this.createdIds().tenantId,
        priorityDto: {
          name: this.slaPriorityName()
        }
      });
      const response = await this.executeRequest<{ id: number, categoryDto: {id: number}, priorityDto: {id: number} }>('POST', '/slapolicies', body, true);
      this.createdIds.update(ids => ({
        ...ids,
        slaPolicyId: response.id,
        categoryId: response.categoryDto.id,
        priorityId: response.priorityDto.id,
      }));
      this.currentStep.set('ticket');
    } catch (e) {
      console.error('Create SLA failed', e);
    }
  }

  async handleCreateTicket() {
    try {
      const body = JSON.stringify({
        title: this.ticketTitle(),
        description: this.ticketDescription(),
        resolutionDueDate: new Date(this.ticketDueDate()).toISOString(),
        ticketType: this.ticketType(),
        category: this.createdIds().categoryId,
        tenant: this.createdIds().tenantId,
        requester: this.createdIds().userId,
        priority: this.createdIds().priorityId
      });
      const response = await this.executeRequest<{ id: number }>('POST', '/tickets', body, true);
      this.createdIds.update(ids => ({ ...ids, ticketId: response.id }));
      this.currentStep.set('complete');
    } catch (e) {
      console.error('Create Ticket failed', e);
    }
  }

  startOver() {
    this.currentStep.set('login');
    this.authToken.set(null);
    this.createdIds.set({ tenantId: null, roleId: null, userId: null, categoryId: null, priorityId: null, slaPolicyId: null, ticketId: null });
    this.error.set(null);
    this.lastResponse.set(null);
  }

  formatResponseBody(body: any): string {
    if (body === null || body === undefined) return '';
    if (typeof body === 'string') {
        try {
            return JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
            return body;
        }
    }
    return JSON.stringify(body, null, 2);
  }
}