import React, { createContext, useContext, useState, useEffect } from 'react';
import { VercelService } from '../services/vercel';

interface VercelContextType {
  token: string | null;
  teamId: string | null;
  setToken: (token: string | null) => void;
  setTeamId: (teamId: string | null) => void;
  service: VercelService | null;
  isAuthenticated: boolean;
}

const VercelContext = createContext<VercelContextType | undefined>(undefined);

export const VercelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('vwv0_token') || import.meta.env.VITE_VERCEL_TOKEN || null;
  });
  const [teamId, setTeamIdState] = useState<string | null>(() => {
    return localStorage.getItem('vwv0_team_id') || null;
  });

  const [service, setService] = useState<VercelService | null>(null);

  useEffect(() => {
    if (token) {
      setService(new VercelService(token, teamId || undefined));
    } else {
      setService(null);
    }
  }, [token, teamId]);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('vwv0_token', newToken);
    } else {
      localStorage.removeItem('vwv0_token');
    }
    setTokenState(newToken);
  };

  const setTeamId = (newTeamId: string | null) => {
    if (newTeamId) {
      localStorage.setItem('vwv0_team_id', newTeamId);
    } else {
      localStorage.removeItem('vwv0_team_id');
    }
    setTeamIdState(newTeamId);
  };

  return (
    <VercelContext.Provider value={{ token, teamId, setToken, setTeamId, service, isAuthenticated: !!token }}>
      {children}
    </VercelContext.Provider>
  );
};

export const useVercel = () => {
  const context = useContext(VercelContext);
  if (context === undefined) {
    throw new Error('useVercel must be used within a VercelProvider');
  }
  return context;
};
