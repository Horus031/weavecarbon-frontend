/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_demo?: boolean;
  role?: "b2b" | "b2c";
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInAsDemo: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setRole: (role: "b2b" | "b2c") => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedSession = localStorage.getItem("demo_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);
      setUser(parsedSession.user);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // Simulate sign up - store in localStorage
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        full_name: fullName,
      };

      const newSession: Session = {
        user: newUser,
        access_token: `token_${Date.now()}`,
      };

      localStorage.setItem("demo_session", JSON.stringify(newSession));
      setSession(newSession);
      setUser(newUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simulate sign in - for demo, accept any email/password
      const existingUser: User = {
        id: `user_${Date.now()}`,
        email,
        full_name: email.split("@")[0],
      };

      const newSession: Session = {
        user: existingUser,
        access_token: `token_${Date.now()}`,
      };

      localStorage.setItem("demo_session", JSON.stringify(newSession));
      setSession(newSession);
      setUser(existingUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Simulate Google sign in
      const googleUser: User = {
        id: `google_${Date.now()}`,
        email: "demo@gmail.com",
        full_name: "Google Demo User",
      };

      const newSession: Session = {
        user: googleUser,
        access_token: `token_${Date.now()}`,
      };

      localStorage.setItem("demo_session", JSON.stringify(newSession));
      setSession(newSession);
      setUser(googleUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInAsDemo = async () => {
    try {
      const demoUser: User = {
        id: `demo_${Date.now()}`,
        email: `demo_${Date.now()}@weavecarbon.demo`,
        full_name: "Demo User",
        is_demo: true,
      };

      const newSession: Session = {
        user: demoUser,
        access_token: `demo_token_${Date.now()}`,
      };

      localStorage.setItem("demo_session", JSON.stringify(newSession));
      setSession(newSession);
      setUser(demoUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("demo_session");
    setUser(null);
    setSession(null);
  };

  const setRole = async (role: "b2b" | "b2c") => {
    if (!user) {
      return { error: new Error("Not authenticated") };
    }

    try {
      const updatedUser = { ...user, role };
      const updatedSession = { ...session!, user: updatedUser };

      localStorage.setItem("demo_session", JSON.stringify(updatedSession));
      setUser(updatedUser);
      setSession(updatedSession);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
