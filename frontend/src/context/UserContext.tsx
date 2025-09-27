import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const initialAuthCheck = async () => {
      try {
        // Light status probe (does not require token)
        const statusResp = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/status`,
          {
            credentials: "include",
          }
        );
        const statusJson = await statusResp
          .json()
          .catch(() => ({ authenticated: false }));
        if (!statusJson.authenticated) {
          if (!cancelled) setUser(null);
          return;
        }
        // Only fetch protected user data if cookie present
        const meResp = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/user/me`,
          { credentials: "include" }
        );
        if (meResp.ok) {
          const data = await meResp.json();
          if (!cancelled) setUser(data);
        } else if (!cancelled) {
          setUser(null);
        }
      } catch (err) {
        console.error("Initial auth check failed:", err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initialAuthCheck();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      // Re-run auth status first to avoid unnecessary protected call
      const statusResp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/status`,
        { credentials: "include" }
      );
      const statusJson = await statusResp
        .json()
        .catch(() => ({ authenticated: false }));
      if (!statusJson.authenticated) {
        setUser(null);
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/user/me`,
        { credentials: "include" }
      );
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else setUser(null);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, loading, logout, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
