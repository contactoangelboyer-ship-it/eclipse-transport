import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col pt-[88px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
