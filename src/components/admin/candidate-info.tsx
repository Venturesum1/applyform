import type { ReactNode } from "react";
import type { ApplicationDetail } from "@/types/application";

function isSafeExternalUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function Field({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground break-words">
        {href && isSafeExternalUrl(href) ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

export function CandidateInfo({ application }: { application: ApplicationDetail }) {
  return (
    <div className="space-y-6">
      <Section title="Contact">
        <Field label="Email" value={application.email} href={`mailto:${application.email}`} />
        <Field label="Phone" value={application.phone} href={`tel:${application.phone}`} />
        <Field label="Location" value={application.currentLocation} />
        <Field label="LinkedIn" value={application.linkedinUrl} href={application.linkedinUrl} />
        <Field label="GitHub" value={application.githubUrl} href={application.githubUrl} />
        <Field label="Portfolio" value={application.portfolioUrl} href={application.portfolioUrl} />
      </Section>

      <Section title="Professional information">
        <Field label="Current role" value={application.currentJobTitle} />
        <Field label="Experience" value={application.totalExperience} />
        <Field label="Current CTC" value={application.currentCtc} />
        <Field label="Expected CTC" value={application.expectedCtc} />
        <Field label="Notice period" value={application.noticePeriod} />
        <Field label="Qualification" value={application.highestQualification} />
      </Section>

      <Section title="Technical information">
        <Field label="Skills" value={application.primarySkills} />
        <Field label="Programming languages" value={application.programmingLanguages} />
        <Field label="ML / AI experience" value={application.mlAiExperience} />
        <Field label="Computer vision experience" value={application.computerVisionExperience} />
        <Field label="Projects" value={application.relevantProjects} />
      </Section>

      {application.coverLetter && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Cover Letter</h2>
          <p className="whitespace-pre-wrap text-sm text-foreground">{application.coverLetter}</p>
        </div>
      )}
    </div>
  );
}
