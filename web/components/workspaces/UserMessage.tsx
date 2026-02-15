import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MarkdownContent from "./MarkdownContent";

interface UserMessageProps {
  content: string;
  user?: {
    name: string;
    image?: string | null;
  } | null;
}

const UserMessage: React.FC<UserMessageProps> = ({ content, user }) => {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex justify-end mb-6 group animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-start gap-4 max-w-[85%]">
        <div className="flex flex-col items-end flex-1 min-w-0">
          <div className="bg-primary/10 text-foreground border border-primary/20 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 break-words max-w-full overflow-hidden">
            <MarkdownContent
              content={content}
              className="text-sm leading-relaxed"
            />
          </div>
        </div>
        <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/20 shadow-sm">
          {user?.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default UserMessage;
