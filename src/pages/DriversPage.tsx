import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, Users, MapPin, Clock, Star, Plus } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  capacity: number;
  route: string;
  departure: string;
  price: number;
  available: boolean;
}

interface DriversPageProps {
  userName: string;
  onLogout: () => void;
}

export default function DriversPage({ userName, onLogout }: DriversPageProps) {
  const [drivers] = useState<Driver[]>([
    {
      id: "1",
      name: "João Silva",
      rating: 4.8,
      vehicle: "Toyota Corolla",
      capacity: 4,
      route: "Porto Alegre → Gramado",
      departure: "14:00",
      price: 80,
      available: true
    },
    {
      id: "2",
      name: "Maria Santos",
      rating: 4.9,
      vehicle: "Honda City",
      capacity: 4,
      route: "Gramado → Porto Alegre",
      departure: "16:30",
      price: 75,
      available: true
    },
    {
      id: "3",
      name: "Carlos Oliveira",
      rating: 4.7,
      vehicle: "Hyundai HB20",
      capacity: 4,
      route: "Porto Alegre → Gramado",
      departure: "18:00",
      price: 85,
      available: false
    }
  ]);

  const [newDriver, setNewDriver] = useState({
    vehicle: "",
    capacity: "",
    route: "",
    departure: "",
    price: "",
    tripType: "",
    description: ""
  });

  const handleAddDriver = () => {
    // Aqui seria feita a chamada para a API
    console.log("Adicionando disponibilidade:", newDriver);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} userName={userName} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Disponibilidades de Motoristas
            </h1>
            <p className="text-muted-foreground">
              Encontre motoristas disponíveis ou ofereça sua disponibilidade
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="primary" className="mt-4 sm:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Disponibilidade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Disponibilidade</DialogTitle>
                <DialogDescription>
                  Cadastre sua disponibilidade para transport
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Veículo</Label>
                  <Input
                    id="vehicle"
                    placeholder="Ex: Toyota Corolla 2020"
                    value={newDriver.vehicle}
                    onChange={(e) => setNewDriver({...newDriver, vehicle: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidade</Label>
                    <Select onValueChange={(value) => setNewDriver({...newDriver, capacity: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Passageiros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 passageiro</SelectItem>
                        <SelectItem value="2">2 passageiros</SelectItem>
                        <SelectItem value="3">3 passageiros</SelectItem>
                        <SelectItem value="4">4 passageiros</SelectItem>
                        <SelectItem value="6">6 passageiros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="80"
                      value={newDriver.price}
                      onChange={(e) => setNewDriver({...newDriver, price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="route">Rota</Label>
                    <Select onValueChange={(value) => setNewDriver({...newDriver, route: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a rota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poa-gramado">Porto Alegre → Gramado</SelectItem>
                        <SelectItem value="gramado-poa">Gramado → Porto Alegre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tripType">Tipo de Viagem</Label>
                    <Select onValueChange={(value) => setNewDriver({...newDriver, tripType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Privativo</SelectItem>
                        <SelectItem value="shared">Coletivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure">Horário de Saída</Label>
                  <Input
                    id="departure"
                    type="time"
                    value={newDriver.departure}
                    onChange={(e) => setNewDriver({...newDriver, departure: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Observações (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Informações adicionais sobre o veículo, pontos de encontro, etc."
                    value={newDriver.description}
                    onChange={(e) => setNewDriver({...newDriver, description: e.target.value})}
                  />
                </div>

                <Button onClick={handleAddDriver} className="w-full" variant="primary">
                  Cadastrar Disponibilidade
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por rota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as rotas</SelectItem>
              <SelectItem value="poa-gramado">POA → Gramado</SelectItem>
              <SelectItem value="gramado-poa">Gramado → POA</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="available">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
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
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Saída: {driver.departure}</span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-lg font-semibold text-foreground">
                    R$ {driver.price}
                  </span>
                  <Button 
                    variant={driver.available ? "primary" : "outline"} 
                    size="sm"
                    disabled={!driver.available}
                  >
                    {driver.available ? "Contactar" : "Indisponível"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {drivers.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum motorista encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Seja o primeiro a oferecer sua disponibilidade!
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Disponibilidade
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
}