import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, Users, MapPin, Clock, Star, Edit, Trash2, Calendar } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  capacity: number;
  route: string;
  date: string;
  departure: string;
  available: boolean;
  tripType: string;
  description: string;
  phoneNumber: string;
  createdBy?: string;
}

interface MyDriversPageProps {
  userName: string;
  onLogout: () => void;
}

export default function MyDriversPage({ userName, onLogout }: MyDriversPageProps) {
  const [myDrivers, setMyDrivers] = useState<Driver[]>([
    {
      id: "1",
      name: userName,
      rating: 4.8,
      vehicle: "Toyota Corolla",
      capacity: 4,
      route: "Porto Alegre → Gramado",
      date: "2024-12-31",
      departure: "14:00",
      available: true,
      tripType: "Privativo",
      description: "Veículo confortável com ar condicionado",
      phoneNumber: "51999887766",
      createdBy: "user@email.com"
    }
  ]);

  const handleDelete = (id: string) => {
    setMyDrivers(myDrivers.filter(driver => driver.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setMyDrivers(myDrivers.map(driver => 
      driver.id === id ? { ...driver, available: !driver.available } : driver
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} userName={userName} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Minhas Disponibilidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas disponibilidades de motorista
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myDrivers.map((driver) => (
            <Card key={driver.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      {driver.rating}
                    </CardDescription>
                  </div>
                  <Badge variant={driver.available ? "default" : "secondary"}>
                    {driver.available ? "Disponível" : "Ocupado"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Car className="w-4 h-4 mr-2" />
                  <span>{driver.vehicle}</span>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Até {driver.capacity} passageiros</span>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{driver.route}</span>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(driver.date).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Saída: {driver.departure}</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Badge variant="outline" className="text-xs">
                    {driver.tripType}
                  </Badge>
                </div>
                
                {driver.description && (
                  <p className="text-sm text-muted-foreground border-t pt-3">
                    {driver.description.length > 80 
                      ? `${driver.description.substring(0, 80)}...` 
                      : driver.description
                    }
                  </p>
                )}
                
                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleAvailability(driver.id)}
                  >
                    {driver.available ? "Marcar Ocupado" : "Marcar Disponível"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(driver.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {myDrivers.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma disponibilidade cadastrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não criou nenhuma disponibilidade.
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/drivers'}>
              Criar Disponibilidade
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}