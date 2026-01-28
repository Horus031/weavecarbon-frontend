import React from "react";
import { Leaf, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  userType?: "b2b" | "b2c" | null;
}

export default function AuthLayout({ children, userType }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex flex-col p-4">
      {/* Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
        >
          <Home className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                WEAVE<span className="text-primary">CARBON</span>
              </span>
            </Link>
            <p className="mt-2 text-muted-foreground">
              {userType === "b2c"
                ? "Contribute to circular economy"
                : "Carbon Tracking for Fashion Businesses"}
            </p>
          </div>

          {children}

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing in, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
