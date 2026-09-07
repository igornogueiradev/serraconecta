import { Link } from "react-router-dom";
import { User, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function Header({ isLoggedIn, userName = "Usuário", onLogout }: HeaderProps) {
  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center space-x-2">
            <img src="/LOGO.png" alt="logo" className="w-8 h-8 object-cover rounded-md" />
            <span className="font-bold text-base text-foreground hidden sm:block">Meu Executivo Gramado</span>
          </Link>

          {isLoggedIn && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/leads" className="text-muted-foreground hover:text-primary transition-colors">
                Leads
              </Link>
              <Link to="/financeiro/agenda" className="text-muted-foreground hover:text-primary transition-colors">
                Agenda
              </Link>
              <Link to="/financeiro/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                Financeiro
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center w-full">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="primary">
                <Link to="/login">Entrar</Link>
              </Button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
