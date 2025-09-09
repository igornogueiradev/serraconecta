import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, MapPin, Clock, Plus } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";

interface TripsPageProps {
  userName: string;
  onLogout: () => void;
}

export default function TripsPage({ userName, onLogout }: TripsPageProps) {
  const { trips, isLoading, addTrip } = useTrips();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTrip, setNewTrip] = useState({
    origin: "",
    destination: "",
    passengers_count: "",
    departure_date: "",
    departure_time: "",
    additional_info: ""
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const tripData = {
        origin: newTrip.origin,
        destination: newTrip.destination,
        passengers_count: parseInt(newTrip.passengers_count) || 1,
        max_price: null,
        departure_date: newTrip.departure_date,
        departure_time: newTrip.departure_time,
        additional_info: newTrip.additional_info || null,
        status: 'active' as const
      };

      const success = await addTrip(tripData);
      if (success) {
        setNewTrip({
          origin: "",
          destination: "",
          passengers_count: "",
          departure_date: "",
          departure_time: "",
          additional_info: ""
        });
        setIsDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Input
                    placeholder="Ex: Porto Alegre"
                    value={newTrip.origin}
                    onChange={(e) => setNewTrip({...newTrip, origin: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Input
                    placeholder="Ex: Gramado"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número de Passageiros</Label>
                  <Input
                    type="number"
                    placeholder="2"
                    min="1"
                    max="50"
                    value={newTrip.passengers_count}
                    onChange={(e) => setNewTrip({...newTrip, passengers_count: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newTrip.departure_date}
                      onChange={(e) => setNewTrip({...newTrip, departure_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={newTrip.departure_time}
                      onChange={(e) => setNewTrip({...newTrip, departure_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Detalhes sobre a viagem, flexibilidade de horários, pontos de encontro..."
                    value={newTrip.additional_info}
                    onChange={(e) => setNewTrip({...newTrip, additional_info: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  variant="secondary"
                  disabled={isSubmitting || !newTrip.origin || !newTrip.destination || !newTrip.departure_date}
                >
                  {isSubmitting ? "Ofertando..." : "Ofertar Viagem"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Trips Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="shadow-card">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma viagem ofertada</h3>
            <p className="text-muted-foreground mb-4">
              Seja o primeiro a ofertar uma viagem!
            </p>
            <Button 
              variant="secondary"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ofertar Viagem
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const expired = isExpired(trip.departure_date, trip.departure_time);
              const route = `${trip.origin} → ${trip.destination}`;
              
              return (
                <Card key={trip.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Passageiro</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDateTime(trip.departure_date, trip.departure_time)}
                        </CardDescription>
                      </div>
                      <Badge variant={expired ? "destructive" : trip.status === 'active' ? "outline" : "secondary"}>
                        {expired ? "Expirado" : trip.status === 'active' ? "Aguardando" : "Aceita"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{route}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{trip.passengers_count} passageiros</span>
                    </div>
                    
                    
                    {trip.additional_info && (
                      <p className="text-sm text-muted-foreground">
                        {trip.additional_info}
                      </p>
                    )}
                    
                    {!expired && trip.status === 'active' && (
                      <Button variant="secondary" className="w-full mt-4">
                        Aceitar Viagem
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}