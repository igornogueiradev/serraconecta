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
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Users, MapPin, Clock, Edit, Trash2, Calendar, Truck, Package } from "lucide-react";
import { useDrivers } from "@/hooks/useDrivers";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";
import type { Tables } from '@/integrations/supabase/types';

type Driver = Tables<'drivers'> & {
  profiles?: {
    full_name: string;
    phone: string;
  } | null;
};

interface MyDriversPageProps {
  userName: string;
  onLogout: () => void;
}

export default function MyDriversPage({ userName, onLogout }: MyDriversPageProps) {
  const { deleteDriver, updateDriver, fetchMyDrivers, isLoading } = useDrivers();
  const [myDrivers, setMyDrivers] = useState<Driver[]>([]);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadMyDrivers();
  }, []);

  const loadMyDrivers = async () => {
    const drivers = await fetchMyDrivers();
    setMyDrivers(drivers || []);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteDriver(id);
    if (success) {
      setMyDrivers(myDrivers.filter(driver => driver.id !== id));
    }
  };

  const toggleAvailability = async (driver: Driver) => {
    const newStatus = driver.status === 'active' ? 'inactive' : 'active';
    const success = await updateDriver(driver.id, { status: newStatus });
    if (success) {
      setMyDrivers(myDrivers.map(d => 
        d.id === driver.id ? { ...d, status: newStatus } : d
      ));
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (editingDriver) {
      const success = await updateDriver(editingDriver.id, {
        vehicle_info: editingDriver.vehicle_info,
        available_seats: editingDriver.available_seats,
        departure_date: editingDriver.departure_date,
        departure_time: editingDriver.departure_time,
        additional_info: editingDriver.additional_info,
        has_trailer: editingDriver.has_trailer,
        has_rooftop_carrier: editingDriver.has_rooftop_carrier,
      });
      
      if (success) {
        setMyDrivers(myDrivers.map(driver => 
          driver.id === editingDriver.id ? editingDriver : driver
        ));
        setShowEditDialog(false);
        setEditingDriver(null);
      }
    }
  };

  const updateEditingDriver = (field: keyof Driver, value: any) => {
    if (editingDriver) {
      setEditingDriver({ ...editingDriver, [field]: value });
    }
  };

  if (isLoading) {
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
            Minhas Disponibilidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas disponibilidades de motorista
          </p>
        </div>

        {myDrivers.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myDrivers.map((driver) => {
              const expired = isExpired(driver.departure_date, driver.departure_time);
              const canEdit = !expired;
              
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
                      <span>{driver.origin} → {driver.destination}</span>
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
                      <p className="text-sm text-muted-foreground border-t pt-3">
                        {driver.additional_info.length > 80 
                          ? `${driver.additional_info.substring(0, 80)}...` 
                          : driver.additional_info
                        }
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-3 border-t">
                      {!expired && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleAvailability(driver)}
                        >
                          {driver.status === 'active' ? "Marcar Inativo" : "Marcar Ativo"}
                        </Button>
                      )}
                      
                      {canEdit && !expired && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(driver)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      
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
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Disponibilidade</DialogTitle>
            <DialogDescription>
              Atualize as informações da sua disponibilidade
            </DialogDescription>
          </DialogHeader>
          
          {editingDriver && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vehicle">Veículo</Label>
                <Input
                  id="edit-vehicle"
                  value={editingDriver.vehicle_info || ''}
                  onChange={(e) => updateEditingDriver('vehicle_info', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacidade de Passageiros</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="50"
                  value={editingDriver.available_seats}
                  onChange={(e) => updateEditingDriver('available_seats', parseInt(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Data</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingDriver.departure_date}
                    onChange={(e) => updateEditingDriver('departure_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-departure">Horário de Saída</Label>
                  <Input
                    id="edit-departure"
                    type="time"
                    value={editingDriver.departure_time}
                    onChange={(e) => updateEditingDriver('departure_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Equipamentos Adicionais</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-hasTrailer"
                      checked={editingDriver.has_trailer}
                      onCheckedChange={(checked) => updateEditingDriver('has_trailer', checked)}
                    />
                    <Label htmlFor="edit-hasTrailer" className="text-sm">
                      Possui Reboque?
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-hasRooftopCarrier"
                      checked={editingDriver.has_rooftop_carrier}
                      onCheckedChange={(checked) => updateEditingDriver('has_rooftop_carrier', checked)}
                    />
                    <Label htmlFor="edit-hasRooftopCarrier" className="text-sm">
                      Possui Bagageiro?
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Observações</Label>
                <Textarea
                  id="edit-description"
                  value={editingDriver.additional_info || ''}
                  onChange={(e) => updateEditingDriver('additional_info', e.target.value)}
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