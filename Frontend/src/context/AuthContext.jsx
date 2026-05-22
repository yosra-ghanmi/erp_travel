import { useState, useEffect } from "react";
import { users as seedUsers } from "../data/mockData";
import { AuthContext, permissionsMap } from "./authCore";
import { fetchUsers, loginUser, registerSession } from "../services/erpApi";

function ensureSessionToken() {
  let token = sessionStorage.getItem("erp_session_token");
  if (!token) {
    token =
      globalThis.crypto?.randomUUID?.() ??
      `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("erp_session_token", token);
  }
  return token;
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(seedUsers);
  const [sessionToken] = useState(() => ensureSessionToken());

  const [sessionUser, setSessionUser] = useState(() => {
    const saved = localStorage.getItem("erp_session");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => console.error("Failed to fetch users:", err));
  }, []);

  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem("erp_session", JSON.stringify(sessionUser));
      registerSession(sessionToken).catch((err) =>
        console.error("Failed to register session:", err)
      );
    } else {
      localStorage.removeItem("erp_session");
    }
  }, [sessionToken, sessionUser]);

  const login = async ({ email, password }) => {
    try {
      const user = await loginUser({ email, password });
      setSessionUser(user);
      localStorage.setItem("erp_session", JSON.stringify(user));
      registerSession(sessionToken).catch((err) =>
        console.error("Failed to register session:", err)
      );
      return user;
    } catch (error) {
      const message = error.response?.data?.detail || "Invalid credentials";
      throw new Error(message);
    }
  };

  const register = async ({ name, email, password, role, agency_id }) => {
    const exists = users.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) throw new Error("Email already exists");
    const created = {
      id: `USR-${1000 + users.length + 1}`,
      name,
      email,
      password,
      role,
      agency_id,
    };
    setUsers((prev) => [...prev, created]);
    return created;
  };

  const logout = () => {
    setSessionUser(null);
    localStorage.removeItem("erp_session");
  };

  const updateSessionUser = (updates) => {
    setSessionUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const impersonateAgency = (agencyId) => {
    const agencyAdmin = users.find(
      (user) => user.role === "admin" && user.agency_id === agencyId
    );
    if (!agencyAdmin) return null;
    setSessionUser(agencyAdmin);
    return agencyAdmin;
  };

  const hasPermission = (resource, action) => {
    if (!sessionUser) return false;
    return Boolean(permissionsMap[sessionUser.role]?.[resource]?.[action]);
  };

  const value = {
    users,
    setUsers,
    sessionUser,
    sessionToken,
    role: sessionUser?.role ?? null,
    agencyId: sessionUser?.agency_id ?? null,
    isAuthenticated: Boolean(sessionUser),
    login,
    register,
    logout,
    updateSessionUser,
    impersonateAgency,
    hasPermission,
    permissions: sessionUser ? permissionsMap[sessionUser.role] : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
