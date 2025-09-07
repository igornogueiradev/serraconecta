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
import { Users, MapPin, Clock, Luggage, Plus, Baby, Calendar, Filter } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { isExpired } from "@/utils/timeUtils";
import { RatingModal } from "@/components/RatingModal";
import { Rating, calculateAverageRating } from "@/utils/rating";

interface Trip {
  id: string;
  passengerName: string;
  adults: number;
  children: number;
  luggage23kg: number;
  luggage10kg: number;
  bags: number;
  route: string;
  date: string;
  time: string;
  description: string;
  tripType: string;
  status: "pending" | "accepted" | "completed";
  phoneNumber: string;
  createdBy?: string;
}

interface TripsPageProps {
  userName: string;
  onLogout: () => void;
}

export default function TripsPage({ userName, onLogout }: TripsPageProps) {
  const [trips] = useState<Trip[]>([
    {
      id: "1",
      passengerName: "Ana Costa",
      adults: 2,
      children: 1,
      luggage23kg: 2,
      luggage10kg: 1,
      bags: 3,
      route: "Porto Alegre → Gramado",
      date: "2024-12-31",
      time: "09:00",
      description: "Viagem para final de semana em família. Flexível com horário.",
      tripType: "Privativo",
      status: "pending",
      phoneNumber: "51988998877",
      createdBy: "ana@email.com"
    },
    {
      id: "2",
      passengerName: "Roberto Lima",
      adults: 1,
      children: 0,
      luggage23kg: 1,
      luggage10kg: 0,
      bags: 1,
      route: "Gramado → Porto Alegre",
      date: "2024-12-31",
      time: "17:00",
      description: "Retorno de viagem de negócios.",
      tripType: "Coletivo",
      status: "pending",
      phoneNumber: "51977887766",
      createdBy: "roberto@email.com"
    },
    {
      id: "3",
      passengerName: "Família Ferreira",
      adults: 4,
      children: 2,
      luggage23kg: 4,
      luggage10kg: 2,
      bags: 6,
      route: "Caxias do Sul → Gramado",
      date: "2025-01-02",
      time: "08:30",
      description: "Grupo familiar grande, precisamos de veículo com boa capacidade.",
      tripType: "Ambos (Privativo e Coletivo)",
      status: "accepted",
      phoneNumber: "51966776655",
      createdBy: "ferreira@email.com"
    }
  ]);

  const [dateFilter, setDateFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Rating system states
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [newTrip, setNewTrip] = useState({
    adults: "",
    children: "",
    luggage23kg: "",
    luggage10kg: "",
    bags: "",
    route: "",
    date: "",
    time: "",
    tripType: "",
    description: ""
  });

  const handleAddTrip = () => {
    // Aqui seria feita a chamada para a API
    console.log("Adicionando viagem:", newTrip);
  };

  const applyFilters = () => {
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setDateFilter("");
    setRouteFilter("all");
    setStatusFilter("pending");
    setFiltersApplied(false);
  };

  const filteredTrips = trips.filter(trip => {
    if (!filtersApplied) return true;
    
    let matches = true;
    
    if (routeFilter !== "all") {
      matches = matches && trip.route.toLowerCase().includes(routeFilter.replace("-", " "));
    }
    
    if (statusFilter === "pending") {
      matches = matches && trip.status === "pending" && !isExpired(trip.date, trip.time);
    } else if (statusFilter !== "all") {
      matches = matches && trip.status === statusFilter;
    }
    
    if (dateFilter) {
      matches = matches && trip.date === dateFilter;
    }
    
    return matches;
  });

  const getStatusBadge = (status: Trip["status"], expired: boolean = false) => {
    if (expired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="outline">Aguardando</Badge>;
      case "accepted":
        return <Badge variant="default">Aceita</Badge>;
      case "completed":
        return <Badge variant="secondary">Concluída</Badge>;
    }
  };

  const handleAcceptTrip = (trip: Trip) => {
    const whatsappLink = generateWhatsAppLink(
      trip.phoneNumber,
      'trip',
      {
        name: trip.passengerName,
        route: trip.route,
        date: trip.date,
        time: trip.time,
        adults: trip.adults,
        children: trip.children
      }
    );
    window.open(whatsappLink, '_blank');
    
    // Open rating modal after accepting trip
    setSelectedTrip(trip);
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
              Viagens Ofertadas
            </h1>
            <p className="text-muted-foreground">
              Encontre viagens que precisam de motorista ou oferte uma nova viagem
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="mt-4 sm:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Ofertar Viagem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Oferta de Viagem</DialogTitle>
                <DialogDescription>
                  Crie uma oferta quando não encontrar motoristas disponíveis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">Adultos</Label>
                    <Input
                      id="adults"
                      type="number"
                      placeholder="2"
                      min="1"
                      max="50"
                      value={newTrip.adults}
                      onChange={(e) => setNewTrip({...newTrip, adults: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="children">Crianças</Label>
                    <Input
                      id="children"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={newTrip.children}
                      onChange={(e) => setNewTrip({...newTrip, children: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Bagagens</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="luggage23kg" className="text-xs">Bagagens 23kg</Label>
                      <Input
                        id="luggage23kg"
                        type="number"
                        placeholder="0"
                        min="0"
                        value={newTrip.luggage23kg}
                        onChange={(e) => setNewTrip({...newTrip, luggage23kg: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="luggage10kg" className="text-xs">Bagagens 10kg</Label>
                      <Input
                        id="luggage10kg"
                        type="number"
                        placeholder="0"
                        min="0"
                        value={newTrip.luggage10kg}
                        onChange={(e) => setNewTrip({...newTrip, luggage10kg: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bags" className="text-xs">Bolsas/Mochilas</Label>
                      <Input
                        id="bags"
                        type="number"
                        placeholder="0"
                        min="0"
                        value={newTrip.bags}
                        onChange={(e) => setNewTrip({...newTrip, bags: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="route">Rota</Label>
                    <Select onValueChange={(value) => setNewTrip({...newTrip, route: value})}>
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
                    <Select onValueChange={(value) => setNewTrip({...newTrip, tripType: value})}>
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
                      value={newTrip.date}
                      onChange={(e) => setNewTrip({...newTrip, date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTrip.time}
                      onChange={(e) => setNewTrip({...newTrip, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Observações</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalhes sobre a viagem, flexibilidade de horários, pontos de encontro..."
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({...newTrip, description: e.target.value})}
                  />
                </div>

                <Button onClick={handleAddTrip} className="w-full" variant="secondary">
                  Ofertar Viagem
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
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="accepted">Aceitas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
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
          <Button onClick={applyFilters} variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </Button>
          
          {filtersApplied && (
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const expired = isExpired(trip.date, trip.time);
            
            return (
              <Card key={trip.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{trip.passengerName}</CardTitle>
                      <CardDescription className="text-sm">
                        {new Date(trip.date).toLocaleDateString('pt-BR')} às {trip.time}
                      </CardDescription>
                    </div>
                    {getStatusBadge(trip.status, expired)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{trip.route.replace("→", "→")}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Badge variant="outline" className="text-xs">
                      {trip.tripType}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{trip.adults} adultos</span>
                    </div>
                    
                    {trip.children > 0 && (
                      <div className="flex items-center text-muted-foreground">
                        <Baby className="w-4 h-4 mr-1" />
                        <span>{trip.children} crianças</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Luggage className="w-4 h-4 mr-2" />
                      <span>Bagagens:</span>
                    </div>
                    <div className="ml-6 space-y-1 text-xs text-muted-foreground">
                      {trip.luggage23kg > 0 && <div>• {trip.luggage23kg} bagagem(ns) 23kg</div>}
                      {trip.luggage10kg > 0 && <div>• {trip.luggage10kg} bagagem(ns) 10kg</div>}
                      {trip.bags > 0 && <div>• {trip.bags} bolsa(s)/mochila(s)</div>}
                    </div>
                  </div>
                  
                  {trip.description && (
                    <p className="text-sm text-muted-foreground border-t pt-3">
                      {trip.description.length > 100 
                        ? `${trip.description.substring(0, 100)}...` 
                        : trip.description
                      }
                    </p>
                  )}
                  
                  <div className="flex justify-center pt-3 border-t">
                    <Button 
                      variant={trip.status === "pending" && !expired ? "secondary" : "outline"} 
                      size="sm"
                      disabled={trip.status !== "pending" || expired}
                      onClick={() => handleAcceptTrip(trip)}
                    >
                      {expired ? "Expirado" : 
                       trip.status === "pending" ? "Aceitar" : 
                       trip.status === "accepted" ? "Aceita" : "Concluída"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTrips.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filtersApplied ? "Nenhuma viagem encontrada com os filtros aplicados" : "Nenhuma viagem encontrada"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filtersApplied ? "Tente ajustar os filtros ou limpar para ver mais opções" : "Seja o primeiro a ofertar uma viagem!"}
            </p>
            {filtersApplied ? (
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Ofertar Viagem
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {selectedTrip && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedTrip(null);
          }}
          onSubmitRating={handleSubmitRating}
          ratedUserId={selectedTrip.createdBy || selectedTrip.passengerName}
          raterUserId="current-user"
          tripId={selectedTrip.id}
          ratedUserName={selectedTrip.passengerName}
        />
      )}
    </div>
  );
}