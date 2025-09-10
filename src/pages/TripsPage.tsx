import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, MapPin, Clock, Plus, MessageCircle, Luggage, Baby } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";
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
    adults_count: "1",
    children_count: "0",
    luggage_23kg: "0",
    luggage_10kg: "0",
    bags_backpacks: "0",
    departure_date: "",
    departure_time: "",
    additional_info: "",
    service_type: "coletivo"
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const tripData = {
        origin: newTrip.origin,
        destination: newTrip.destination,
        passengers_count: parseInt(newTrip.adults_count) + parseInt(newTrip.children_count) || 1,
        max_price: null,
        departure_date: newTrip.departure_date,
        departure_time: newTrip.departure_time,
        additional_info: newTrip.additional_info || null,
        baggage_23kg: parseInt(newTrip.luggage_23kg) || 0,
        baggage_10kg: parseInt(newTrip.luggage_10kg) || 0,
        baggage_bags: parseInt(newTrip.bags_backpacks) || 0,
        adults_count: parseInt(newTrip.adults_count) || 1,
        children_count: parseInt(newTrip.children_count) || 0,
        service_type: newTrip.service_type,
        status: 'active' as const
      };

      const success = await addTrip(tripData);
      if (success) {
        setNewTrip({
          origin: "",
          destination: "",
          adults_count: "1",
          children_count: "0",
          luggage_23kg: "0",
          luggage_10kg: "0",
          bags_backpacks: "0",
          departure_date: "",
          departure_time: "",
          additional_info: "",
          service_type: "coletivo"
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
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Nova Oferta de Viagem</DialogTitle>
                <DialogDescription>
                  Crie uma oferta quando não encontrar motoristas disponíveis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Select value={newTrip.origin} onValueChange={(value) => setNewTrip({...newTrip, origin: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caxias do Sul">Caxias do Sul</SelectItem>
                      <SelectItem value="Gramado">Gramado</SelectItem>
                      <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Select value={newTrip.destination} onValueChange={(value) => setNewTrip({...newTrip, destination: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caxias do Sul">Caxias do Sul</SelectItem>
                      <SelectItem value="Gramado">Gramado</SelectItem>
                      <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Serviço</Label>
                  <Select value={newTrip.service_type} onValueChange={(value) => setNewTrip({...newTrip, service_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coletivo">Coletivo</SelectItem>
                      <SelectItem value="privativo">Privativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adultos</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      min="1"
                      max="10"
                      value={newTrip.adults_count}
                      onChange={(e) => setNewTrip({...newTrip, adults_count: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Crianças</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="10"
                      value={newTrip.children_count}
                      onChange={(e) => setNewTrip({...newTrip, children_count: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bagagens</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Bagagens 23kg</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newTrip.luggage_23kg}
                        onChange={(e) => setNewTrip({...newTrip, luggage_23kg: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bagagens 10kg</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newTrip.luggage_10kg}
                        onChange={(e) => setNewTrip({...newTrip, luggage_10kg: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bolsas/Mochilas</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newTrip.bags_backpacks}
                        onChange={(e) => setNewTrip({...newTrip, bags_backpacks: e.target.value})}
                      />
                    </div>
                  </div>
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
                        <CardTitle className="text-lg">
                          {trip.profiles?.full_name || 'Passageiro'}
                        </CardTitle>
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
                      <span>Serviço: {(trip as any).service_type ? (trip as any).service_type.charAt(0).toUpperCase() + (trip as any).service_type.slice(1) : 'Coletivo'}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center gap-2 mb-1">
                        🧳 Bagagens:
                      </p>
                      <div className="ml-6 space-y-1">
                        {(trip as any).baggage_23kg > 0 && (
                          <p>• {(trip as any).baggage_23kg} bagagem(ns) 23kg</p>
                        )}
                        {(trip as any).baggage_10kg > 0 && (
                          <p>• {(trip as any).baggage_10kg} bagagem(ns) 10kg</p>
                        )}
                        {(trip as any).baggage_bags > 0 && (
                          <p>• {(trip as any).baggage_bags} bolsa(s)/mochila(s)</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      {(trip as any).adults_count > 0 && (
                        <p className="flex items-center gap-2">
                          👨‍💼 {(trip as any).adults_count} adultos
                        </p>
                      )}
                      {(trip as any).children_count > 0 && (
                        <p className="flex items-center gap-2">
                          👶 {(trip as any).children_count} crianças
                        </p>
                      )}
                    </div>
                    
                    
                    {trip.additional_info && (
                      <p className="text-sm text-muted-foreground">
                        {trip.additional_info}
                      </p>
                    )}
                    
                    {!expired && trip.status === 'active' && trip.profiles?.phone && (
                      <Button 
                        variant="secondary" 
                        className="w-full mt-4"
                        onClick={() => {
                          const whatsappLink = generateWhatsAppLink(
                            trip.profiles.phone,
                            'trip',
                            {
                              name: trip.profiles.full_name,
                              route: route,
                              date: trip.departure_date,
                              time: trip.departure_time
                            }
                          );
                          window.open(whatsappLink, '_blank');
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
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
