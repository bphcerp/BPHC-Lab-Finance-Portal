import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Role = "Admin" | "Viewer";

export type CurrentUser = {
  name?: string;
  email: string;
  role: Role;
};

type UserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

async function fetchUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/check-auth`, {
      credentials: "include",
      headers: {
        'From-Page' : location.pathname === '/login' ? 'login' : 'protected'
      }
    });
    if (res.status !== 200) return null;
    return (await res.json()).user;
  } catch (e) {
    console.error("failed to fetch /user/me", e);
    return null;
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    })
      .finally(() => {
        setUser(null)
        window.location.href = "/login";
      })
      .catch((e) => console.error(e));
  };

  const refreshUser = async () => {
    setLoading(true);
    setUser(await fetchUser());
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user ? user.role === "Admin" : false,
      refreshUser,
      logout,
    }),
    [user, loading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
