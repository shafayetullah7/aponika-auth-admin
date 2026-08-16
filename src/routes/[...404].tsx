import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="flex min-h-screen flex-col items-center justify-center bg-cream-50 p-4 text-center">
      <h1 class="h3">404</h1>
      <p class="mt-2 text-forest-600">Page not found.</p>
      <A href="/" class="mt-6 font-semibold text-forest-700 hover:text-forest-800">
        Back to dashboard
      </A>
    </main>
  );
}
