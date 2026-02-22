import Footer from "@/components/landing/Footer";
import HomeClient from "../components/ui/HomeClient";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import CTA from "@/components/landing/CTA";


export default function Home() {
  return (
    <HomeClient>
      <Header />
      <main>
        
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </HomeClient>);

}