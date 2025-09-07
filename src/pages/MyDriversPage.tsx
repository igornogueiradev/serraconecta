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
import { Car, Users, MapPin, Clock, Star, Edit, Trash2, Calendar, Truck, Package } from "lucide-react";
import { isExpired } from "@/utils/timeUtils";

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
      hasTrailer: false,
      hasRooftopCarrier: true,
      createdBy: "user@email.com"
    }
  ]);

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = (id: string) => {
    setMyDrivers(myDrivers.filter(driver => driver.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setMyDrivers(myDrivers.map(driver => 
      driver.id === id ? { ...driver, available: !driver.available } : driver
    ));
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingDriver) {
      setMyDrivers(myDrivers.map(driver => 
        driver.id === editingDriver.id ? editingDriver : driver
      ));
      setShowEditDialog(false);
      setEditingDriver(null);
    }
  };

  const updateEditingDriver = (field: keyof Driver, value: any) => {
    if (editingDriver) {
      setEditingDriver({ ...editingDriver, [field]: value });
    }
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
          {myDrivers.map((driver) => {
            const expired = isExpired(driver.date, driver.departure);
            const canEdit = !expired;
            
            return (
              <Card key={driver.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        {driver.rating}
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
                  
                  <div className="flex gap-2 pt-3 border-t">
                    {!expired && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleAvailability(driver.id)}
                      >
                        {driver.available ? "Marcar Ocupado" : "Marcar Disponível"}
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
                  value={editingDriver.vehicle}
                  onChange={(e) => updateEditingDriver('vehicle', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacidade de Passageiros</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="50"
                  value={editingDriver.capacity}
                  onChange={(e) => updateEditingDriver('capacity', parseInt(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-route">Rota</Label>
                  <Select 
                    value={editingDriver.route} 
                    onValueChange={(value) => updateEditingDriver('route', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Porto Alegre → Gramado">Porto Alegre → Gramado</SelectItem>
                      <SelectItem value="Gramado → Porto Alegre">Gramado → Porto Alegre</SelectItem>
                      <SelectItem value="Caxias do Sul → Gramado">Caxias do Sul → Gramado</SelectItem>
                      <SelectItem value="Gramado → Caxias do Sul">Gramado → Caxias do Sul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-tripType">Tipo de Viagem</Label>
                  <Select 
                    value={editingDriver.tripType} 
                    onValueChange={(value) => updateEditingDriver('tripType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Privativo">Privativo</SelectItem>
                      <SelectItem value="Coletivo">Coletivo</SelectItem>
                      <SelectItem value="Ambos (Privativo e Coletivo)">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Data</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingDriver.date}
                    onChange={(e) => updateEditingDriver('date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-departure">Horário de Saída</Label>
                  <Input
                    id="edit-departure"
                    type="time"
                    value={editingDriver.departure}
                    onChange={(e) => updateEditingDriver('departure', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Equipamentos Adicionais</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-hasTrailer"
                      checked={editingDriver.hasTrailer}
                      onCheckedChange={(checked) => updateEditingDriver('hasTrailer', checked)}
                    />
                    <Label htmlFor="edit-hasTrailer" className="text-sm">
                      Possui Reboque?
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-hasRooftopCarrier"
                      checked={editingDriver.hasRooftopCarrier}
                      onCheckedChange={(checked) => updateEditingDriver('hasRooftopCarrier', checked)}
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
                  value={editingDriver.description}
                  onChange={(e) => updateEditingDriver('description', e.target.value)}
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