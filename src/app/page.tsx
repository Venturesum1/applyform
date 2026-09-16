import { ApplicationForm } from "@/components/candidate/application-form";

export default function ApplyPage() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="mb-10 space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Apply for a role with us
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill out the form below and upload your resume. It only takes a few minutes.
          </p>
        </header>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <ApplicationForm />
        </div>
      </div>
    </main>
  );
}
