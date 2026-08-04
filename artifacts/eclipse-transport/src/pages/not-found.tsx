import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[60vh]">
        <h1 className="text-9xl font-bold text-primary mb-6">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Destination Not Found
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you are looking for has been moved or no longer exists.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
