import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className,
}) => {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words [overflow-wrap:anywhere] [word-break:break-word] overflow-x-hidden prose-pre:whitespace-pre-wrap prose-pre:break-words prose-pre:bg-muted/50 prose-pre:[overflow-wrap:anywhere] prose-code:break-words prose-code:whitespace-pre-wrap",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
