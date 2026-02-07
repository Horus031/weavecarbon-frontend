/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  full_name?: string;
  company_id?: string | null;
  user_type?: "b2b" | "b2c" | "admin";
  avatar_url?: string | null;
  is_demo_user?: boolean;
}

// Helper to create auth email with type suffix (allows same email for both B2B and B2C)
const createAuthEmail = (email: string, userType: "b2b" | "b2c"): string => {
  const [localPart, domain] = email.split("@");
  return `${localPart}+${userType}@${domain}`;
};

// Helper to convert Supabase error messages to user-friendly messages
const getReadableErrorMessage = (error: Error | { message: string }): string => {
  const message = error.message.toLowerCase();
  
  // Authentication errors
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (message.includes("email not confirmed")) {
    return "Please verify your email address before signing in. Check your inbox for a confirmation link.";
  }
  if (message.includes("user already registered") || message.includes("already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (message.includes("password") && message.includes("weak")) {
    return "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (message.includes("user not found")) {
    return "No account found with this email address.";
  }
  if (message.includes("email") && message.includes("invalid")) {
    return "Please enter a valid email address.";
  }
  if (message.includes("signup disabled") || message.includes("signups not allowed")) {
    return "New account registration is currently disabled.";
  }
  if (message.includes("session") && message.includes("expired")) {
    return "Your session has expired. Please sign in again.";
  }
  
  // Database/Profile errors
  if (message.includes("duplicate") || message.includes("unique constraint")) {
    return "This account already exists. Please try signing in instead.";
  }
  if (message.includes("permission") || message.includes("not authorized")) {
    return "You don't have permission to perform this action.";
  }
  
  // OAuth errors
  if (message.includes("oauth") || message.includes("provider")) {
    return "Unable to connect with your social account. Please try again or use email sign in.";
  }
  if (message.includes("popup") && message.includes("closed")) {
    return "Sign in was cancelled. Please try again.";
  }

  // Return original message if no match (but capitalize first letter)
  return error.message.charAt(0).toUpperCase() + error.message.slice(1);
};

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    userType?: "b2b" | "b2c",
  ) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (
    email: string,
    password: string,
    userType?: "b2b" | "b2c",
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (
    userType?: "b2b" | "b2c",
  ) => Promise<{ error: Error | null }>;
  signInAsDemo: (userType?: "b2b" | "b2c") => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Create supabase client once and memoize it
  const supabase = useMemo(() => createClient(), []);

  const fetchUserProfile = useCallback(
    async (userId: string, userType?: "b2b" | "b2c"): Promise<any> => {
      try {
        console.log("Fetching profile for user:", userId, "type:", userType);

        // Build query - if userType provided, filter by it too
        let query = supabase.from("users").select("*").eq("id", userId);

        if (userType) {
          query = query.eq("user_type", userType);
        }

        // Use maybeSingle() to avoid 406 error when no rows found
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
          return null;
        }

        console.log("Profile fetched:", data);
        return data;
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        return null;
      }
    },
    [supabase],
  );

  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { user: sbUser },
      } = await supabase.auth.getUser();

      if (sbUser) {
        const profile = await fetchUserProfile(sbUser.id);
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            company_id: profile.company_id,
            user_type: profile.user_type,
            avatar_url: profile.avatar_url,
            is_demo_user: profile.is_demo_user,
          });
          setSupabaseUser(sbUser);
        }
      } else {
        setUser(null);
        setSupabaseUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, [supabase, fetchUserProfile]);

  useEffect(() => {
    let mounted = true;

    // Use onAuthStateChange as the ONLY source of truth
    // This handles both initial session load and subsequent auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, "session:", session ? "exists" : "none");

      if (!mounted) return;

      if (session?.user) {
        // For SIGNED_IN events (OAuth redirects), the session token may not be ready
        // for authenticated DB queries yet. Set basic user data and let INITIAL_SESSION
        // handle the full profile fetch.
        if (event === 'SIGNED_IN') {
          console.log("SIGNED_IN event - setting basic user data, waiting for INITIAL_SESSION");
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User",
            avatar_url: session.user.user_metadata?.avatar_url,
            user_type: "b2b", // Default, will be updated from profile
          });
          setSupabaseUser(session.user);
          // Don't set loading to false yet - let INITIAL_SESSION complete the profile fetch
          return;
        }
        
        console.log("Fetching profile for user:", session.user.id);
        const profile = await fetchUserProfile(session.user.id);
        console.log("Profile fetch result:", profile);
        
        if (mounted) {
          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              company_id: profile.company_id,
              user_type: profile.user_type,
              avatar_url: profile.avatar_url,
              is_demo_user: profile.is_demo_user,
            });
          } else {
            // Profile doesn't exist yet - this is OK for new OAuth users
            // Set a minimal user object from supabase user
            console.log("No profile found, using supabase user data");
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User",
              avatar_url: session.user.user_metadata?.avatar_url,
              user_type: "b2b", // Default, will be updated after onboarding
            });
          }
          // Always set supabaseUser
          setSupabaseUser(session.user);
          setLoading(false);
        }
      } else {
        // No session - user is signed out
        if (mounted) {
          setUser(null);
          setSupabaseUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    userType: "b2b" | "b2c" = "b2b",
  ): Promise<{ error: Error | null; needsConfirmation?: boolean }> => {
    try {
      localStorage.removeItem("weavecarbonDemoUser");
      // Use auth email with type suffix to allow same email for both B2B and B2C
      const authEmail = createAuthEmail(email, userType);

      // Try to sign up first
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            original_email: email,
          },
        },
      });

      // If user already exists with this type, return error
      if (error?.message?.includes("already registered")) {
        return {
          error: new Error(
            `You already have a ${userType === "b2c" ? "consumer" : "business"} account with this email. Please sign in instead.`,
          ),
        };
      }

      if (error) {
        return { error: new Error(getReadableErrorMessage(error)) };
      }

      if (data.user) {
        // Check if profile already exists for this user and type using maybeSingle()
        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .eq("user_type", userType)
          .maybeSingle();

        // Only create profile if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabase.from("users").insert({
            id: data.user.id,
            email,
            full_name: fullName,
            user_type: userType,
          });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            return { error: new Error(getReadableErrorMessage(profileError)) };
          }
        }
      }

      return { error: null, needsConfirmation: data.session === null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: new Error(getReadableErrorMessage(error as Error)) };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    userType: "b2b" | "b2c" = "b2b",
  ): Promise<{ error: Error | null }> => {
    try {
      localStorage.removeItem("weavecarbonDemoUser");
      // Use auth email with type suffix to login to the correct account type
      const authEmail = createAuthEmail(email, userType);

      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (error) {
        return { error: new Error(getReadableErrorMessage(error)) };
      }

      await refreshUser();
      return { error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: new Error(getReadableErrorMessage(error as Error)) };
    }
  };

  const signInWithGoogle = async (
    userType: "b2b" | "b2c" = "b2b",
  ): Promise<{ error: Error | null }> => {
    try {
      localStorage.removeItem("weavecarbonDemoUser");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=${userType}`,
        },
      });

      if (error) {
        return { error: new Error(getReadableErrorMessage(error)) };
      }
      return { error: null };
    } catch (error) {
      console.error("Google sign in error:", error);
      return { error: new Error(getReadableErrorMessage(error as Error)) };
    }
  };

  const signInAsDemo = async (
    userType: "b2b" | "b2c" = "b2b",
  ): Promise<{ error: Error | null }> => {
    try {
      const demoEmail = `demo-${userType}-${Date.now()}@weavecarbon.demo`;
      const demoPassword = "DemoPassword123!";

      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            full_name: userType === "b2c" ? "Demo Consumer" : "Demo Business",
            user_type: userType,
          },
        },
      });

      if (signUpError) {
        return { error: new Error(getReadableErrorMessage(signUpError)) };
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

      if (signInError) {
        return { error: new Error(getReadableErrorMessage(signInError)) };
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          email: demoEmail,
          full_name: userType === "b2c" ? "Demo Consumer" : "Demo Business",
          user_type: userType,
          is_demo_user: true,
        });

        if (profileError) {
          return { error: new Error(getReadableErrorMessage(profileError)) };
        }
      }

      localStorage.setItem("weavecarbonDemoUser", "true");

      await refreshUser();
      return { error: null };
    } catch (error) {
      console.error("Demo sign in error:", error);
      return { error: new Error(getReadableErrorMessage(error as Error)) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      localStorage.removeItem("weavecarbonDemoUser");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
