import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, logout } = useAuth();

  const isActive = (path: string) => location === path;

  const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
    <Link 
      href={href}
      className={`font-medium transition-colors duration-200 ${
        isActive(href) ? "text-foreground" : "text-muted-foreground hover:text-primary"
      }`}
      onClick={onClick}
      data-testid={`nav-link-${href.replace("/", "home").replace("/", "-")}`}
    >
      {children}
    </Link>
  );

  const handleLogout = () => {
    logout();
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              href="/"
              className="text-2xl font-bold text-primary" 
              data-testid="logo"
            >
              Testimo
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/testimonials">Testimonials</NavLink>
              {isAuthenticated && <NavLink href="/testimonial-wall">Testimonial Wall</NavLink>}
              <NavLink href="/pricing">Pricing</NavLink>
              <NavLink href="/how-it-works">How It Works</NavLink>
              <NavLink href="/about">About</NavLink>
              
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      data-testid="button-logout"
                    >
                      Logout
                    </Button>
                  ) : (
                    <>
                      <Link href="/signin">
                        <Button
                          variant="ghost"
                          data-testid="button-login"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button
                          data-testid="button-signup"
                        >
                          Start Free Trial
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavLink href="/" onClick={closeMobileMenu}>Home</NavLink>
                  <NavLink href="/testimonials" onClick={closeMobileMenu}>Testimonials</NavLink>
                  {isAuthenticated && <NavLink href="/testimonial-wall" onClick={closeMobileMenu}>Testimonial Wall</NavLink>}
                  <NavLink href="/pricing" onClick={closeMobileMenu}>Pricing</NavLink>
                  <NavLink href="/how-it-works" onClick={closeMobileMenu}>How It Works</NavLink>
                  <NavLink href="/about" onClick={closeMobileMenu}>About</NavLink>
                  
                  {!isLoading && (
                    <div className="pt-4 border-t border-border">
                      {isAuthenticated ? (
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full"
                          data-testid="button-mobile-logout"
                        >
                          Logout
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Link href="/signin">
                            <Button
                              variant="ghost"
                              className="w-full"
                              data-testid="button-mobile-login"
                              onClick={closeMobileMenu}
                            >
                              Login
                            </Button>
                          </Link>
                          <Link href="/signup">
                            <Button
                              className="w-full"
                              data-testid="button-mobile-signup"
                              onClick={closeMobileMenu}
                            >
                              Start Free Trial
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
