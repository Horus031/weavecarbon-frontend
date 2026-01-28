/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  circularPoints: number;
  garmentsDonated: number;
  co2Saved: number;
  treesEquivalent: number;
}

const PROFILES_KEY = "weavecarbon_user_profiles";
const CURRENT_USER_KEY = "weavecarbon_current_user";

export const useUserProfile = (userEmail?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const currentEmail =
          userEmail || localStorage.getItem(CURRENT_USER_KEY);
        if (!currentEmail) return;

        const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}");
        const userProfile = profiles[currentEmail];

        if (userProfile) {
          setProfile(userProfile);
        } else {
          // Create default profile if not exists
          const newProfile: UserProfile = {
            id: `user-${Date.now()}`,
            email: currentEmail,
            fullName: currentEmail.split("@")[0],
            circularPoints: 1250,
            garmentsDonated: 15,
            co2Saved: 45.5,
            treesEquivalent: 3,
          };
          profiles[currentEmail] = newProfile;
          localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
      setIsLoaded(true);
    }
  }, [userEmail]);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (typeof window !== "undefined" && profile) {
        try {
          const profiles = JSON.parse(
            localStorage.getItem(PROFILES_KEY) || "{}",
          );
          const updated = { ...profile, ...updates };
          profiles[profile.email] = updated;
          localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
          setProfile(updated);
          return updated;
        } catch (error) {
          console.error("Error updating profile:", error);
        }
      }
      return profile;
    },
    [profile],
  );

  const addPoints = useCallback(
    (points: number) => {
      if (profile) {
        return updateProfile({
          circularPoints: profile.circularPoints + points,
        });
      }
      return null;
    },
    [profile, updateProfile],
  );

  return {
    profile,
    isLoaded,
    updateProfile,
    addPoints,
  };
};
