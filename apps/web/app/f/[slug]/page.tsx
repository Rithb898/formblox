import { TRPCClientError } from "@trpc/client";
import { api } from "~/trpc/server";
import { FormRunner } from "./_components/form-runner";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {children}
      </div>
    </div>
  );
}

function NotYetLive() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <svg className="size-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">This form isn&apos;t live yet</p>
          <p className="text-sm text-muted-foreground">Check back later — the owner hasn&apos;t published it.</p>
        </div>
      </div>
    </PageShell>
  );
}

function NotAcceptingResponses() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <svg className="size-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">No longer accepting responses</p>
          <p className="text-sm text-muted-foreground">This form has been closed by its owner.</p>
        </div>
      </div>
    </PageShell>
  );
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const data = await api.forms.public.getBySlug({ slug });
    return (
      <PageShell>
        <FormRunner
          title={data.version.title}
          description={data.version.description}
          fields={data.fields}
        />
      </PageShell>
    );
  } catch (err) {
    if (err instanceof TRPCClientError) {
      if (err.message === "not_accepting_responses") return <NotAcceptingResponses />;
    }
    return <NotYetLive />;
  }
}
