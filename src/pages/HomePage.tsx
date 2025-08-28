import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/Header";

interface HomePageProps {
  userName: string;
  onLogout: () => void;
}

export default function HomePage({ userName, onLogout }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} userName={userName} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Olá, {userName}! 👋
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie suas viagens entre Porto Alegre e Gramado. Ofereça sua disponibilidade 
            ou encontre viagens que precisam de motoristas.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-card">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Motoristas disponíveis</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-sm text-muted-foreground">Viagens ofertadas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center mr-4">
                <MapPin className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">POA ↔ GRA</p>
                <p className="text-sm text-muted-foreground">Rota principal</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drivers Section */}
          <Card className="shadow-elegant hover:shadow-card transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Disponibilidades de Motoristas</CardTitle>
                  <CardDescription>
                    Ofereça sua disponibilidade ou encontre motoristas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Próximas disponibilidades hoje</span>
                </div>
                <p className="text-sm">
                  Veja quais motoristas estão disponíveis para transfer ou adicione sua própria disponibilidade.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button asChild variant="primary" className="flex-1">
                  <Link to="/drivers">Ver Disponibilidades</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/drivers?action=add">Adicionar Minha</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trips Section */}
          <Card className="shadow-elegant hover:shadow-card transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Viagens Ofertadas</CardTitle>
                  <CardDescription>
                    Encontre ou oferte viagens que precisam de motorista
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Viagens disponíveis hoje</span>
                </div>
                <p className="text-sm">
                  Passageiros procurando motoristas ou oferte uma viagem quando há demanda excedente.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button asChild variant="secondary" className="flex-1">
                  <Link to="/trips">Ver Viagens</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/trips?action=add">Ofertar Viagem</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-hero text-white shadow-elegant">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Como funciona?</h3>
              <div className="max-w-3xl mx-auto text-left space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Disponibilidades de Motoristas:</h4>
                  <p className="text-white/90">
                    Cadastre sua disponibilidade informando horários, capacidade do veículo, tipo de serviço (privativo ou coletivo) e rota. 
                    Receba solicitações de passageiros interessados.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Ofertas de Viagem:</h4>
                  <p className="text-white/90">
                    Quando há demanda excedente ou você quer garantir uma viagem específica, oferte uma viagem detalhando 
                    número de passageiros, bagagens e tipo de serviço desejado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}