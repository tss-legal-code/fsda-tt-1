"use client";

export default function ConfirmationView({
  destination,
  villa,
}: {
  destination: string;
  villa: string;
}) {
  return (
    <section className="mt-16 text-center sm:mt-24 animate-fade-in-up">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-border">
          <svg
            className="h-5 w-5 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          You&apos;re all set
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Your {villa} experience is confirmed.
          <br />
          We look forward to welcoming you.
        </p>
      </div>
    </section>
  );
}
