import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-6">
        <h1 className="text-8xl font-light text-muted-foreground mb-6">404</h1>
        <h2 className="text-2xl font-light mb-8">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-10">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="inline-flex h-12 items-center justify-center bg-foreground text-background px-10 text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors">
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
