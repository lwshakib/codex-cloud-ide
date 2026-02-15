import { SignUpForm } from "@/components/signup-form";
import { Logo } from "@/components/logo";

export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      <div className="bg-muted relative hidden lg:block border-r border-white/5">
        <img
          src="/signup-bg.png"
          alt="Sign Up Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
