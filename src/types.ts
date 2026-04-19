export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
  link: string;
  latestDeployments?: VercelDeployment[];
  targets?: {
    production?: {
      alias: string[];
      readyState: string;
      id: string;
    }
  }
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  readyState: 'BUILDING' | 'ERROR' | 'READY' | 'CANCELED' | 'QUEUED';
  createdAt: number;
  creator: {
    username: string;
  };
  target?: 'production' | 'staging' | null;
}

export interface VercelDomain {
  name: string;
  apexName: string;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
}

export interface VercelLogEvent {
  id: string;
  text: string;
  type: 'stdout' | 'stderr';
  created: number;
}

export interface GitHubAccount {
  id: number;
  token: string;
  username: string;
  avatarUrl: string;
  connectedAt: string;
}
