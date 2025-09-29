import { useState } from 'react';
import { Menu, X, Search, Building2, Heart, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'Buy', href: '/properties?purpose=for-sale' },
    { name: 'Rent', href: '/properties?purpose=for-rent' },
    { name: 'Market Insights', href: '/#analytics' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Dubai Properties</span>
              <span className="text-xs text-muted-foreground">Real Estate Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="text-sm px-3 py-1.5 h-auto"
                asChild
              >
                <Link to={item.href}>{item.name}</Link>
              </Button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="hidden md:flex h-8 px-2">
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-sm">Saved</span>
            </Button>
            
            <Button size="sm" variant="ghost" className="hidden md:flex h-8 px-2">
              <Phone className="w-4 h-4 mr-1" />
              <span className="text-sm">Contact</span>
            </Button>

            <Button size="sm" className="h-8 px-3">
              <User className="w-4 h-4 mr-1" />
              <span className="text-sm">Sign In</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="justify-start text-sm h-8"
                  asChild
                >
                  <Link to={item.href}>{item.name}</Link>
                </Button>
              ))}
              <div className="pt-2 border-t border-border mt-2">
                <Button variant="ghost" className="justify-start text-sm h-8 w-full">
                  <Heart className="w-4 h-4 mr-2" />
                  Saved Properties
                </Button>
                <Button variant="ghost" className="justify-start text-sm h-8 w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Agent
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}