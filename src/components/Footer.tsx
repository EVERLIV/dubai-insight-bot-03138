import { Building2, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const footerLinks = {
    'Buy': ['Apartments', 'Villas', 'Penthouses', 'Townhouses'],
    'Rent': ['Short Term', 'Long Term', 'Furnished', 'Commercial'],
    'Areas': ['Dubai Marina', 'Downtown', 'Business Bay', 'JBR'],
    'Services': ['Property Management', 'Valuation', 'Legal Services', 'Mortgage']
  };

  return (
    <footer className="bg-slate-50 border-t border-border">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold">Dubai Properties</span>
                <p className="text-xs text-muted-foreground">Premium Real Estate Portal</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Your trusted partner in Dubai real estate. Find the perfect property from our extensive collection of apartments, villas, and commercial spaces.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>+971 4 123 4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@dubaiproperties.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Dubai Marina, UAE</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-xs text-muted-foreground">
              © 2024 Dubai Properties. All rights reserved.
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}