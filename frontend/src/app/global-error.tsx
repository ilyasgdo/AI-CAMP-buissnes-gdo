"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen grid place-items-center p-6">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold">Une erreur est survenue</h2>
            <p className="text-sm text-neutral-600 mt-2">{error.message}</p>
            <button
              onClick={reset}
              className="mt-4 inline-flex h-9 px-3 items-center justify-center rounded-md border transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}