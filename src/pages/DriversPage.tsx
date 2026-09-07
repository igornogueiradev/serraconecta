import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Users, MapPin, Clock, Plus, Car, Package, Truck, MessageCircle, DollarSign, Send } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { useDrivers } from "@/hooks/useDrivers";
import { useRequests } from "@/hooks/useRequests";
import { RatingStars } from "@/components/RatingStars";
import { ReviewsDialog } from "@/components/ReviewsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";
import { CITIES } from "@/utils/cities";
import { auth } from "@/integrations/firebase/client";

interface DriversPageProps {
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
}

export default function DriversPage({ isLoggedIn, userName, onLogout }: DriversPageProps) {
  const { drivers, isLoading, addDriver } = useDrivers();
  const { createRequest, fetchMyRequests } = useRequests();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequestsMap, setMyRequestsMap] = useState<Record<string, { status: string; id: string }>>({});
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [reviewsDialog, setReviewsDialog] = useState<{ userId: string; userName: string } | null>(null);
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterDestination, setFilterDestination] = useState("all");
  const [filterDate, setFilterDate] = useState("");

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
    service_type: "coletivo",
    price: "",
    price_private: "",
  });

  React.useEffect(() => {
    if (!isLoggedIn) return;
    fetchMyRequests().then(reqs => {
      const map: Record<string, { status: string; id: string }> = {};
      // reqs já está ordenado do mais recente para o mais antigo — só define uma vez (mais recente vence)
      reqs.filter(r => r.type === 'driver').forEach(r => {
        if (!map[r.reference_id]) map[r.reference_id] = { status: r.status, id: r.id! };
      });
      setMyRequestsMap(map);
    });
  }, [isLoggedIn]);

  const handleSolicitar = async (driver: typeof drivers[0]) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!driver.profiles) return;
    setRequestingId(driver.id);
    const id = await createRequest({
      type: 'driver',
      reference_id: driver.id,
      owner_id: driver.user_id,
      owner_name: driver.profiles?.full_name,
      origin: driver.origin,
      destination: driver.destination,
      departure_date: driver.departure_date,
      departure_time: driver.departure_time,
    });
    if (id) setMyRequestsMap(prev => ({ ...prev, [driver.id]: { status: 'pending', id } }));
    setRequestingId(null);
  };

  const handleAddClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setIsDialogOpen(true);
  };

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
        price: parseFloat(newDriver.price) || 0,
        price_private: parseFloat(newDriver.price_private) || undefined,
        additional_info: newDriver.additional_info || null,
        has_trailer: newDriver.has_trailer,
        has_rooftop_carrier: newDriver.has_rooftop_carrier,
        service_type: newDriver.service_type,
        status: 'active' as const,
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
          service_type: "coletivo",
          price: "",
          price_private: "",
        });
        setIsDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDrivers = [...drivers]
    .filter((d) => !isExpired(d.departure_date, d.departure_time))
    .filter((d) => filterOrigin === "all" || d.origin === filterOrigin)
    .filter((d) => filterDestination === "all" || d.destination === filterDestination)
    .filter((d) => !filterDate || d.departure_date === filterDate)
    .sort((a, b) => {
      const tA = new Date(`${a.departure_date}T${a.departure_time || '00:00'}`).getTime();
      const tB = new Date(`${b.departure_date}T${b.departure_time || '00:00'}`).getTime();
      if (isNaN(tA)) return 1;
      if (isNaN(tB)) return -1;
      return tA - tB;
    });

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Disponibilidades de Motoristas
              </h1>
              <HelpButton pageKey="disponibilidades" />
            </div>
            <p className="text-muted-foreground">
              Encontre motoristas disponíveis ou ofereça sua disponibilidade
            </p>
          </div>

          {isLoggedIn ? (
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
                    <Select value={newDriver.origin} onValueChange={(value) => setNewDriver({ ...newDriver, origin: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select value={newDriver.destination} onValueChange={(value) => setNewDriver({ ...newDriver, destination: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Serviço</Label>
                    <Select value={newDriver.service_type} onValueChange={(value) => setNewDriver({ ...newDriver, service_type: value })}>
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
                      onChange={(e) => setNewDriver({ ...newDriver, vehicle_info: e.target.value })}
                    />
                  </div>

                  {newDriver.service_type !== 'ambos' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Assentos Disponíveis</Label>
                        <Input
                          type="number"
                          placeholder="4"
                          min="1"
                          max="50"
                          value={newDriver.available_seats}
                          onChange={(e) => setNewDriver({ ...newDriver, available_seats: e.target.value })}
                        />
                      </div>
                      {newDriver.service_type === 'coletivo' ? (
                        <div className="space-y-2">
                          <Label>Preço por Assento (R$)</Label>
                          <Input
                            type="number"
                            placeholder="0,00"
                            min="0"
                            step="0.01"
                            value={newDriver.price}
                            onChange={(e) => setNewDriver({ ...newDriver, price: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Valor Total (R$)</Label>
                          <Input
                            type="number"
                            placeholder="0,00"
                            min="0"
                            step="0.01"
                            value={newDriver.price_private}
                            onChange={(e) => setNewDriver({ ...newDriver, price_private: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Assentos Disponíveis</Label>
                        <Input
                          type="number"
                          placeholder="4"
                          min="1"
                          max="50"
                          value={newDriver.available_seats}
                          onChange={(e) => setNewDriver({ ...newDriver, available_seats: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preço por Assento (R$)</Label>
                          <Input
                            type="number"
                            placeholder="0,00"
                            min="0"
                            step="0.01"
                            value={newDriver.price}
                            onChange={(e) => setNewDriver({ ...newDriver, price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Total Privativo (R$)</Label>
                          <Input
                            type="number"
                            placeholder="0,00"
                            min="0"
                            step="0.01"
                            value={newDriver.price_private}
                            onChange={(e) => setNewDriver({ ...newDriver, price_private: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={newDriver.departure_date}
                        onChange={(e) => setNewDriver({ ...newDriver, departure_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={newDriver.departure_time}
                        onChange={(e) => setNewDriver({ ...newDriver, departure_time: e.target.value })}
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
                            setNewDriver({ ...newDriver, has_trailer: checked as boolean })
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
                            setNewDriver({ ...newDriver, has_rooftop_carrier: checked as boolean })
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
                      onChange={(e) => setNewDriver({ ...newDriver, additional_info: e.target.value })}
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
          ) : (
            <Button variant="primary" className="mt-4 sm:mt-0" onClick={() => navigate("/login")}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disponibilidade
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Origem</Label>
            <Select value={filterOrigin} onValueChange={setFilterOrigin}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Destino</Label>
            <Select value={filterDestination} onValueChange={setFilterDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
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
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum motorista disponível</h3>
            <p className="text-muted-foreground mb-4">
              {filterOrigin !== "all" || filterDestination !== "all" || filterDate
                ? "Tente ajustar os filtros."
                : "Seja o primeiro a cadastrar uma disponibilidade!"}
            </p>
            {(!filterOrigin || filterOrigin === "all") && !filterDate && (
              <Button variant="primary" onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Disponibilidade
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => {
              const expired = isExpired(driver.departure_date, driver.departure_time);
              const route = `${driver.origin} → ${driver.destination}`;
              const serviceType = (driver as any).service_type as string | undefined;
              const serviceLabel = serviceType === 'ambos'
                ? 'Coletivo e Privativo'
                : serviceType
                  ? serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
                  : 'Coletivo';

              return (
                <Card key={driver.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                          {driver.profiles?.full_name || 'Motorista'}
                          {driver.profiles?.rating_count ? (
                            <RatingStars
                              value={driver.profiles.rating_avg ?? 0}
                              count={driver.profiles.rating_count}
                              onClick={() => setReviewsDialog({ userId: driver.user_id, userName: driver.profiles!.full_name })}
                            />
                          ) : null}
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
                      <span>Serviço: {serviceLabel}</span>
                    </div>

                    {(driver as any).service_type !== 'privativo' && (driver as any).price > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>R$ {Number((driver as any).price).toFixed(2)} por assento</span>
                      </div>
                    )}
                    {(driver as any).service_type !== 'coletivo' && (driver as any).price_private > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>R$ {Number((driver as any).price_private).toFixed(2)} total (privativo)</span>
                      </div>
                    )}

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

                    <div className="flex flex-col gap-2 mt-4">
                      {!expired && driver.status === 'active' && driver.profiles?.phone && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            const whatsappLink = generateWhatsAppLink(
                              driver.profiles!.phone,
                              'driver',
                              {
                                name: driver.profiles!.full_name,
                                route: route,
                                date: driver.departure_date,
                                time: driver.departure_time,
                                vehicle: driver.vehicle_info || 'Veículo',
                              }
                            );
                            window.open(whatsappLink, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Entrar em Contato
                        </Button>
                      )}
                      {!expired && driver.status === 'active' && driver.user_id !== auth.currentUser?.uid && (() => {
                        const req = myRequestsMap[driver.id];
                        const isPending = req?.status === 'pending';
                        const isAccepted = req?.status === 'accepted';
                        const isRejected = req?.status === 'rejected';
                        return (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={isPending || isAccepted || requestingId === driver.id}
                            onClick={() => !isPending && !isAccepted && handleSolicitar(driver)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {requestingId === driver.id ? 'Enviando...'
                              : isPending ? 'Solicitação enviada'
                              : isAccepted ? 'Solicitação aceita ✓'
                              : isRejected ? 'Solicitar novamente'
                              : 'Solicitar Disponibilidade'}
                          </Button>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {reviewsDialog && (
        <ReviewsDialog
          open={!!reviewsDialog}
          onOpenChange={open => !open && setReviewsDialog(null)}
          userId={reviewsDialog.userId}
          userName={reviewsDialog.userName}
        />
      )}
    </div>
  );
}
