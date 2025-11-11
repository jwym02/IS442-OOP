import { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const STORAGE_KEY = 'authUser';
const TOKEN_KEY = 'authToken';
const REFRESH_KEY = 'refreshToken';

const AuthContext = createContext(null);

const persistSession = ({ token, refreshToken, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(STORAGE_KEY);
};

const mapAuthResponse = (data) => ({
  token: data.token,
  refreshToken: data.refreshToken,
  user: {
    userId: data.userId,
    email: data.email,
    name: data.name,
    roles: data.roles || [],
    patientProfileId: data.patientProfileId,
    staffProfileId: data.staffProfileId,
    doctorProfileId: data.doctorProfileId,
    adminProfileId: data.adminProfileId,
    staffClinicId: data.staffClinicId,
    doctorClinicId: data.doctorClinicId,
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        const token = localStorage.getItem(TOKEN_KEY);
        const storedRole = localStorage.getItem('activeRole');
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (storedRole && parsedUser.roles?.includes(storedRole)) {
            setActiveRole(storedRole);
          } else if (parsedUser.roles?.length > 0) {
            setActiveRole(parsedUser.roles[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);
  

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      const mapped = mapAuthResponse(data);
      persistSession(mapped);
      setUser(mapped.user);
      if (mapped.user.roles?.length > 0) {
        const defaultRole = mapped.user.roles[0];
        setActiveRole(defaultRole);
        localStorage.setItem('activeRole', defaultRole);
      }
      return { success: true, user: mapped.user };
    } catch (error) {
      clearSession();
      return {
        success: false,
        error:
          error?.userMessage ||
          error.response?.data?.message ||
          'Unable to login. Please try again.',
      };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const { data } = await authAPI.register(payload);
      const mapped = mapAuthResponse(data);
      persistSession(mapped);
      setUser(mapped.user);
      return { success: true };
    } catch (error) {
      clearSession();
      return {
        success: false,
        error:
          error?.userMessage ||
          error.response?.data?.message ||
          'Unable to register. Please try again.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    localStorage.removeItem('activeRole');
    setUser(null);
    setActiveRole(null);
  }, []);

  // Bypass real auth and create a fake session
  const devBypassLogin = useCallback(async (role = 'PATIENT') => {
    const normalizedRole = role === 'ADMIN' ? 'SYSTEM_ADMINISTRATOR' : role;
    const fake = {
      token: `dev-token-${Date.now()}`,
      refreshToken: `dev-refresh-${Date.now()}`,
      user: {
        userId: 1,
        email: `${normalizedRole.toLowerCase()}.1@example.com`,
        name: `${normalizedRole} 1`,
        roles: [normalizedRole],
        patientProfileId: normalizedRole === 'PATIENT' ? 1 : null,
        staffProfileId: normalizedRole === 'STAFF' ? 1 : null,
        doctorProfileId: normalizedRole === 'DOCTOR' ? 1 : null,
        adminProfileId: normalizedRole === 'SYSTEM_ADMINISTRATOR' ? 1 : null,
        staffClinicId: normalizedRole === 'STAFF' ? 1 : null,
        doctorClinicId: normalizedRole === 'DOCTOR' ? 1 : null,
      },
    };
    persistSession(fake);
    setUser(fake.user);
    setActiveRole(normalizedRole);
    localStorage.setItem('activeRole', normalizedRole);
    // Allow state to commit before navigation by awaiting a microtask
    await new Promise((r) => setTimeout(r, 0));
    return { success: true };
  }, []);

  const updateActiveRole = useCallback(
    (role) => {
      if (user?.roles?.includes(role)) {
        setActiveRole(role);
        localStorage.setItem('activeRole', role);
      }
    },
    [user]
  );

  const hasRole = useCallback(
    (role) => {
      if (!role || !user) return false;
      return user.roles?.includes(role) ?? false;
    },
    [user]
  );

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      activeRole,
      login,
      register,
      logout,
      hasRole,
      devBypassLogin,
      setActiveRole: updateActiveRole,
    }),
    [user, loading, activeRole, hasRole, login, register, logout, devBypassLogin, updateActiveRole]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;
