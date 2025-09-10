import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, MapPin, Luggage, Edit, Trash2, Baby, Clock, Car } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'> & {
  profiles?: {
    full_name: string;
    phone: string;
  } | null;
};

interface MyTripsPageProps {
  userName: string;
  onLogout: () => void;
}

export default function MyTripsPage({ userName, onLogout }: MyTripsPageProps) {
  const { deleteTrip, updateTrip, fetchMyTrips, isLoading } = useTrips();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadMyTrips();
  }, []);

  const loadMyTrips = async () => {
    const trips = await fetchMyTrips();
    setMyTrips(trips || []);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTrip(id);
    if (success) {
      setMyTrips(myTrips.filter(trip => trip.id !== id));
    }
  };

  const updateStatus = async (trip: Trip, status: string) => {
    const success = await updateTrip(trip.id, { status });
    if (success) {
      setMyTrips(myTrips.map(t => 
        t.id === trip.id ? { ...t, status } : t
      ));
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (editingTrip) {
      const success = await updateTrip(editingTrip.id, {
        departure_date: editingTrip.departure_date,
        departure_time: editingTrip.departure_time,
        additional_info: editingTrip.additional_info,
        adults_count: (editingTrip as any).adults_count,
        children_count: (editingTrip as any).children_count,
        baggage_23kg: (editingTrip as any).baggage_23kg,
        baggage_10kg: (editingTrip as any).baggage_10kg,
        baggage_bags: (editingTrip as any).baggage_bags,
      });
      
      if (success) {
        setMyTrips(myTrips.map(trip => 
          trip.id === editingTrip.id ? editingTrip : trip
        ));
        setShowEditDialog(false);
        setEditingTrip(null);
      }
    }
  };

  const updateEditingTrip = (field: keyof Trip, value: any) => {
    if (editingTrip) {
      setEditingTrip({ ...editingTrip, [field]: value });
    }
  };

  const getStatusBadge = (status: string, expired: boolean = false) => {
    if (expired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    switch (status) {
      case "active":
        return <Badge variant="outline">Aguardando</Badge>;
      case "accepted":
        return <Badge variant="default">Aceita</Badge>;
      case "completed":
        return <Badge variant="secondary">Concluída</Badge>;
      default:
        return <Badge variant="outline">Aguardando</Badge>;
    }
  };

  if (isLoading) {
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
            {Array.from({ length: 3 }).map((_, index) => (
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
        </main>
      </div>
    );
  }

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

        {myTrips.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTrips.map((trip) => {
              const expired = isExpired(trip.departure_date, trip.departure_time);
              const canEdit = !expired && trip.status === "active";
              
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
                      {getStatusBadge(trip.status, expired)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{trip.origin} → {trip.destination}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Car className="w-4 h-4 mr-2" />
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
                      <p className="text-sm text-muted-foreground border-t pt-3">
                        {trip.additional_info.length > 100 
                          ? `${trip.additional_info.substring(0, 100)}...` 
                          : trip.additional_info
                        }
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-3 border-t">
                      {trip.status === "active" && !expired && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus(trip, "completed")}
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
        )}
      </main>

      {/* Edit Dialog */}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adultos</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={(editingTrip as any).adults_count || 1}
                    onChange={(e) => updateEditingTrip('adults_count' as any, parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crianças</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={(editingTrip as any).children_count || 0}
                    onChange={(e) => updateEditingTrip('children_count' as any, parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bagagens</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">23kg</Label>
                    <Input
                      type="number"
                      min="0"
                      value={(editingTrip as any).baggage_23kg || 0}
                      onChange={(e) => updateEditingTrip('baggage_23kg' as any, parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">10kg</Label>
                    <Input
                      type="number"
                      min="0"
                      value={(editingTrip as any).baggage_10kg || 0}
                      onChange={(e) => updateEditingTrip('baggage_10kg' as any, parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bolsas</Label>
                    <Input
                      type="number"
                      min="0"
                      value={(editingTrip as any).baggage_bags || 0}
                      onChange={(e) => updateEditingTrip('baggage_bags' as any, parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={editingTrip.departure_date}
                    onChange={(e) => updateEditingTrip('departure_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={editingTrip.departure_time}
                    onChange={(e) => updateEditingTrip('departure_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={editingTrip.additional_info || ''}
                  onChange={(e) => updateEditingTrip('additional_info', e.target.value)}
                />
              </div>

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