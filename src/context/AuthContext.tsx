import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, type UserProfile, type LoginRequest, type RegisterRequest } from '../api/auth';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await authApi.getProfile();
      setState({
        user: data.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  // Boot: check if we have a stored token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshProfile();
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [refreshProfile]);

  // Listen for forced logout from interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = async (creds: LoginRequest) => {
    const { data } = await authApi.login(creds);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setState({
      user: data.data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (payload: RegisterRequest) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setState({
      user: data.data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    authApi.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}