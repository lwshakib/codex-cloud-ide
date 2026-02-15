"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut, User, Settings, Sparkles, LayoutGrid } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();

  const isDark = theme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full border border-border/10 p-0 hover:bg-muted/50 transition-all active:scale-95"
        >
          <Avatar className="h-8 w-8 transition-transform group-hover:scale-105">
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {session?.user?.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2 shadow-2xl rounded-2xl border-border/40 backdrop-blur-xl bg-background/95" align="end" sideOffset={10}>
        <DropdownMenuLabel className="font-normal px-2 py-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {session?.user?.name || "Account"}
            </p>
            <p className="text-[11px] leading-none text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border/10 mx-1" />
        
        <div className="py-1">
          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted font-medium text-sm transition-colors group mb-0.5"
            onClick={() => router.push("/workspaces")}
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
              <LayoutGrid className="size-4" />
            </div>
            <span className="flex-1 text-foreground">Workspaces</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted font-medium text-sm transition-colors group mb-0.5"
            onClick={() => router.push("/account")}
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
              <User className="size-4" />
            </div>
            <span className="flex-1 text-foreground">Account</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted font-medium text-sm transition-colors group"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </div>
            <span className="flex-1 text-foreground">Change Theme</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-border/10 mx-1" />

        <DropdownMenuItem
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-red-500/10 text-muted-foreground hover:text-red-500 font-medium text-sm transition-all group mt-1"
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/sign-in");
                },
              },
            });
          }}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted group-hover:bg-red-500/10 transition-colors">
            <LogOut className="size-4 group-hover:text-red-500" />
          </div>
          <span className="flex-1">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
