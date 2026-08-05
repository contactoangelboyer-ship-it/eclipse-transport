import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  hideLogo?: boolean;
}

export function Layout({ children, hideLogo = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar hideLogo={hideLogo} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
