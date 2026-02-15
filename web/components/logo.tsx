import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2 text-foreground", className)}>
      <LogoIcon />
      <span className="text-xl font-bold tracking-tight">Codex</span>
    </div>
  );
};

export const LogoIcon = ({ className, size = 32 }: { className?: string, size?: number }) => {
  return (
    <svg
      fill="none"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <g transform="translate(4 0)">
        <path
          d="m0 9c0-2.76142 2.23858-5 5-5h10c2.7614 0 5 2.23858 5 5v9.8192c.0002.06.0003.1203.0003.1808 0 2.7575 2.2322 4.9936 4.9881 5h.0116 10c2.7614 0 5 2.2386 5 5v10c0 2.7614-2.2386 5-5 5h-10c-2.7614 0-5-2.2386-5-5v-10c0-.0139.0001-.0277.0002-.0416-.0224-2.7422-2.2523-4.9584-4.9999-4.9584-.0129 0-.0258 0-.0387 0h-9.9616c-2.76142 0-5-2.2386-5-5z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
