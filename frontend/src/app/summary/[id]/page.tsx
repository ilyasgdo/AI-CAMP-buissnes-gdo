import { Api } from "@/lib/api";

export default async function SummaryPage({ params }: { params: { id: string } }) {
  const course = await Api.getCourse(params.id);
  const summary = course.summary ?? {};
  const skills = Array.isArray((summary as any)?.skills_gained) ? (summary as any).skills_gained as string[] : [];
  const certificate = (summary as any)?.certificate_text as string | undefined;
  const profile = (summary as any)?.profile as any | undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Résumé du parcours — {course.title}</h1>
        {skills.length > 0 && (
          <p className="text-sm text-neutral-600 mt-1">Compétences acquises: {skills.join(", ")}</p>
        )}
      </header>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="font-medium mb-2">Résumé</h2>
        {summary ? (
          <pre className="text-sm whitespace-pre-wrap text-neutral-800">{JSON.stringify(summary, null, 2)}</pre>
        ) : (
          <p className="text-sm text-neutral-600">Aucun résumé disponible pour ce parcours.</p>
        )}
      </section>

      {certificate && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium mb-2">Texte de certificat</h2>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap">{certificate}</p>
        </section>
      )}

      {profile && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium mb-2">Profil synthétisé</h2>
          <pre className="text-xs glass-card p-3 rounded-md overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
        </section>
      )}

      <div className="flex gap-3">
        <a href={`/course/${course.id}`} className="inline-flex h-9 px-3 items-center justify-center rounded-md border transition-transform duration-300 hover:-translate-y-0.5">Retour au parcours</a>
      </div>
    </div>
  );
}