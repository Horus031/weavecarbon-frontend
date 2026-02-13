/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "@/app/loading";
import LeafHero3D from "../landing/LeafHero3D";

export default function HomeClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if user has already seen loading screen in this session
    const hasSeenLoading = sessionStorage.getItem("hasSeenLoading");
    if (hasSeenLoading) {
      setIsLoading(false);
      setShowContent(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem("hasSeenLoading", "true");
    setIsLoading(false);
    setTimeout(() => setShowContent(true), 100);
  };

  return (
    <>
      {isLoading && (
        <LoadingScreen onComplete={handleLoadingComplete} minDuration={2500} />
      )}

      <div
        className={`min-h-screen relative bg-background overflow-hidden transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"}`}
      >
        {children}
      </div>
    </>
  );
}
