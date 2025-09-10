import { useState } from "react";
import { Link } from "react-router-dom";
import { User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
interface HeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}
export function Header({
  isLoggedIn,
  userName = "Usuário",
  onLogout
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return <header className="bg-card border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">SerraConecta</span>
          </Link>

          {/* Desktop Navigation */}
          {isLoggedIn && <nav className="hidden md:flex items-center space-x-6">
              <Link to="/drivers" className="text-muted-foreground hover:text-primary transition-colors">
                Disponibilidades
              </Link>
              <Link to="/trips" className="text-muted-foreground hover:text-primary transition-colors">
                Viagens Ofertadas
              </Link>
            </nav>}

          {/* User Menu / Login */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuItem className="md:hidden">
                    <Link to="/drivers" className="w-full">
                      Disponibilidades
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="md:hidden">
                    <Link to="/trips" className="w-full">
                      Viagens Ofertadas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button asChild variant="primary">
                <Link to="/login">Entrar</Link>
              </Button>}

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && isLoggedIn && <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <Link to="/drivers" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Disponibilidades de Motoristas
              </Link>
              <Link to="/trips" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Viagens Ofertadas
              </Link>
            </nav>
          </div>}
      </div>
    </header>;
}