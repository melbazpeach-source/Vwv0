import { VercelProject, VercelDeployment, VercelDomain, VercelTeam, VercelLogEvent } from '../types';

const BASE_URL = 'https://api.vercel.com';

export class VercelService {
  private token: string;
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (this.teamId) {
      url.searchParams.append('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async getProjects() {
    const data = await this.fetcher<{ projects: VercelProject[] }>('/v9/projects');
    return data.projects;
  }

  async getTeams() {
    const data = await this.fetcher<{ teams: VercelTeam[] }>('/v2/teams');
    return data.teams;
  }

  async getDeployments(projectId?: string, limit = 20) {
    let endpoint = `/v6/deployments?limit=${limit}`;
    if (projectId) {
      endpoint += `&projectId=${projectId}`;
    }
    const data = await this.fetcher<{ deployments: VercelDeployment[] }>(endpoint);
    return data.deployments;
  }

  async getProjectDomains(projectId: string) {
    const data = await this.fetcher<{ domains: VercelDomain[] }>(`/v9/projects/${projectId}/domains`);
    return data.domains;
  }

  async getDeploymentLogs(deploymentId: string) {
    // Note: This returns a list of events. For real-time one would use the stream API.
    return this.fetcher<VercelLogEvent[]>(`/v2/deployments/${deploymentId}/events`);
  }

  async rollbackDeployment(projectId: string, deploymentId: string) {
    return this.fetcher(`/v9/projects/${projectId}/rollback/${deploymentId}`, {
      method: 'POST',
    });
  }

  async cancelDeployment(deploymentId: string) {
    return this.fetcher(`/v12/deployments/${deploymentId}/cancel`, {
      method: 'PATCH',
    });
  }
}
