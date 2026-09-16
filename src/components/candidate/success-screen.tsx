import { CheckCircle2 } from "lucide-react";

export function SuccessScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-9 text-primary" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Application Submitted Successfully
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Thank you for applying. We&apos;ve received your application and resume, and our
        team will review it shortly. There&apos;s nothing else you need to do right now.
      </p>
    </div>
  );
}
