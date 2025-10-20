import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type WorkflowStep = 'login' | 'tenant' | 'role' | 'user' | 'sla' | 'ticket' | 'complete';

interface ApiResponse {
  status: number;
  body: any;
}

interface Tenant {
  id: number;
  tradingName: string;
}

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Priority {
  id: number;
  name: string;
}

// Assuming the GET /slapolicies response has this structure for each item
interface SlaPolicy {
  id: number;
  category: Category;
  priority: Priority;
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
  loginEmail = signal('admin');
  loginPassword = signal('admin');
  
  tenantTradingName = signal('Volkswagen');
  tenantTaxID = signal('59104422000150');
  
  roleName = signal('ROLE_TECHNICIAN');

  userName = signal('Usuário Final');
  userEmail = signal('usuario@exemplo.com');
  userPassword = signal('password123');
  userPosition = signal('Analista de Marketing');

  // User step selection signals
  tenants = signal<Tenant[]>([]);
  roles = signal<Role[]>([]);
  tenantSearch = signal('');
  roleSearch = signal('');
  selectedTenantId = signal<number|null>(null);
  selectedRoleId = signal<number|null>(null);
  showTenantResults = signal(false);
  showRoleResults = signal(false);

  // SLA step tenant selection signals
  slaTenantSearch = signal('');
  slaSelectedTenantId = signal<number|null>(null);
  showSlaTenantResults = signal(false);

  filteredTenants = computed(() => {
    const search = this.tenantSearch().toLowerCase();
    if (!search) return this.tenants();
    return this.tenants().filter(t => t.tradingName.toLowerCase().includes(search));
  });

  slaFilteredTenants = computed(() => {
    const search = this.slaTenantSearch().toLowerCase();
    if (!search) return this.tenants();
    return this.tenants().filter(t => t.tradingName.toLowerCase().includes(search));
  });

  filteredRoles = computed(() => {
    const search = this.roleSearch().toLowerCase();
    if (!search) return this.roles();
    return this.roles().filter(r => r.name.toLowerCase().includes(search));
  });

  selectedTenant = computed(() => this.tenants().find(t => t.id === this.selectedTenantId()));
  slaSelectedTenant = computed(() => this.tenants().find(t => t.id === this.slaSelectedTenantId()));
  selectedRole = computed(() => this.roles().find(r => r.id === this.selectedRoleId()));


  slaName = signal('SLA Padrão - TI');
  slaResponseTime = signal(120);
  slaResolutionTime = signal(480);
  slaOperationalHoursOnly = signal(true);
  slaIsActive = signal(true);
  slaCategoryName = signal('Infraestrutura');
  slaCategoryDesc = signal('Problemas de infraestrutura');
  slaPriorityName = signal('Alta');

  ticketTitle = signal('Impressora não funciona');
  ticketDescription = signal('A impressora do 2º andar parou de funcionar.');
  ticketType = signal<'INCIDENT' | 'REQUEST' | 'PROBLEM'>('INCIDENT');
  ticketDueDate = signal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16));

  // API data state for ticket step
  users = signal<User[]>([]);
  categories = signal<Category[]>([]);
  priorities = signal<Priority[]>([]);

  // Ticket foreign key signals
  ticketTenantId = signal<number | null>(null);
  ticketRequesterId = signal<number | null>(null);
  ticketCategoryId = signal<number | null>(null);
  ticketPriorityId = signal<number | null>(null);
  
  // Ticket autocomplete search text
  ticketTenantSearch = signal('');
  ticketRequesterSearch = signal('');
  ticketCategorySearch = signal('');
  ticketPrioritySearch = signal('');

  // Ticket autocomplete visibility
  showTicketTenantResults = signal(false);
  showTicketRequesterResults = signal(false);
  showTicketCategoryResults = signal(false);
  showTicketPriorityResults = signal(false);
  
  // Computed properties for ticket autocompletes
  filteredTicketTenants = computed(() => {
    const search = this.ticketTenantSearch().toLowerCase();
    if (!search) return this.tenants();
    return this.tenants().filter(t => t.tradingName.toLowerCase().includes(search));
  });

  filteredTicketRequesters = computed(() => {
    const search = this.ticketRequesterSearch().toLowerCase();
    if (!search) return this.users();
    return this.users().filter(u => u.name.toLowerCase().includes(search));
  });

  filteredTicketCategories = computed(() => {
    const search = this.ticketCategorySearch().toLowerCase();
    if (!search) return this.categories();
    return this.categories().filter(c => c.name.toLowerCase().includes(search));
  });

  filteredTicketPriorities = computed(() => {
    const search = this.ticketPrioritySearch().toLowerCase();
    if (!search) return this.priorities();
    return this.priorities().filter(p => p.name.toLowerCase().includes(search));
  });

  selectedTicketTenant = computed(() => this.tenants().find(t => t.id === this.ticketTenantId()));
  selectedTicketRequester = computed(() => this.users().find(u => u.id === this.ticketRequesterId()));
  selectedTicketCategory = computed(() => this.categories().find(c => c.id === this.ticketCategoryId()));
  selectedTicketPriority = computed(() => this.priorities().find(p => p.id === this.ticketPriorityId()));


  private async executePostRequest<T>(path: string, body: string, needsAuth: boolean): Promise<T> {
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
      const response$ = this.http.post<T>(url, parsedBody, {
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
      throw err; // Propagate original error to allow for specific handling by the caller
    } finally {
      this.isLoading.set(false);
    }
  }

  private async executeGetRequest<T>(path: string): Promise<T> {
    const baseUrl = 'http://localhost:8080';
    const url = `${baseUrl}${path}`;
    let headers = new HttpHeaders();

    if (!this.authToken()) {
      throw new Error('Authentication token is missing.');
    }
    headers = headers.set('Authorization', `Bearer ${this.authToken()}`);

    try {
      const response$ = this.http.get<T>(url, { headers });
      return await firstValueFrom(response$);
    } catch (err) {
      let errorMessage = 'An unknown error occurred while fetching data.';
      if (err instanceof HttpErrorResponse) {
        errorMessage = `Error fetching data (${path}): ${err.status} ${err.statusText}.`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      this.error.set(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async handleLogin() {
    try {
      const body = JSON.stringify({ login: this.loginEmail(), password: this.loginPassword() });
      const response = await this.executePostRequest<{ token: string }>('/login', body, false);
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
        taxID: this.tenantTaxID(),
      });
      const response = await this.executePostRequest<{ id: number }>('/tenants', body, true);
      this.createdIds.update(ids => ({ ...ids, tenantId: response.id }));
      this.currentStep.set('role');
    } catch (e) {
      if (
        e instanceof HttpErrorResponse &&
        e.status === 500 &&
        e.error?.message === 'CNPJ já está sendo usado por outro Tenant'
      ) {
        // Recoverable error: Tenant already exists.
        // Clear the error message and proceed. The user will select the tenant in the next steps.
        this.error.set(null);
        this.lastResponse.set({ status: e.status, body: e.error });
        this.currentStep.set('role');
      } else {
        // For any other error, log it. The error is already set on the UI by executePostRequest.
        console.error('Create Tenant failed', e);
      }
    }
  }

  async handleCreateRole() {
    try {
      const body = JSON.stringify({ name: this.roleName() });
      const response = await this.executePostRequest<{ id: number }>('/roles', body, true);
      this.createdIds.update(ids => ({ ...ids, roleId: response.id }));
      await this.fetchTenantsAndRoles();
    } catch (e) {
      if (
        e instanceof HttpErrorResponse &&
        e.error?.message?.includes("Duplicate entry") &&
        e.error?.message?.includes("for key 'role.UK8sewwnpamngi6b1dwaa88askk'")
      ) {
        this.error.set(null);
        this.lastResponse.set({ status: e.status, body: e.error });
        await this.fetchTenantsAndRoles(); // Proceed since role exists
      } else {
        console.error('Create Role failed', e);
      }
    }
  }

  async fetchTenantsAndRoles() {
    this.isLoading.set(true);
    try {
      const tenants = await this.executeGetRequest<Tenant[]>('/tenants');
      this.tenants.set(tenants);

      const roles = await this.executeGetRequest<Role[]>('/roles');
      this.roles.set(roles);

      this.selectedTenantId.set(this.createdIds().tenantId);
      this.selectedRoleId.set(this.createdIds().roleId);

      this.currentStep.set('user');
    } catch (e) {
      console.error('Failed to fetch tenants or roles', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleCreateUser() {
    if (!this.selectedTenantId() || !this.selectedRoleId()) {
      this.error.set("Please select a tenant and a role.");
      return;
    }
    try {
      const body = JSON.stringify({
        name: this.userName(),
        email: this.userEmail(),
        password: this.userPassword(),
        position: this.userPosition(),
        tenantId: this.selectedTenantId(),
        roleId: this.selectedRoleId()
      });
      const response = await this.executePostRequest<{ id: number }>('/users', body, true);
      this.createdIds.update(ids => ({ ...ids, userId: response.id }));
      this.slaSelectedTenantId.set(this.selectedTenantId()); // Pre-select for SLA step
      this.currentStep.set('sla');
    } catch (e) {
      console.error('Create User failed', e);
    }
  }

  async handleCreateSla() {
    if (!this.slaSelectedTenantId()) {
        this.error.set("Please select a tenant.");
        return;
    }
    try {
      const body = JSON.stringify({
        name: this.slaName(),
        responseTimeMinutes: this.slaResponseTime(),
        resolutionTimeMinutes: this.slaResolutionTime(),
        operationalHoursOnly: this.slaOperationalHoursOnly(),
        isActive: this.slaIsActive(),
        tenantId: this.slaSelectedTenantId(),
        categoryDto: {
          name: this.slaCategoryName(),
          description: this.slaCategoryDesc()
        },
        priorityDto: {
          name: this.slaPriorityName()
        }
      });
      const response = await this.executePostRequest<{ id: number, category: {id: number}, priority: {id: number} }>('/slapolicies', body, true);
      this.createdIds.update(ids => ({
        ...ids,
        slaPolicyId: response.id,
        categoryId: response.category.id,
        priorityId: response.priority.id,
        tenantId: this.slaSelectedTenantId(),
      }));
      
      await this.fetchDataForTicketStep();
    } catch (e) {
      console.error('Create SLA failed', e);
    }
  }

  async fetchDataForTicketStep() {
    this.isLoading.set(true);
    try {
      const tenants = await this.executeGetRequest<Tenant[]>('/tenants');
      this.tenants.set(tenants);

      const users = await this.executeGetRequest<User[]>('/users');
      this.users.set(users);

      const slaPoliciesResponse = await this.executeGetRequest<SlaPolicy[] | { content: SlaPolicy[] }>('/slapolicies');
      const slaPolicies = Array.isArray(slaPoliciesResponse) ? slaPoliciesResponse : slaPoliciesResponse?.content;

      if (!Array.isArray(slaPolicies)) {
        throw new TypeError('Could not extract an array of SLA policies from the API response.');
      }

      // De-duplicate categories and priorities
      const categoryMap = new Map<number, Category>();
      const priorityMap = new Map<number, Priority>();
      for (const policy of slaPolicies) {
        if (policy.category && !categoryMap.has(policy.category.id)) {
          categoryMap.set(policy.category.id, policy.category);
        }
        if (policy.priority && !priorityMap.has(policy.priority.id)) {
          priorityMap.set(policy.priority.id, policy.priority);
        }
      }
      this.categories.set(Array.from(categoryMap.values()));
      this.priorities.set(Array.from(priorityMap.values()));

      // Pre-populate ticket form fields from previous steps
      this.ticketTenantId.set(this.createdIds().tenantId);
      this.ticketRequesterId.set(this.createdIds().userId);
      this.ticketCategoryId.set(this.createdIds().categoryId);
      this.ticketPriorityId.set(this.createdIds().priorityId);

      this.currentStep.set('ticket');

    } catch (e) {
      console.error('Failed to fetch data for ticket step', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleCreateTicket() {
    try {
      const body = JSON.stringify({
        title: this.ticketTitle(),
        description: this.ticketDescription(),
        resolutionDueDate: new Date(this.ticketDueDate()).toISOString(),
        ticketType: this.ticketType(),
        category: this.ticketCategoryId(),
        tenant: this.ticketTenantId(),
        requester: this.ticketRequesterId(),
        priority: this.ticketPriorityId()
      });
      const response = await this.executePostRequest<{ id: number }>('/tickets', body, true);
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
    this.tenants.set([]);
    this.roles.set([]);
    this.tenantSearch.set('');
    this.roleSearch.set('');
    this.selectedTenantId.set(null);
    this.selectedRoleId.set(null);
    this.slaTenantSearch.set('');
    this.slaSelectedTenantId.set(null);

    this.users.set([]);
    this.categories.set([]);
    this.priorities.set([]);
    
    this.ticketTenantId.set(null);
    this.ticketRequesterId.set(null);
    this.ticketCategoryId.set(null);
    this.ticketPriorityId.set(null);
    
    this.ticketTenantSearch.set('');
    this.ticketRequesterSearch.set('');
    this.ticketCategorySearch.set('');
    this.ticketPrioritySearch.set('');
  }

  selectTenant(tenant: Tenant) {
    this.selectedTenantId.set(tenant.id);
    this.tenantSearch.set('');
    this.showTenantResults.set(false);
  }

  onTenantBlur() {
    setTimeout(() => this.showTenantResults.set(false), 150);
  }

  selectRole(role: Role) {
    this.selectedRoleId.set(role.id);
    this.roleSearch.set('');
    this.showRoleResults.set(false);
  }

  onRoleBlur() {
    setTimeout(() => this.showRoleResults.set(false), 150);
  }

  selectSlaTenant(tenant: Tenant) {
    this.slaSelectedTenantId.set(tenant.id);
    this.slaTenantSearch.set('');
    this.showSlaTenantResults.set(false);
  }

  onSlaTenantBlur() {
    setTimeout(() => this.showSlaTenantResults.set(false), 150);
  }
  
  // Ticket Autocomplete Handlers
  selectTicketTenant(tenant: Tenant) {
    this.ticketTenantId.set(tenant.id);
    this.ticketTenantSearch.set('');
    this.showTicketTenantResults.set(false);
  }
  onTicketTenantBlur() {
    setTimeout(() => this.showTicketTenantResults.set(false), 150);
  }

  selectTicketRequester(user: User) {
    this.ticketRequesterId.set(user.id);
    this.ticketRequesterSearch.set('');
    this.showTicketRequesterResults.set(false);
  }
  onTicketRequesterBlur() {
    setTimeout(() => this.showTicketRequesterResults.set(false), 150);
  }

  selectTicketCategory(category: Category) {
    this.ticketCategoryId.set(category.id);
    this.ticketCategorySearch.set('');
    this.showTicketCategoryResults.set(false);
  }
  onTicketCategoryBlur() {
    setTimeout(() => this.showTicketCategoryResults.set(false), 150);
  }

  selectTicketPriority(priority: Priority) {
    this.ticketPriorityId.set(priority.id);
    this.ticketPrioritySearch.set('');
    this.showTicketPriorityResults.set(false);
  }
  onTicketPriorityBlur() {
    setTimeout(() => this.showTicketPriorityResults.set(false), 150);
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
