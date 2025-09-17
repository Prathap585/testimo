import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-bold text-primary mb-4" data-testid="footer-logo">
              Testimo
            </div>
            <p className="text-muted-foreground text-sm" data-testid="footer-description">
              The easiest way to collect and display testimonials automatically.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="footer-product-title">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/pricing"
                  className="hover:text-primary transition-colors" 
                  data-testid="footer-link-pricing"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  href="/how-it-works"
                  className="hover:text-primary transition-colors" 
                  data-testid="footer-link-how-it-works"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link 
                  href="/"
                  className="hover:text-primary transition-colors" 
                  data-testid="footer-link-features"
                >
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="footer-company-title">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/about"
                  className="hover:text-primary transition-colors" 
                  data-testid="footer-link-about"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/about"
                  className="hover:text-primary transition-colors" 
                  data-testid="footer-link-contact"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-blog">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="footer-legal-title">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-privacy">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-terms">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-security">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="footer-copyright">
            © 2024 Testimo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
