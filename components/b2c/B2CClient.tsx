"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import PermissionDialog from "@/components/ui/PermissionDialog";
import B2CHeader from "./B2CHeader";
import B2CWelcome from "./B2CWelcome";
import B2CQuickActions from "./B2CQuickActions";
import B2CStatsGrid from "./B2CStatsGrid";
import B2CDonateCard from "./B2CDonateCard";
import B2CRecentActivity from "./B2CRecentActivity";
import B2CImagePreview from "./B2CImagePreview";
import { toast } from "sonner";

const B2CClient: React.FC = () => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { profile, isLoaded: profileLoaded } = useUserProfile(user?.email);
  const { activities, isLoaded: activitiesLoaded } = useRecentActivity(
    user?.email
  );

  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth?type=b2c");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleCameraClick = () => {
    if (hasCameraPermission) {
      toast.info("Camera workflow will be enabled after API integration.");
    } else {
      setShowCameraPermission(true);
    }
  };

  const handleLocationClick = () => {
    if (hasLocationPermission) {
      toast.info("Location workflow will be enabled after API integration.");
    } else {
      setShowLocationPermission(true);
    }
  };

  const handleCameraPermissionAllow = () => {
    setShowCameraPermission(false);
    setHasCameraPermission(true);
  };

  const handleLocationPermissionAllow = () => {
    setShowLocationPermission(false);
    setHasLocationPermission(true);
  };

  if (loading || !profileLoaded || !activitiesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <B2CHeader
        profile={profile}
        onSignOut={handleSignOut}
        onNavigateBack={() => router.back()}
        onNavigateHome={() => router.push("/")}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <B2CWelcome profile={profile} />

        {/* Quick Actions - Camera & Scan */}
        <B2CQuickActions
          onCameraClick={handleCameraClick}
          onLocationClick={handleLocationClick}
        />

        {/* Stats Grid */}
        <B2CStatsGrid profile={profile} />

        {/* Donate Action */}
        <B2CDonateCard onStartDonate={handleCameraClick} />

        {/* Recent Activity */}
        <B2CRecentActivity activities={activities} />

        {/* Captured Image Preview */}
        {capturedImage && (
          <B2CImagePreview
            imageData={capturedImage}
            onRetake={() => setCapturedImage(null)}
            onContinue={() => {
              setCapturedImage(null);
              toast.success("Image captured successfully.");
            }}
          />
        )}
      </main>

      {/* Permission Dialogs */}
      <PermissionDialog
        open={showCameraPermission}
        onOpenChange={setShowCameraPermission}
        type="camera"
        onAllow={handleCameraPermissionAllow}
        onDeny={() => setShowCameraPermission(false)}
      />

      <PermissionDialog
        open={showLocationPermission}
        onOpenChange={setShowLocationPermission}
        type="location"
        onAllow={handleLocationPermissionAllow}
        onDeny={() => setShowLocationPermission(false)}
      />
    </div>
  );
};

export default B2CClient;
