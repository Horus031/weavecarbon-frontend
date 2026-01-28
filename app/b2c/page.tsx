import React from "react";
import { Suspense } from "react";
import B2CClient from "@/components/b2c/B2CClient";
import { AuthProvider } from "@/contexts/AuthContext";

const B2CPage: React.FC = () => {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <B2CClient />
      </Suspense>
    </AuthProvider>
  );
};

export default B2CPage;
