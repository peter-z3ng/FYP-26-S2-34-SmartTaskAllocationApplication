export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="flex justify-end px-6 py-4">
        <a
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background"
        >
          Log in
        </a>
      </header>
    </main>
  );
}
