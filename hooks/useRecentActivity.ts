/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useState, useEffect } from "react";

export interface Activity {
  id: string;
  type: "donate" | "recycle";
  item: string;
  points: number;
  date: string;
  timestamp: number;
}

const ACTIVITIES_KEY = "weavecarbon_activities";

export const useRecentActivity = (userEmail?: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const currentEmail = userEmail;
        if (!currentEmail) return;

        const key = `${ACTIVITIES_KEY}_${currentEmail}`;
        const stored = localStorage.getItem(key);

        if (stored) {
          setActivities(JSON.parse(stored));
        } else {
          // Default activities
          const defaultActivities: Activity[] = [
            {
              id: "1",
              type: "donate",
              item: "Áo thun cotton",
              points: 50,
              date: "2 ngày trước",
              timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
            },
            {
              id: "2",
              type: "recycle",
              item: "Quần jeans",
              points: 75,
              date: "5 ngày trước",
              timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
            },
            {
              id: "3",
              type: "donate",
              item: "Áo khoác",
              points: 100,
              date: "1 tuần trước",
              timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
            },
          ];
          localStorage.setItem(key, JSON.stringify(defaultActivities));
          setActivities(defaultActivities);
        }
      } catch (error) {
        console.error("Error loading activities:", error);
      }
      setIsLoaded(true);
    }
  }, [userEmail]);

  const addActivity = useCallback(
    (activity: Omit<Activity, "id" | "timestamp">) => {
      if (typeof window !== "undefined" && userEmail) {
        try {
          const key = `${ACTIVITIES_KEY}_${userEmail}`;
          const newActivity: Activity = {
            ...activity,
            id: `activity-${Date.now()}`,
            timestamp: Date.now(),
          };

          const updated = [newActivity, ...activities].slice(0, 20); // Keep last 20
          localStorage.setItem(key, JSON.stringify(updated));
          setActivities(updated);
          return newActivity;
        } catch (error) {
          console.error("Error adding activity:", error);
        }
      }
      return null;
    },
    [userEmail, activities],
  );

  return {
    activities,
    isLoaded,
    addActivity,
  };
};
