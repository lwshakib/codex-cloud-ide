"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import {
  Github,
  Linkedin,
  Twitter,
  Moon,
  Sun,
  ArrowDownLeft,
  MessageCircle,
} from "lucide-react";
import { Logo } from "./logo";

const data = () => ({
  navigation: {
    product: [
      { name: "Features", href: "#features" },
      { name: "Workspaces", href: "#" },
      { name: "Templates", href: "#" },
      { name: "Pricing", href: "#pricing" },
    ],
    developers: [
      { name: "Documentation", href: "#" },
      { name: "API Reference", href: "#" },
      { name: "Guides & Tutorials", href: "#" },
      { name: "Examples", href: "#" },
    ],
    resources: [
      { name: "Community", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Changelog", href: "#" },
      { name: "Support", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  },
  socialLinks: [
    { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
    { icon: Github, label: "GitHub", href: "https://github.com" },
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
  ],
  bottomLinks: [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Cookie Policy" },
  ],
});

export default function FooterSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentYear = new Date().getFullYear();

  if (!mounted) return null;

  return (
    <footer className="mt-20 w-full">
      <div className="relative w-full px-5">
        <div className="container m-auto grid grid-cols-1 gap-12 py-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo />
            </Link>
            <p className="text-muted-foreground max-w-md">
              The ultimate AI-powered coding platform. Build, preview, and
              deploy full-stack applications directly in your browser.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {data().socialLinks.map(({ icon: Icon, label, href }) => (
                  <Button
                    key={label}
                    size="icon"
                    variant="outline"
                    asChild
                    className="hover:bg-primary dark:hover:bg-primary border-primary/30 hover:border-primary cursor-pointer shadow-none transition-all duration-500 hover:scale-110 hover:-rotate-12 hover:text-white hover:shadow-md"
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-primary dark:hover:bg-primary border-primary/30 hover:border-primary cursor-pointer shadow-none transition-all duration-1000 hover:scale-110 hover:-rotate-12 hover:text-white hover:shadow-md"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="w-full max-w-md space-y-3"
            >
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Stay updated with Codex
              </label>
              <div className="relative w-full">
                <Input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="h-12 w-full pr-32"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute top-1.5 right-1.5 cursor-pointer transition-all duration-1000 hover:px-8"
                >
                  Subscribe
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Get tips, tutorials, and platform updates delivered to your
                inbox.
              </p>
            </form>
            <h1 className="from-muted-foreground/15 bg-gradient-to-b bg-clip-text text-5xl font-extrabold text-transparent lg:text-7xl">
              Codex
            </h1>
          </div>

          <div className="grid w-full grid-cols-2 items-start justify-between gap-8 px-5 lg:col-span-3">
            {(["product", "developers", "resources", "legal"] as const).map(
              (section) => (
                <div key={section} className="w-full">
                  <h3 className="border-primary mb-4 -ml-5 border-l-2 pl-5 text-sm font-semibold tracking-wider uppercase text-foreground">
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </h3>
                  <ul className="space-y-3">
                    {data().navigation[section].map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="group text-muted-foreground hover:text-foreground decoration-primary -ml-5 inline-flex items-center gap-2 underline-offset-8 transition-all duration-500 hover:pl-5 hover:underline"
                        >
                          <ArrowDownLeft className="text-primary rotate-[225deg] opacity-30 transition-all duration-500 group-hover:scale-150 group-hover:opacity-100" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>

        <div className="text-muted-foreground container m-auto flex flex-col items-center justify-between gap-4 p-4 text-xs md:flex-row md:px-0 md:text-sm border-t border-border/50">
          <p>
            &copy; {currentYear} Codex Cloud IDE. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {data().bottomLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <span className="from-primary/10 absolute inset-x-0 bottom-0 left-0 -z-10 h-1/3 w-full bg-gradient-to-t" />
      </div>
    </footer>
  );
}
