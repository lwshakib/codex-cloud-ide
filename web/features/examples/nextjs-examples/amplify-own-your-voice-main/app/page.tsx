import FeaturesSection from "@/components/features-section";
import HeroSection from "@/components/hero-section";
import SimplePricing from "@/components/pricing";
import FooterSection from "@/components/footer";
import Image from "next/image";


export default function Home() {
  return (
    <main className="min-h-screen w-full selection:bg-primary selection:text-primary-foreground">
      <HeroSection />
      <div className="max-w-7xl mx-auto">
        <FeaturesSection />
        <SimplePricing />
      </div>
      <FooterSection/>
    </main>
  );
}
