import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="md:col-span-1">
            <span className="text-xl font-bold tracking-widest text-foreground uppercase block mb-4">
              Eclipse
            </span>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              The silent, unhurried presence that appears at your door. Luxury private ground transportation serving Los Angeles and surrounding areas.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm mb-4">Services</h4>
            <ul className="space-y-3">
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Airport Transfers</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Corporate Travel</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Weddings & Events</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors text-sm">By the Hour</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/fleet" className="text-muted-foreground hover:text-primary transition-colors text-sm">Our Fleet</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Us</Link></li>
              <li><Link href="/book" className="text-muted-foreground hover:text-primary transition-colors text-sm">Book a Ride</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Call or Text: <a href="tel:6263913844" className="text-foreground hover:text-primary transition-colors font-medium">626-391-3844</a></li>
              <li>Email: <a href="mailto:info@eclipsetransport.com" className="text-foreground hover:text-primary transition-colors font-medium">info@eclipsetransport.com</a></li>
              <li className="pt-2">Serving the Greater Los Angeles Area</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Eclipse Transport. All rights reserved.</p>
          <p>Licensed & Insured • DOT/PUC Compliant</p>
        </div>
      </div>
    </footer>
  );
}
