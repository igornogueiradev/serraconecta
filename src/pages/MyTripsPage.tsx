import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, MapPin, Luggage, Edit, Trash2, Baby } from "lucide-react";
import { isExpired } from "@/utils/timeUtils";

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

interface MyTripsPageProps {
  userName: string;
  onLogout: () => void;
}

export default function MyTripsPage({ userName, onLogout }: MyTripsPageProps) {
  const [myTrips, setMyTrips] = useState<Trip[]>([
    {
      id: "1",
      passengerName: userName,
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
      createdBy: "user@email.com"
    }
  ]);

  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = (id: string) => {
    setMyTrips(myTrips.filter(trip => trip.id !== id));
  };

  const updateStatus = (id: string, status: Trip["status"]) => {
    setMyTrips(myTrips.map(trip => 
      trip.id === id ? { ...trip, status } : trip
    ));
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingTrip) {
      setMyTrips(myTrips.map(trip => 
        trip.id === editingTrip.id ? editingTrip : trip
      ));
      setShowEditDialog(false);
      setEditingTrip(null);
    }
  };

  const updateEditingTrip = (field: keyof Trip, value: any) => {
    if (editingTrip) {
      setEditingTrip({ ...editingTrip, [field]: value });
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} userName={userName} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Minhas Viagens Ofertadas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas ofertas de viagem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTrips.map((trip) => {
            const expired = isExpired(trip.date, trip.time);
            const canEdit = !expired && trip.status === "pending";
            
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
                    <span>{trip.route}</span>
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
                  
                  <div className="flex gap-2 pt-3 border-t">
                    {trip.status === "pending" && !expired && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateStatus(trip.id, "completed")}
                      >
                        Marcar Concluída
                      </Button>
                    )}
                    
                    {canEdit && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(trip)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(trip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {myTrips.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma viagem ofertada
            </h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não criou nenhuma oferta de viagem.
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/trips'}>
              Criar Oferta
            </Button>
          </div>
        )}
      </main>

      {/* Edit Dialog - Similar structure to MyDriversPage */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
            <DialogDescription>
              Atualize as informações da sua viagem
            </DialogDescription>
          </DialogHeader>
          
          {editingTrip && (
            <div className="space-y-4">
              {/* Edit form fields similar to the creation form */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}