export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Proposal not found
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This proposal is no longer available.
          <br />
          Please contact your concierge for assistance.
        </p>
      </div>
    </main>
  );
}
