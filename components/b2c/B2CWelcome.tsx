"use client";

import React from "react";
import { UserProfile } from "@/hooks/useUserProfile";

interface B2CWelcomeProps {
  profile: UserProfile | null;
}

const B2CWelcome: React.FC<B2CWelcomeProps> = ({ profile }) => {
  return (
    <div className="text-center py-4">
      <h1 className="text-2xl font-display font-bold mb-2">
        Hello, {profile?.fullName || "User"}! 👋
      </h1>
      <p className="text-muted-foreground">
        Thank you for contributing to the circular economy
      </p>
    </div>
  );
};

export default B2CWelcome;
