import { Injectable } from '@angular/core';

export interface ApiSpec {
  title: string;
  description: string;
  groups: EndpointGroup[];
}

export interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  needsAuth: boolean;
  pathParams: { name: string; description: string }[];
  requestBodyExample?: string;
  responseExample?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiSpecService {
  private apiSpec: ApiSpec = {
    title: 'ThinkDesk Tenancy REST API',
    description: 'An ITSM multi-tenant REST API for managing support tickets, users, and tenants.',
    groups: [
      {
        name: 'Authentication',
        endpoints: [
          {
            method: 'POST',
            path: '/login',
            description: 'Autentica um usuário ou técnico e retorna um token JWT.',
            needsAuth: false,
            pathParams: [],
            requestBodyExample: JSON.stringify({
              "login": "tecnico@example.com",
              "password": "password123"
            }, null, 2),
            responseExample: JSON.stringify({
              "token": "ey...[jwt_token]..."
            }, null, 2),
          },
        ],
      },
      {
        name: 'Tenants',
        endpoints: [
            { method: 'POST', path: '/tenants', description: 'Cria um novo tenant (empresa).', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"tradingName":"Empresa Exemplo SA","legalName":"Empresa Exemplo LTDA","taxID":"12.345.678/0001-99","settings":"{\"theme\":\"dark\"}"}, null, 2) },
            { method: 'GET', path: '/tenants', description: 'Lista todos os tenants.', needsAuth: true, pathParams: [] },
            { method: 'GET', path: '/tenants/{id}', description: 'Busca um tenant específico por ID.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do tenant'}] },
            { method: 'PUT', path: '/tenants/{id}', description: 'Atualiza um tenant existente.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do tenant'}], requestBodyExample: JSON.stringify({"tradingName":"Empresa Atualizada SA","legalName":"Empresa Atualizada LTDA","taxID":"12.345.678/0001-99","settings":"{\"theme\":\"light\"}"}, null, 2) },
            { method: 'DELETE', path: '/tenants/{id}', description: 'Deleta um tenant.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do tenant'}] },
        ]
      },
      {
          name: 'Users',
          endpoints: [
              { method: 'POST', path: '/users', description: 'Cria um novo usuário (solicitante).', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"name":"Usuário Final","email":"usuario@exemplo.com","password":"password123","position":"Analista de Marketing","tenantId":1,"roleId":1}, null, 2) },
              { method: 'GET', path: '/users', description: 'Lista todos os usuários.', needsAuth: true, pathParams: [] },
              { method: 'GET', path: '/users/{id}', description: 'Busca um usuário por ID.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do usuário'}] },
              { method: 'PUT', path: '/users/{id}', description: 'Atualiza um usuário.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do usuário'}], requestBodyExample: JSON.stringify({"name":"Usuário Final Atualizado","email":"usuario.novo@exemplo.com","position":"Analista de Marketing Sênior"}, null, 2) },
              { method: 'DELETE', path: '/users/{id}', description: 'Deleta um usuário.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do usuário'}] },
          ]
      },
      {
          name: 'Technicians',
          endpoints: [
              { method: 'POST', path: '/technicians', description: 'Cria um novo técnico.', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"name":"Técnico N1","email":"tecnico@exemplo.com","password":"password123","level":"L1","tenantId":1}, null, 2) },
              { method: 'GET', path: '/technicians', description: 'Lista todos os técnicos.', needsAuth: true, pathParams: [] },
              { method: 'GET', path: '/technicians/{id}', description: 'Busca um técnico por ID.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do técnico'}] },
              { method: 'PUT', path: '/technicians/{id}', description: 'Atualiza um técnico.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do técnico'}], requestBodyExample: JSON.stringify({"name":"Técnico N2","level":"L2"}, null, 2) },
              { method: 'DELETE', path: '/technicians/{id}', description: 'Deleta um técnico.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do técnico'}] },
          ]
      },
      {
        name: 'SLA Policies',
        endpoints: [
            { method: 'POST', path: '/slapolicies', description: 'Cria uma nova política de SLA.', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"name":"SLA Padrão - TI","responseTimeMinutes":120,"resolutionTimeMinutes":480,"operationalHoursOnly":true,"isActive":true,"categoryDto":{"name":"Infraestrutura","description":"Problemas de infraestrutura"},"tenantId":1,"priorityDto":{"name":"Média"}}, null, 2) },
            { method: 'GET', path: '/slapolicies', description: 'Lista todas as políticas de SLA.', needsAuth: true, pathParams: [] },
            { method: 'GET', path: '/slapolicies/{id}', description: 'Busca uma política por ID.', needsAuth: true, pathParams: [{name: 'id', description: 'ID da política'}] },
            { method: 'PUT', path: '/slapolicies/{id}', description: 'Atualiza uma política.', needsAuth: true, pathParams: [{name: 'id', description: 'ID da política'}], requestBodyExample: JSON.stringify({"name":"SLA Urgente - TI","responseTimeMinutes":60,"resolutionTimeMinutes":240}, null, 2) },
            { method: 'DELETE', path: '/slapolicies/{id}', description: 'Deleta uma política.', needsAuth: true, pathParams: [{name: 'id', description: 'ID da política'}] },
        ]
      },
      {
        name: 'Tickets',
        endpoints: [
            { method: 'POST', path: '/tickets', description: 'Cria um novo ticket de suporte.', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"title":"Impressora não funciona","description":"A impressora do 2º andar parou de funcionar.","resolutionDueDate":"2024-10-28T18:00:00","ticketType":"INCIDENT","category":1,"technician":1,"tenant":1,"requester":2,"priority":3}, null, 2) },
            { method: 'GET', path: '/tickets', description: 'Lista todos os tickets.', needsAuth: true, pathParams: [] },
            { method: 'GET', path: '/tickets/{id}', description: 'Busca um ticket por ID.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do ticket'}] },
            { method: 'PUT', path: '/tickets/{id}', description: 'Atualiza um ticket.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do ticket'}], requestBodyExample: JSON.stringify({"title":"Impressora não funciona - URGENTE","status":"IN_PROGRESS"}, null, 2) },
            { method: 'DELETE', path: '/tickets/{id}', description: 'Deleta um ticket.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do ticket'}] },
        ]
      },
      {
        name: 'Ticket Logs',
        endpoints: [
            { method: 'POST', path: '/ticketlog', description: 'Adiciona uma nova entrada de log a um ticket.', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"content":"Técnico verificou o problema e escalou para o N2.","isPrivate":false,"ticket_id":101}, null, 2) },
            { method: 'GET', path: '/ticketlog/ticket/{ticketId}', description: 'Lista todos os logs de um ticket.', needsAuth: true, pathParams: [{name: 'ticketId', description: 'ID do ticket'}] },
            { method: 'PUT', path: '/ticketlog/{id}', description: 'Atualiza uma entrada de log.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do log'}], requestBodyExample: JSON.stringify({"content":"N2 confirmou o problema na placa lógica.","isPrivate":true}, null, 2) },
            { method: 'DELETE', path: '/ticketlog/{id}', description: 'Deleta uma entrada de log.', needsAuth: true, pathParams: [{name: 'id', description: 'ID do log'}] },
        ]
      },
      {
        name: 'Roles',
        endpoints: [
            { method: 'POST', path: '/roles', description: 'Cria um novo papel (role).', needsAuth: true, pathParams: [], requestBodyExample: JSON.stringify({"name":"ROLE_ADMIN"}, null, 2) },
            { method: 'GET', path: '/roles', description: 'Lista todos os papéis.', needsAuth: true, pathParams: [] },
        ]
      },
      {
        name: 'Metrics',
        endpoints: [
            { method: 'GET', path: '/metrics/team/{teamId}', description: 'Retorna métricas de performance para um time.', needsAuth: true, pathParams: [{name: 'teamId', description: 'ID do time'}] },
            { method: 'GET', path: '/metrics/employee/{employeeId}', description: 'Retorna métricas de performance para um técnico.', needsAuth: true, pathParams: [{name: 'employeeId', description: 'ID do técnico'}] },
        ]
      }
    ]
  };

  getApiSpec(): ApiSpec {
    return this.apiSpec;
  }
}