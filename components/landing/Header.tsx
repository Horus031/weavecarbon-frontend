"use client";

import { motion } from "motion/react";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import UserTypeDialog from "./UserTypeDialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserTypeDialog, setShowUserTypeDialog] = useState(false);

  const navLinks = [
    { labelKey: "Features", href: "#features" },
    { labelKey: "How It Works", href: "#how-it-works" },
    { labelKey: "Impact", href: "#impact" },
    { labelKey: "Calculator", href: "/calculator" },
    { labelKey: "Contact", href: "#contact" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{
          y: [null, null, 0],
          transition: { duration: 1.5, times: [0, 0.5, 1] },
        }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-forest flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-semibold text-foreground">
                WeaveCarbon
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.labelKey}
                  </Link>
                ) : (
                  <a
                    key={link.labelKey}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.labelKey}
                  </a>
                ),
              )}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserTypeDialog(true)}
              >
                Log In
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowUserTypeDialog(true)}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-b border-border animate-fade-in">
            <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.labelKey}
                  </Link>
                ) : (
                  <a
                    key={link.labelKey}
                    href={link.href}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.labelKey}
                  </a>
                ),
              )}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowUserTypeDialog(true);
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="hero"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowUserTypeDialog(true);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </motion.header>

      {/* User Type Selection Dialog */}
      <UserTypeDialog
        open={showUserTypeDialog}
        onOpenChange={setShowUserTypeDialog}
      />
    </>
  );
};

export default Header;
