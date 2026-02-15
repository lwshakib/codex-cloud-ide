import { File as FileIcon, FileJson, FileCode, FileText, Image, Type } from "lucide-react";
import React from "react";

export const getFileIcon = (filename: string, isFolder?: boolean) => {
  if (isFolder) return null;

  const ext = filename.split(".").pop()?.toLowerCase();
  
  const FileType = FileCode; // for html

  const iconMap: Record<string, { icon: any, color: string }> = {
    "ts": { icon: FileCode, color: "text-blue-400" },
    "tsx": { icon: FileCode, color: "text-blue-500" },
    "js": { icon: FileCode, color: "text-yellow-400" },
    "jsx": { icon: FileCode, color: "text-yellow-500" },
    "json": { icon: FileJson, color: "text-yellow-600" },
    "md": { icon: FileText, color: "text-blue-300" },
    "css": { icon: FileCode, color: "text-blue-600" },
    "html": { icon: FileType, color: "text-orange-500" },
    "svg": { icon: Image, color: "text-orange-400" },
    "png": { icon: Image, color: "text-green-400" },
    "jpg": { icon: Image, color: "text-green-400" },
    "jpeg": { icon: Image, color: "text-green-400" },
    "gif": { icon: Image, color: "text-green-400" },
    "pdf": { icon: FileText, color: "text-red-500" },
    "gitignore": { icon: FileCode, color: "text-gray-500" },
    "yml": { icon: FileText, color: "text-purple-400" },
    "yaml": { icon: FileText, color: "text-purple-400" },
  };

  let Icon = FileIcon;
  let color = "text-muted-foreground";

  if (filename.toLowerCase() === "package.json") {
    Icon = FileJson;
    color = "text-red-400";
  } else if (ext && iconMap[ext]) {
    Icon = iconMap[ext].icon;
    color = iconMap[ext].color;
  }

  return <Icon className={`w-4 h-4 shrink-0 ${color}`} />;
};
