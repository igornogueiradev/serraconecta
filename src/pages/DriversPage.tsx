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
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Users, MapPin, Clock, Star, Plus, Calendar, Filter, Truck, Package } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { isExpired } from "@/utils/timeUtils";
import { RatingModal } from "@/components/RatingModal";
import { Rating, calculateAverageRating } from "@/utils/rating";

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
  hasTrailer: boolean;
  hasRooftopCarrier: boolean;
  createdBy?: string;
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
      date: "2024-12-31",
      departure: "14:00",
      available: true,
      tripType: "Privativo",
      description: "Veículo confortável com ar condicionado",
      phoneNumber: "51999887766",
      hasTrailer: false,
      hasRooftopCarrier: true,
      createdBy: "joao@email.com"
    },
    {
      id: "2",
      name: "Maria Santos",
      rating: 4.9,
      vehicle: "Honda City",
      capacity: 4,
      route: "Gramado → Porto Alegre",
      date: "2024-12-31",
      departure: "16:30",
      available: true,
      tripType: "Coletivo",
      description: "",
      phoneNumber: "51988776655",
      hasTrailer: false,
      hasRooftopCarrier: false,
      createdBy: "maria@email.com"
    },
    {
      id: "3",
      name: "Carlos Oliveira",
      rating: 4.7,
      vehicle: "Hyundai HB20",
      capacity: 4,
      route: "Caxias do Sul → Gramado",
      date: "2025-01-02",
      departure: "18:00",
      available: false,
      tripType: "Ambos (Privativo e Coletivo)",
      description: "Aceito viagens privativas e coletivas",
      phoneNumber: "51977665544",
      hasTrailer: true,
      hasRooftopCarrier: false,
      createdBy: "carlos@email.com"
    }
  ]);

  const [dateFilter, setDateFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("available");
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Rating system states
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [newDriver, setNewDriver] = useState({
    vehicle: "",
    capacity: "",
    route: "",
    date: "",
    departure: "",
    tripType: "",
    description: "",
    hasTrailer: false,
    hasRooftopCarrier: false
  });

  const handleAddDriver = () => {
    // Aqui seria feita a chamada para a API
    console.log("Adicionando disponibilidade:", newDriver);
  };

  const applyFilters = () => {
    setFiltersApplied(true);
    // Aqui implementaria a lógica de filtro
  };

  const clearFilters = () => {
    setDateFilter("");
    setRouteFilter("all");
    setStatusFilter("available");
    setFiltersApplied(false);
  };

  const filteredDrivers = drivers.filter(driver => {
    if (!filtersApplied) return true;
    
    let matches = true;
    
    if (routeFilter !== "all") {
      matches = matches && driver.route.toLowerCase().includes(routeFilter.replace("-", " "));
    }
    
    if (statusFilter === "available") {
      matches = matches && driver.available && !isExpired(driver.date, driver.departure);
    }
    
    if (dateFilter) {
      matches = matches && driver.date === dateFilter;
    }
    
    return matches;
  });

  const handleContactDriver = (driver: Driver) => {
    const whatsappLink = generateWhatsAppLink(
      driver.phoneNumber,
      'driver',
      {
        name: driver.name,
        route: driver.route,
        date: driver.date,
        time: driver.departure,
        vehicle: driver.vehicle,
        capacity: driver.capacity
      }
    );
    window.open(whatsappLink, '_blank');
    
    // Open rating modal after contact
    setSelectedDriver(driver);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (rating: Omit<Rating, 'id' | 'createdAt'>) => {
    const newRating: Rating = {
      ...rating,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setRatings([...ratings, newRating]);
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
                  Cadastre sua disponibilidade para transporte
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
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade de Passageiros</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="4"
                    min="1"
                    max="50"
                    value={newDriver.capacity}
                    onChange={(e) => setNewDriver({...newDriver, capacity: e.target.value})}
                  />
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
                        <SelectItem value="caxias-gramado">Caxias do Sul → Gramado</SelectItem>
                        <SelectItem value="gramado-caxias">Gramado → Caxias do Sul</SelectItem>
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
                        <SelectItem value="both">Ambos (Privativo e Coletivo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newDriver.date}
                      onChange={(e) => setNewDriver({...newDriver, date: e.target.value})}
                    />
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
                </div>

                <div className="space-y-3">
                  <Label>Equipamentos Adicionais</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasTrailer"
                        checked={newDriver.hasTrailer}
                        onCheckedChange={(checked) => 
                          setNewDriver({...newDriver, hasTrailer: checked as boolean})
                        }
                      />
                      <Label htmlFor="hasTrailer" className="text-sm">
                        Possui Reboque?
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasRooftopCarrier"
                        checked={newDriver.hasRooftopCarrier}
                        onCheckedChange={(checked) => 
                          setNewDriver({...newDriver, hasRooftopCarrier: checked as boolean})
                        }
                      />
                      <Label htmlFor="hasRooftopCarrier" className="text-sm">
                        Possui Bagageiro?
                      </Label>
                    </div>
                  </div>
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
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={routeFilter} onValueChange={setRouteFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por rota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as rotas</SelectItem>
              <SelectItem value="poa-gramado">POA → Gramado</SelectItem>
              <SelectItem value="gramado-poa">Gramado → POA</SelectItem>
              <SelectItem value="caxias-gramado">Caxias → Gramado</SelectItem>
              <SelectItem value="gramado-caxias">Gramado → Caxias</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="date"
            placeholder="Filtrar por data"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="flex gap-2 mb-8">
          <Button onClick={applyFilters} variant="primary">
            <Filter className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </Button>
          
          {filtersApplied && (
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => {
            const expired = isExpired(driver.date, driver.departure);
            const userRatings = ratings.filter(r => r.ratedUserId === driver.id);
            const avgRating = userRatings.length > 0 ? calculateAverageRating(userRatings) : driver.rating;
            
            return (
              <Card key={driver.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        {avgRating} {userRatings.length > 0 && `(${userRatings.length})`}
                      </CardDescription>
                    </div>
                    <Badge variant={expired ? "destructive" : driver.available ? "default" : "secondary"}>
                      {expired ? "Expirado" : driver.available ? "Disponível" : "Ocupado"}
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

                  {(driver.hasTrailer || driver.hasRooftopCarrier) && (
                    <div className="flex gap-2">
                      {driver.hasTrailer && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Truck className="w-3 h-3 mr-1" />
                          <span>Reboque</span>
                        </div>
                      )}
                      {driver.hasRooftopCarrier && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Package className="w-3 h-3 mr-1" />
                          <span>Bagageiro</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {driver.description && (
                    <p className="text-sm text-muted-foreground border-t pt-3">
                      {driver.description.length > 80 
                        ? `${driver.description.substring(0, 80)}...` 
                        : driver.description
                      }
                    </p>
                  )}
                  
                  <div className="flex justify-center pt-3 border-t">
                    <Button 
                      variant={driver.available && !expired ? "primary" : "outline"} 
                      size="sm"
                      disabled={!driver.available || expired}
                      onClick={() => handleContactDriver(driver)}
                    >
                      {expired ? "Expirado" : driver.available ? "Contactar" : "Indisponível"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filtersApplied ? "Nenhum motorista encontrado com os filtros aplicados" : "Nenhum motorista encontrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filtersApplied ? "Tente ajustar os filtros ou limpar para ver mais opções" : "Seja o primeiro a oferecer sua disponibilidade!"}
            </p>
            {filtersApplied ? (
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Disponibilidade
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {selectedDriver && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedDriver(null);
          }}
          onSubmitRating={handleSubmitRating}
          ratedUserId={selectedDriver.id}
          raterUserId="current-user" // This would come from auth context
          tripId={`contact-${Date.now()}`} // Generate trip ID when contact is made
          ratedUserName={selectedDriver.name}
        />
      )}
    </div>
  );
}