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
import { Checkbox } from "@/components/ui/checkbox";
import { Users, MapPin, Clock, Plus, Car, Star, Package, Truck, MessageCircle } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { useDrivers } from "@/hooks/useDrivers";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";

interface DriversPageProps {
  userName: string;
  onLogout: () => void;
}

export default function DriversPage({ userName, onLogout }: DriversPageProps) {
  const { drivers, isLoading, addDriver } = useDrivers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newDriver, setNewDriver] = useState({
    origin: "",
    destination: "",
    vehicle_info: "",
    available_seats: "",
    departure_date: "",
    departure_time: "",
    additional_info: "",
    has_trailer: false,
    has_rooftop_carrier: false,
    service_type: "coletivo"
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const driverData = {
        origin: newDriver.origin,
        destination: newDriver.destination,
        vehicle_info: newDriver.vehicle_info,
        available_seats: parseInt(newDriver.available_seats) || 1,
        departure_date: newDriver.departure_date,
        departure_time: newDriver.departure_time,
        price: 0,
        additional_info: newDriver.additional_info || null,
        has_trailer: newDriver.has_trailer,
        has_rooftop_carrier: newDriver.has_rooftop_carrier,
        service_type: newDriver.service_type,
        status: 'active' as const
      };

      const success = await addDriver(driverData);
      if (success) {
        setNewDriver({
          origin: "",
          destination: "",
          vehicle_info: "",
          available_seats: "",
          departure_date: "",
          departure_time: "",
          additional_info: "",
          has_trailer: false,
          has_rooftop_carrier: false,
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
              Disponibilidades de Motoristas
            </h1>
            <p className="text-muted-foreground">
              Encontre motoristas disponíveis ou ofereça sua disponibilidade
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" className="mt-4 sm:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Disponibilidade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Nova Disponibilidade</DialogTitle>
                <DialogDescription>
                  Cadastre sua disponibilidade para transporte
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Select value={newDriver.origin} onValueChange={(value) => setNewDriver({...newDriver, origin: value})}>
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
                  <Select value={newDriver.destination} onValueChange={(value) => setNewDriver({...newDriver, destination: value})}>
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
                  <Select value={newDriver.service_type} onValueChange={(value) => setNewDriver({...newDriver, service_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coletivo">Coletivo</SelectItem>
                      <SelectItem value="privativo">Privativo</SelectItem>
                      <SelectItem value="ambos">Ambos (Coletivo e Privativo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Veículo</Label>
                  <Input
                    placeholder="Ex: Toyota Corolla 2020"
                    value={newDriver.vehicle_info}
                    onChange={(e) => setNewDriver({...newDriver, vehicle_info: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Assentos Disponíveis</Label>
                  <Input
                    type="number"
                    placeholder="4"
                    min="1"
                    max="50"
                    value={newDriver.available_seats}
                    onChange={(e) => setNewDriver({...newDriver, available_seats: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newDriver.departure_date}
                      onChange={(e) => setNewDriver({...newDriver, departure_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={newDriver.departure_time}
                      onChange={(e) => setNewDriver({...newDriver, departure_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Equipamentos Adicionais</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasTrailer"
                        checked={newDriver.has_trailer}
                        onCheckedChange={(checked) => 
                          setNewDriver({...newDriver, has_trailer: checked as boolean})
                        }
                      />
                      <Label htmlFor="hasTrailer" className="text-sm">
                        Possui Reboque?
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasRooftopCarrier"
                        checked={newDriver.has_rooftop_carrier}
                        onCheckedChange={(checked) => 
                          setNewDriver({...newDriver, has_rooftop_carrier: checked as boolean})
                        }
                      />
                      <Label htmlFor="hasRooftopCarrier" className="text-sm">
                        Possui Bagageiro?
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Informações adicionais sobre o veículo, pontos de encontro, etc."
                    value={newDriver.additional_info}
                    onChange={(e) => setNewDriver({...newDriver, additional_info: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  variant="primary"
                  disabled={isSubmitting || !newDriver.origin || !newDriver.destination || !newDriver.departure_date}
                >
                  {isSubmitting ? "Cadastrando..." : "Cadastrar Disponibilidade"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Drivers Grid */}
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
        ) : drivers.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum motorista disponível</h3>
            <p className="text-muted-foreground mb-4">
              Seja o primeiro a cadastrar uma disponibilidade!
            </p>
            <Button 
              variant="primary"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disponibilidade
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => {
              const expired = isExpired(driver.departure_date, driver.departure_time);
              const route = `${driver.origin} → ${driver.destination}`;
              
              return (
                <Card key={driver.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {driver.profiles?.full_name || 'Motorista'}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDateTime(driver.departure_date, driver.departure_time)}
                        </CardDescription>
                      </div>
                      <Badge variant={expired ? "destructive" : driver.status === 'active' ? "default" : "secondary"}>
                        {expired ? "Expirado" : driver.status === 'active' ? "Disponível" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Car className="w-4 h-4 mr-2" />
                      <span>{driver.vehicle_info || "Veículo não informado"}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Até {driver.available_seats} passageiros</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{route}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Car className="w-4 h-4 mr-2" />
                      <span>Serviço: {(driver as any).service_type ? ((driver as any).service_type === 'ambos' ? 'Coletivo e Privativo' : (driver as any).service_type.charAt(0).toUpperCase() + (driver as any).service_type.slice(1)) : 'Coletivo'}</span>
                    </div>
                    

                    {(driver.has_trailer || driver.has_rooftop_carrier) && (
                      <div className="flex gap-2">
                        {driver.has_trailer && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Truck className="w-3 h-3 mr-1" />
                            <span>Reboque</span>
                          </div>
                        )}
                        {driver.has_rooftop_carrier && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Package className="w-3 h-3 mr-1" />
                            <span>Bagageiro</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {driver.additional_info && (
                      <p className="text-sm text-muted-foreground">
                        {driver.additional_info}
                      </p>
                    )}
                    
                    {!expired && driver.status === 'active' && driver.profiles?.phone && (
                      <Button 
                        variant="secondary" 
                        className="w-full mt-4"
                        onClick={() => {
                          const whatsappLink = generateWhatsAppLink(
                            driver.profiles.phone,
                            'driver',
                            {
                              name: driver.profiles.full_name,
                              route: route,
                              time: driver.departure_time,
                              vehicle: driver.vehicle_info || 'Veículo'
                            }
                          );
                          window.open(whatsappLink, '_blank');
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Entrar em Contato
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
