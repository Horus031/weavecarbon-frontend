import Footer from "@/components/landing/Footer";
import HomeClient from "../components/ui/HomeClient";
import Header from "@/components/landing/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";

export default function Home() {
  return (
    <AuthProvider>
      <HomeClient>
        <Header />
        <main className="relative">
          <Hero />
          <Features />
          <HowItWorks />
          <Stats />
          <CTA />
        </main>
        <Footer />
      </HomeClient>
    </AuthProvider>
  );
}
