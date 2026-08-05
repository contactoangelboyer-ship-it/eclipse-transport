import { Link } from "wouter";
import eclipseLogo from "@assets/eclipse-logo-branded.png";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-20 mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Column 1: Brand */}
          <div className="lg:pr-8">
            <Link href="/" className="inline-block mb-6 group" data-testid="link-footer-home">
              <img 
                src={eclipseLogo} 
                alt="Eclipse Transport" 
                className="h-14 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
              />
            </Link>
            <p className="text-white/60 mb-8 text-sm leading-relaxed font-light">
              Precision ground transportation for those who demand reliability and quiet elegance. The silent, unhurried presence that appears at your door.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors" data-testid="link-social-instagram">
                <SiInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors" data-testid="link-social-facebook">
                <SiFacebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors" data-testid="link-social-twitter">
                <SiX className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Column 2: Services */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-white/40">Services</h4>
            <ul className="space-y-4 text-sm font-light text-white/70">
              <li><Link href="/services" className="hover:text-white transition-colors inline-block" data-testid="link-footer-service-airport">Airport Transfer</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors inline-block" data-testid="link-footer-service-corporate">Corporate Travel</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors inline-block" data-testid="link-footer-service-hourly">By the Hour</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors inline-block" data-testid="link-footer-service-events">Special Events</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors inline-block" data-testid="link-footer-service-ptp">Point-to-Point</Link></li>
            </ul>
          </div>
          
          {/* Column 3: Company */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-white/40">Company</h4>
            <ul className="space-y-4 text-sm font-light text-white/70">
              <li><Link href="/fleet" className="hover:text-white transition-colors inline-block" data-testid="link-footer-fleet">Our Fleet</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors inline-block" data-testid="link-footer-contact">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors inline-block" data-testid="link-footer-privacy">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors inline-block" data-testid="link-footer-terms">Terms of Service</Link></li>
            </ul>
          </div>
          
          {/* Column 4: Contact Info */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-white/40">Connect</h4>
            <ul className="space-y-5 text-sm font-light text-white/70">
              <li>
                <a href="tel:6269774721" className="hover:text-white transition-colors group flex flex-col gap-1" data-testid="link-footer-phone">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold group-hover:text-white/60">Phone</span>
                  <span className="text-lg">(626) 977-4721</span>
                </a>
              </li>
              <li>
                <a href="mailto:Eclipsetransport995@gmail.com" className="hover:text-white transition-colors group flex flex-col gap-1" data-testid="link-footer-email">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold group-hover:text-white/60">Email</span>
                  <span>Eclipsetransport995@gmail.com</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/16269774721" target="_blank" rel="noreferrer" className="hover:text-[#25D366] transition-colors group flex flex-col gap-1" data-testid="link-footer-whatsapp">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold group-hover:text-white/60">WhatsApp</span>
                  <span>Message Dispatch</span>
                </a>
              </li>
              <li className="pt-2">
                <span className="block text-white">Los Angeles, CA</span>
                <span className="block text-white/50 mt-1">Available 24/7</span>
              </li>
            </ul>
          </div>
          
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] font-medium tracking-wide text-white/40">
          <p>&copy; {new Date().getFullYear()} Eclipse Transport. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex flex-wrap justify-center gap-4 md:gap-6 uppercase tracking-[0.1em]">
            <span>Licensed & Insured</span>
            <span className="hidden md:inline">•</span>
            <span>DOT Compliant</span>
            <span className="hidden md:inline">•</span>
            <span>CA PUC Licensed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
