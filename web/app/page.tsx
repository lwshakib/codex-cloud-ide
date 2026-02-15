"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Zap,
  Globe,
  Terminal,
  Sparkles,
  Shield,
  Clock,
  Rocket,
  FileCode2,
  PlayCircle,
  GitBranch,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, Variants } from "framer-motion";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import SimplePricing from "@/components/pricing";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Code2,
    title: "AI-Powered Code Editor",
    description:
      "Write code faster with intelligent AI completions and suggestions powered by advanced LLMs.",
  },
  {
    icon: Terminal,
    title: "IDE Experience",
    description:
      "A full-featured cloud IDE environment accessible directly from your browser.",
  },
  {
    icon: Globe,
    title: "Cloud Infrastructure",
    description:
      "Develop and preview your applications in a managed cloud environment.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Experience blazing-fast development with optimized build times and instant setup.",
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    description:
      "Seamlessly manage your code with integrated Git version control supports.",
  },
  {
    icon: Boxes,
    title: "Multiple Frameworks",
    description:
      "Support for React, Next.js, Vite, and more - choose your favorite stack.",
  },
];

const stats = [
  { label: "Active Developers", value: "10K+", icon: Code2 },
  { label: "Projects Created", value: "50K+", icon: FileCode2 },
  { label: "Lines of Code", value: "500M+", icon: Terminal },
  { label: "Uptime", value: "99.9%", icon: Shield },
];

const useCases = [
  {
    title: "Rapid Prototyping",
    description:
      "Turn your ideas into working prototypes in minutes. Perfect for hackathons and quick MVPs.",
    icon: Rocket,
  },
  {
    title: "Learning & Education",
    description:
      "The perfect environment for learning web development with AI-assisted coding and instant feedback.",
    icon: Sparkles,
  },
  {
    title: "Professional Development",
    description:
      "Build production-ready applications with enterprise-grade tools and seamless collaboration.",
    icon: Shield,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  // No redirect on home page for the landing page
  // But we can check if session exists to change CTA

  return (
    <div className="min-h-screen w-full overflow-hidden bg-background">
      <HeroHeader />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-30" />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] opacity-20" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block"
            >
              <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Sparkles className="w-4 h-4 mr-2 inline-block" />
                AI-Powered Cloud IDE
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Code, Build & Sync
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Everywhere with Codex
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              The ultimate AI-powered cloud development platform. Write, collaborate, and
              sync full-stack web applications seamlessly across all your devices.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="text-base px-8 py-6 rounded-full shadow-lg hover:shadow-primary/20 transition-all font-semibold"
              >
                <Link href={session ? "/workspaces" : "/sign-up"}>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  {session ? "Enter Workspaces" : "Get Started for Free"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 rounded-full font-medium"
              >
                <Link href="#features">
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* App Preview Image Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-20 relative max-w-5xl mx-auto"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 opacity-30" />
              <div className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10 bg-muted/20 backdrop-blur-sm p-4">
                 <div className="aspect-video w-full rounded-2xl bg-zinc-900 flex items-center justify-center overflow-hidden border border-border/50">
                    <div className="flex flex-col items-center gap-4 text-zinc-500">
                        <Code2 size={64} className="opacity-20 translate-y-4" />
                        <p className="font-medium text-lg tracking-wider opacity-30">CODEX CLOUD IDE PREVIEW</p>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-primary mr-2" />
                    <div className="text-3xl md:text-4xl font-bold text-foreground">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-4 h-4 mr-2 inline-block" />
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Everything You Need to Build Amazing Apps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make development faster, smarter,
              and more enjoyable.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Clock className="w-4 h-4 mr-2 inline-block" />
              Use Cases
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Built for Every Developer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're a beginner or a professional, Codex has you covered.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {useCases.map((useCase, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-border/50 bg-gradient-to-b from-card to-muted/30 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <useCase.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground">{useCase.title}</h3>
                    <p className="text-muted-foreground text-lg">
                      {useCase.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-transparent text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Ready to Start Building?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of developers building the future with Codex.
              <br />
              No credit card required. Start coding in seconds.
            </p>
            <Button
              asChild
              size="lg"
              className="text-base px-10 py-6 rounded-full shadow-lg hover:shadow-primary/20 transition-all font-semibold"
            >
              <Link href={session ? "/workspaces" : "/sign-up"}>
                <Rocket className="w-5 h-5 mr-2" />
                {session ? "Enter Your Dashboard" : "Create Your First Workspace"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <SimplePricing />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
