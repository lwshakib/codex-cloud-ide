import { AppType } from "@/hooks/use-workspace-store";

export interface WorkspaceAppTemplate {
  type: AppType;
  label: string;
  description: string;
  logo: string;
  folder: string;
  category: "frontend" | "backend" | "fullstack" | "mobile";
  framework: string;
  logoStyling?: string;
}

export const WORKSPACE_REGISTRY: WorkspaceAppTemplate[] = [
  {
    type: AppType.VITE_APP,
    label: "Vite - React",
    description: "Vite + React with TypeScript and Tailwind CSS.",
    logo: "/logos/react.svg",
    folder: "vite-app",
    category: "frontend",
    framework: "React",
  },
  {
    type: AppType.NEXT_APP,
    label: "Next.js",
    description: "The React Framework for the Web with App Router.",
    logo: "/logos/nextjs.svg",
    folder: "next-app",
    category: "fullstack",
    framework: "Next.js",
    logoStyling: "rounded-full bg-white p-1",
  },
  {
    type: AppType.EXPRESS_APP,
    label: "Express",
    description: "Fast, unopinionated, minimalist web framework for Node.js.",
    logo: "/logos/express.svg",
    folder: "express-app",
    category: "backend",
    framework: "Express",
    logoStyling: "bg-white p-1 rounded-md",
  },
  {
    type: AppType.EXPO_APP,
    label: "Expo - Mobile",
    description: "Build cross-platform mobile apps with React Native and Expo.",
    logo: "/logos/react-native.svg",
    folder: "expo-app",
    category: "mobile",
    framework: "Expo",
    logoStyling: "bg-white p-1 rounded-md",
  },
];

export function getTemplateByType(
  type: AppType
): WorkspaceAppTemplate | undefined {
  return WORKSPACE_REGISTRY.find((template) => template.type === type);
}
