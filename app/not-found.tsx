// Neutral, brand-free page returned (HTTP 404) for an unknown host or a tenant
// that has been taken offline. It reveals nothing about any business.
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-center">
      <div>
        <div className="mx-auto mb-6 inline-block h-3 w-3 rotate-45 bg-neutral-600" />
        <h1 className="text-xl font-semibold text-neutral-100">
          This preview isn&rsquo;t available
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          It may have been taken offline, or this address isn&rsquo;t a live
          demonstration.
        </p>
        <a
          href="https://grindctrl.cloud"
          className="mt-6 inline-block text-sm text-neutral-300 underline underline-offset-4 hover:text-white"
        >
          grindctrl.cloud
        </a>
      </div>
    </main>
  );
}
