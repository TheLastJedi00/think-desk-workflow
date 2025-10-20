import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TITLE_URL } from '../../assets';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
}

interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  // FIX: Corrected typo from Change-DetectionStrategy to ChangeDetectionStrategy
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AboutComponent {
  
  readonly titleUrl = TITLE_URL;

  readonly apiDocs: EndpointGroup[] = [
    {
      name: 'Authentication',
      endpoints: [
        {
          method: 'POST',
          path: '/login',
          description: 'Autentica um usuário ou técnico e retorna um token JWT.',
          requestBody: JSON.stringify({ "login": "tecnico@example.com", "password": "password123" }, null, 2),
          responseBody: JSON.stringify({ "token": "ey...[jwt_token]..." }, null, 2),
        },
      ],
    },
    {
      name: 'Tenants',
      endpoints: [
        { method: 'POST', path: '/tenants', description: 'Cria um novo tenant (empresa).', requestBody: JSON.stringify({ "tradingName": "Empresa Exemplo SA", "legalName": "Empresa Exemplo LTDA", "taxID": "12.345.678/0001-99", "settings": "{\"theme\":\"dark\"}" }, null, 2), responseBody: 'Retorna o objeto do tenant criado.' },
        { method: 'GET', path: '/tenants', description: 'Lista todos os tenants.', responseBody: JSON.stringify([{ "id": 1, "tradingName": "Empresa Exemplo SA", "legalName": "Empresa Exemplo LTDA", "taxID": "12345678000199", "createdAt": "2024-10-28T10:00:00", "active": true, "settings": "{\"theme\":\"dark\"}" }], null, 2) },
        { method: 'GET', path: '/tenants/{id}', description: 'Busca um tenant específico por ID.', responseBody: 'Retorna o objeto do tenant encontrado.' },
        { method: 'PUT', path: '/tenants/{id}', description: 'Atualiza um tenant existente.', requestBody: '(Mesma estrutura do POST)', responseBody: 'Retorna o objeto do tenant atualizado.' },
        { method: 'DELETE', path: '/tenants/{id}', description: 'Deleta um tenant.', responseBody: '204 No Content' },
      ],
    },
    {
        name: 'Users',
        endpoints: [
            { method: 'POST', path: '/users', description: 'Cria um novo usuário (solicitante) associado a um tenant.', requestBody: JSON.stringify({ "name": "Usuário Final", "email": "usuario@exemplo.com", "password": "password123", "position": "Analista de Marketing", "tenantId": 1 }, null, 2), responseBody: JSON.stringify({ "id": 1, "name": "Usuário Final", "email": "usuario@exemplo.com", "position": "Analista de Marketing", "active": true, "tenantId": 1 }, null, 2) },
            { method: 'GET', path: '/users', description: 'Lista todos os usuários.', responseBody: 'Retorna uma lista de objetos UserResponseDto.' },
            { method: 'GET', path: '/users/{id}', description: 'Busca um usuário por ID.', responseBody: 'Retorna um único objeto UserResponseDto.' },
            { method: 'PUT', path: '/users/{id}', description: 'Atualiza um usuário.', requestBody: '(Mesma estrutura do POST, exceto password que é opcional)', responseBody: 'Retorna o objeto UserResponseDto atualizado.' },
            { method: 'DELETE', path: '/users/{id}', description: 'Deleta um usuário.', responseBody: '204 No Content' },
        ],
    },
    {
        name: 'Technicians',
        endpoints: [
            { method: 'POST', path: '/technicians', description: 'Cria um novo técnico associado a um tenant.', requestBody: JSON.stringify({ "name": "Técnico N1", "email": "tecnico@exemplo.com", "password": "password123", "level": "L1" }, null, 2), responseBody: 'Retorna o objeto do técnico criado.' },
            { method: 'GET', path: '/technicians', description: 'Lista todos os técnicos.', responseBody: 'Retorna uma lista de objetos Technician.' },
            { method: 'GET', path: '/technicians/{id}', description: 'Busca um técnico por ID.', responseBody: 'Retorna um único objeto Technician.' },
            { method: 'PUT', path: '/technicians/{id}', description: 'Atualiza um técnico.', requestBody: JSON.stringify({ "name": "Técnico N1", "email": "tecnico@exemplo.com", "level": "L2" }, null, 2), responseBody: 'Retorna o objeto Technician atualizado.' },
            { method: 'DELETE', path: '/technicians/{id}', description: 'Deleta um técnico.', responseBody: '204 No Content' },
        ],
    },
    {
        name: 'SLA Policies',
        endpoints: [
            { method: 'POST', path: '/slapolicies', description: 'Cria uma nova política de SLA. Note que a categoria e a prioridade podem ser criadas dinamicamente aqui.', requestBody: JSON.stringify({"name":"SLA Padrão - TI","responseTimeMinutes":120,"resolutionTimeMinutes":480,"operationalHoursOnly":true,"isActive":true,"categoryDto":{"name":"Infraestrutura","description":"Problemas de infraestrutura"},"tenantId":1,"priorityDto":{"name":"Média"}}, null, 2), responseBody: JSON.stringify({"id":1,"name":"SLA Padrão - TI","responseTimeMinutes":120,"resolutionTimeMinutes":480,"categoryDto":{"id":1,"name":"Infraestrutura","description":"Problemas de infraestrutura"},"priorityDto":{"id":1,"name":"Média"}}, null, 2) },
            { method: 'GET', path: '/slapolicies', description: 'Lista todas as políticas de SLA.', responseBody: 'Retorna uma lista de SlaPolicyResponseDTO.' },
            { method: 'GET', path: '/slapolicies/{id}', description: 'Busca uma política por ID.', responseBody: 'Retorna um único SlaPolicyResponseDTO.' },
            { method: 'PUT', path: '/slapolicies/{id}', description: 'Atualiza uma política.', requestBody: '(Mesma estrutura do POST)', responseBody: 'Retorna o SlaPolicyResponseDTO atualizado.' },
            { method: 'DELETE', path: '/slapolicies/{id}', description: 'Deleta uma política.', responseBody: '204 No Content' },
        ]
    },
    {
        name: 'Tickets',
        endpoints: [
            { method: 'POST', path: '/tickets', description: 'Cria um novo ticket de suporte.', requestBody: JSON.stringify({"title":"Impressora não funciona","description":"A impressora do 2º andar parou de funcionar.","ticketType":"INCIDENT","category":1,"technician":1,"tenant":1,"requester":2,"priority":3}, null, 2), responseBody: JSON.stringify({"id":101,"title":"Impressora não funciona","description":"A impressora do 2º andar parou de funcionar.","status":"OPEN","resolutionDueDate":"2024-10-28T18:00:00","ticketType":"INCIDENT","category":{"id":1,"name":"Hardware"},"technician":{"id":1,"name":"Técnico N1"},"tenant":{"id":1,"tradingName":"Empresa Exemplo SA"},"requester":{"id":2,"name":"Usuário Final"},"priority":{"id":3,"name":"Média"}}, null, 2) },
            { method: 'GET', path: '/tickets', description: 'Lista todos os tickets de forma paginada.', responseBody: 'Retorna um objeto Page contendo uma lista de Ticket.' },
            { method: 'GET', path: '/tickets/{id}', description: 'Busca um ticket por ID.', responseBody: 'Retorna um único objeto Ticket.' },
            { method: 'PUT', path: '/tickets/{id}', description: 'Atualiza um ticket.', requestBody: JSON.stringify({"title":"Impressora não funciona","description":"A impressora do 2º andar parou de funcionar.","ticketType":"INCIDENT","category":1,"technician":1,"tenant":1,"requester":2,"priority":3}, null, 2), responseBody: 'Retorna o objeto Ticket atualizado.' },
            { method: 'DELETE', path: '/tickets/{id}', description: 'Deleta um ticket.', responseBody: '204 No Content' },
        ]
    },
    {
        name: 'Ticket Logs',
        endpoints: [
            { method: 'POST', path: '/ticketlog', description: 'Adiciona uma nova entrada de log a um ticket existente.', requestBody: JSON.stringify({"content":"Técnico verificou o problema e escalou para o N2.","isPrivate":false,"ticket_id":101}, null, 2), responseBody: JSON.stringify({"id":50,"content":"Técnico verificou o problema e escalou para o N2.","createdAt":"2024-10-28T14:30:00","isPrivate":false,"ticket_id":101,"authorName":"Técnico N1"}, null, 2) },
            { method: 'GET', path: '/ticketlog/ticket/{ticketId}', description: 'Lista todos os logs de um ticket específico.', responseBody: 'Retorna uma lista de objetos TicketLog.' },
            { method: 'PUT', path: '/ticketlog/{id}', description: 'Atualiza uma entrada de log.', requestBody: '(Mesma estrutura do POST)', responseBody: 'Retorna o objeto TicketLog atualizado.' },
            { method: 'DELETE', path: '/ticketlog/{id}', description: 'Deleta uma entrada de log.', responseBody: '204 No Content' },
        ]
    },
    {
        name: 'Roles',
        endpoints: [
            { method: 'POST', path: '/roles', description: 'Cria um novo papel (role) no sistema. (Uso geralmente administrativo).', requestBody: JSON.stringify({"name":"ROLE_ADMIN"}, null, 2), responseBody: JSON.stringify({"id":1,"name":"ROLE_ADMIN"}, null, 2) },
            { method: 'GET', path: '/roles', description: 'Lista todos os papéis.', responseBody: 'Retorna uma lista de objetos Role.' },
        ]
    },
    {
        name: 'Metrics',
        endpoints: [
            { method: 'GET', path: '/metrics/team/{teamId}', description: 'Retorna métricas de performance para um time específico.', responseBody: JSON.stringify({"resolvedTickets":150,"slaMet":145,"openTickets":12,"averageResolutionTimeMinutes":210}, null, 2) },
            { method: 'GET', path: '/metrics/employee/{employeeId}', description: 'Retorna métricas de performance para um técnico específico.', responseBody: JSON.stringify({"resolvedTickets":30,"slaMet":28,"openTickets":5,"averageResolutionTimeMinutes":180}, null, 2) },
        ]
    }
  ];

  selectedGroup = signal<EndpointGroup>(this.apiDocs[0]);

  selectGroup(group: EndpointGroup) {
    this.selectedGroup.set(group);
  }

  getMethodClass(method: string): string {
    switch (method) {
      case 'GET': return 'bg-blue-600/20 text-blue-300';
      case 'POST': return 'bg-green-600/20 text-green-300';
      case 'PUT': return 'bg-yellow-600/20 text-yellow-300';
      case 'DELETE': return 'bg-red-600/20 text-red-300';
      default: return 'bg-gray-600/20 text-gray-300';
    }
  }
}