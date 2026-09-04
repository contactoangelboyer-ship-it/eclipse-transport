import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import eclipseLogoBranded from "@assets/eclipse-logo-branded.png";

interface NavbarProps {
  hideLogo?: boolean;
}

export function Navbar({ hideLogo = false }: NavbarProps) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fleetHover, setFleetHover] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/fleet", label: "Fleet", isDropdown: true },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out flex justify-center",
          isScrolled ? "pt-3" : "pt-4"
        )}
      >
        <div 
          className={cn(
            "flex items-center justify-between transition-all duration-500",
            isScrolled 
              ? "w-[95%] md:w-[90%] max-w-6xl bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-2 px-6 rounded-full border border-white/50" 
              : "w-full px-6 lg:px-16 xl:px-28 py-3 bg-[#0A0A0A]"
          )}
        >
          {!hideLogo ? (
            <Link href="/" className="flex items-center gap-3 group">
              {isScrolled ? (
                /* Light navbar: text-based logo so the dark logo bg doesn't show */
                <span className="flex flex-col leading-none group-hover:opacity-80 transition-opacity">
                  <span className="text-[13px] font-black uppercase tracking-[0.22em] text-[#1A1A1A]">Eclipse</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#1A1A1A]/50 mt-0.5">Transport</span>
                </span>
              ) : (
                /* Dark navbar: show branded logo — black bg blends with #0A0A0A */
                <img
                  src={eclipseLogoBranded}
                  alt="Eclipse Transport"
                  className="h-[5rem] md:h-[6rem] w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              )}
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 text-[#1A1A1A] hover:text-black transition-colors">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 hover:opacity-100">
                ← Eclipse Transport
              </span>
            </Link>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 relative">
            {links.map((link) => (
              <div 
                key={link.href}
                className="relative h-full flex items-center group/link"
                onMouseEnter={() => link.isDropdown && setFleetHover(true)}
                onMouseLeave={() => link.isDropdown && setFleetHover(false)}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.2em] transition-colors py-2 flex items-center gap-1.5",
                    location === link.href
                      ? (isScrolled ? "text-[#1A1A1A]" : "text-white")
                      : (isScrolled ? "text-[#1A1A1A]/70 hover:text-[#1A1A1A]" : "text-white/70 hover:text-white")
                  )}
                >
                  {link.label}
                  {link.isDropdown && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                </Link>
                
                {/* Hover underline effect */}
                <span className={cn(
                  "absolute -bottom-1 left-0 w-full h-[1.5px] transform origin-left transition-transform duration-300",
                  isScrolled ? "bg-[#1A1A1A]" : "bg-white",
                  location === link.href ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"
                )} />

                {/* Fleet Mega Dropdown */}
                {link.isDropdown && (
                  <AnimatePresence>
                    {fleetHover && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-[480px] bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-black/5 p-8 grid grid-cols-2 gap-10"
                      >
                        <div>
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-5 font-bold">SUVs</h4>
                          <ul className="space-y-4">
                            <li>
                              <Link href="/fleet" className="block text-sm font-semibold text-[#1A1A1A] hover:text-black/60 transition-colors group/item">
                                The Suburban
                                <span className="block text-xs font-medium text-[#1A1A1A]/50 mt-1 group-hover/item:text-[#1A1A1A]/40 transition-colors">Chevrolet Suburban S</span>
                              </Link>
                            </li>
                            <li>
                              <Link href="/fleet" className="block text-sm font-semibold text-[#1A1A1A] hover:text-black/60 transition-colors group/item">
                                Escalade
                                <span className="block text-xs font-medium text-[#1A1A1A]/50 mt-1 group-hover/item:text-[#1A1A1A]/40 transition-colors">Cadillac Escalade ESV</span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#1A1A1A]/40 mb-5 font-bold">Sedans</h4>
                          <ul className="space-y-4">
                            <li>
                              <Link href="/fleet" className="block text-sm font-semibold text-[#1A1A1A] hover:text-black/60 transition-colors group/item">
                                Executive Sedan
                                <span className="block text-xs font-medium text-[#1A1A1A]/50 mt-1 group-hover/item:text-[#1A1A1A]/40 transition-colors">Lincoln Continental</span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
            <Link
              href="/book"
              className="ml-2 h-11 px-8 inline-flex items-center justify-center bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              Book Now
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            className={cn(
              "md:hidden p-2 z-[60] rounded-lg transition-colors",
              isScrolled ? "text-[#1A1A1A]" : "text-white hover:bg-white/10"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-[100dvh] w-[80%] max-w-xs bg-[#0A0A0A] shadow-2xl z-[60] flex flex-col md:hidden overflow-y-auto"
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <img src={eclipseLogoBranded} alt="Eclipse Transport" className="h-20 w-auto object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 px-6 pt-8 pb-6 flex flex-col gap-1">
                {links.map((link) => (
                  <div key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => !link.isDropdown && setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between py-4 text-base font-semibold border-b border-white/10 transition-colors",
                        location === link.href ? "text-white" : "text-white/60 hover:text-white"
                      )}
                    >
                      <span>{link.label}</span>
                      {link.isDropdown && <ChevronDown className="w-4 h-4 opacity-40" />}
                    </Link>
                    
                    {link.isDropdown && (
                      <div className="pl-4 pt-3 pb-2 flex flex-col gap-4">
                        <div className="flex flex-col gap-3">
                          <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">SUVs</p>
                          <Link href="/fleet" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            The Suburban <span className="text-white/30 text-xs ml-1">Chevrolet Suburban</span>
                          </Link>
                          <Link href="/fleet" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Escalade <span className="text-white/30 text-xs ml-1">Cadillac Escalade ESV</span>
                          </Link>
                        </div>
                        <div className="flex flex-col gap-3">
                          <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">Sedans</p>
                          <Link href="/fleet" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Executive Sedan <span className="text-white/30 text-xs ml-1">Lincoln Continental</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="px-6 pb-8">
                <Link
                  href="/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-14 flex items-center justify-center bg-white text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg active:scale-95 transition-transform"
                >
                  Book Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
