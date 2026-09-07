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
import { Users, MapPin, Clock, Plus, MessageCircle, DollarSign, Send } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { useTrips } from "@/hooks/useTrips";
import { useRequests } from "@/hooks/useRequests";
import { RatingStars } from "@/components/RatingStars";
import { ReviewsDialog } from "@/components/ReviewsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";
import { CITIES } from "@/utils/cities";
import { auth } from "@/integrations/firebase/client";

interface TripsPageProps {
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
}

export default function TripsPage({ isLoggedIn, userName, onLogout }: TripsPageProps) {
  const { trips, isLoading, addTrip } = useTrips();
  const { createRequest, fetchMyRequests } = useRequests();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequestsMap, setMyRequestsMap] = useState<Record<string, { status: string; id: string }>>({});
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [reviewsDialog, setReviewsDialog] = useState<{ userId: string; userName: string } | null>(null);

  React.useEffect(() => {
    if (!isLoggedIn) return;
    fetchMyRequests().then(reqs => {
      const map: Record<string, { status: string; id: string }> = {};
      reqs.filter(r => r.type === 'trip').forEach(r => {
        if (!map[r.reference_id]) map[r.reference_id] = { status: r.status, id: r.id! };
      });
      setMyRequestsMap(map);
    });
  }, [isLoggedIn]);

  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterDestination, setFilterDestination] = useState("all");
  const [filterDate, setFilterDate] = useState("");

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
    service_type: "coletivo",
    price: "",
  });

  const handleSolicitar = async (trip: typeof trips[0]) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setRequestingId(trip.id);
    const id = await createRequest({
      type: 'trip',
      reference_id: trip.id,
      owner_id: trip.user_id,
      owner_name: trip.profiles?.full_name,
      origin: trip.origin,
      destination: trip.destination,
      departure_date: trip.departure_date,
      departure_time: trip.departure_time,
    });
    if (id) setMyRequestsMap(prev => ({ ...prev, [trip.id]: { status: 'pending', id } }));
    setRequestingId(null);
  };

  const handleOfferClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const tripData = {
        origin: newTrip.origin,
        destination: newTrip.destination,
        passengers_count: parseInt(newTrip.adults_count) + parseInt(newTrip.children_count) || 1,
        departure_date: newTrip.departure_date,
        departure_time: newTrip.departure_time,
        additional_info: newTrip.additional_info || null,
        baggage_23kg: parseInt(newTrip.luggage_23kg) || 0,
        baggage_10kg: parseInt(newTrip.luggage_10kg) || 0,
        baggage_bags: parseInt(newTrip.bags_backpacks) || 0,
        adults_count: parseInt(newTrip.adults_count) || 1,
        children_count: parseInt(newTrip.children_count) || 0,
        service_type: newTrip.service_type,
        price: parseFloat(newTrip.price) || 0,
        status: 'active' as const,
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
          service_type: "coletivo",
          price: "",
        });
        setIsDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrips = [...trips]
    .filter((t) => !isExpired(t.departure_date, t.departure_time))
    .filter((t) => filterOrigin === "all" || t.origin === filterOrigin)
    .filter((t) => filterDestination === "all" || t.destination === filterDestination)
    .filter((t) => !filterDate || t.departure_date === filterDate)
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
                Repasses Ofertados
              </h1>
              <HelpButton pageKey="repasses" />
            </div>
            <p className="text-muted-foreground">
              Encontre repasses que precisam de motorista ou oferte um novo repasse
            </p>
          </div>

          {isLoggedIn ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="mt-4 sm:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Ofertar Repasse
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Nova Oferta de Repasse</DialogTitle>
                  <DialogDescription>
                    Crie uma oferta quando não encontrar motoristas disponíveis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select value={newTrip.origin} onValueChange={(value) => setNewTrip({ ...newTrip, origin: value })}>
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
                    <Select value={newTrip.destination} onValueChange={(value) => setNewTrip({ ...newTrip, destination: value })}>
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
                    <Select value={newTrip.service_type} onValueChange={(value) => setNewTrip({ ...newTrip, service_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coletivo">Coletivo</SelectItem>
                        <SelectItem value="privativo">Privativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor do Serviço (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      value={newTrip.price}
                      onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                    />
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
                        onChange={(e) => setNewTrip({ ...newTrip, adults_count: e.target.value })}
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
                        onChange={(e) => setNewTrip({ ...newTrip, children_count: e.target.value })}
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
                          onChange={(e) => setNewTrip({ ...newTrip, luggage_23kg: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bagagens 10kg</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={newTrip.luggage_10kg}
                          onChange={(e) => setNewTrip({ ...newTrip, luggage_10kg: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bolsas/Mochilas</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={newTrip.bags_backpacks}
                          onChange={(e) => setNewTrip({ ...newTrip, bags_backpacks: e.target.value })}
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
                        onChange={(e) => setNewTrip({ ...newTrip, departure_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={newTrip.departure_time}
                        onChange={(e) => setNewTrip({ ...newTrip, departure_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Detalhes sobre a viagem, flexibilidade de horários, pontos de encontro..."
                      value={newTrip.additional_info}
                      onChange={(e) => setNewTrip({ ...newTrip, additional_info: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    variant="secondary"
                    disabled={isSubmitting || !newTrip.origin || !newTrip.destination || !newTrip.departure_date}
                  >
                    {isSubmitting ? "Ofertando..." : "Ofertar Repasse"}
                  </Button>
                </div>
              </DialogContent>
          </Dialog>
          ) : (
            <Button variant="secondary" className="mt-4 sm:mt-0" onClick={() => navigate("/login")}>
              <Plus className="w-4 h-4 mr-2" />
              Ofertar Repasse
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
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum repasse ofertado</h3>
            <p className="text-muted-foreground mb-4">
              {filterOrigin !== "all" || filterDestination !== "all" || filterDate
                ? "Tente ajustar os filtros."
                : "Seja o primeiro a ofertar um repasse!"}
            </p>
            {filterOrigin === "all" && filterDestination === "all" && !filterDate && (
              <Button variant="secondary" onClick={handleOfferClick}>
                <Plus className="w-4 h-4 mr-2" />
                Ofertar Repasse
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const expired = isExpired(trip.departure_date, trip.departure_time);
              const route = `${trip.origin} → ${trip.destination}`;
              const serviceType = (trip as any).service_type as string | undefined;

              return (
                <Card key={trip.id} className={`shadow-card hover:shadow-elegant transition-all duration-300 ${expired ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                          {trip.profiles?.full_name || 'Motorista'}
                          {trip.profiles?.rating_count ? (
                            <RatingStars
                              value={trip.profiles.rating_avg ?? 0}
                              count={trip.profiles.rating_count}
                              onClick={() => setReviewsDialog({ userId: trip.user_id, userName: trip.profiles!.full_name })}
                            />
                          ) : null}
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
                      <span>Serviço: {serviceType ? serviceType.charAt(0).toUpperCase() + serviceType.slice(1) : 'Coletivo'}</span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center gap-2 mb-1">🧳 Bagagens:</p>
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
                        <p className="flex items-center gap-2">👨‍💼 {(trip as any).adults_count} adultos</p>
                      )}
                      {(trip as any).children_count > 0 && (
                        <p className="flex items-center gap-2">👶 {(trip as any).children_count} crianças</p>
                      )}
                    </div>

                    {(trip as any).price > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Valor do serviço: R$ {Number((trip as any).price).toFixed(2)}</span>
                      </div>
                    )}

                    {trip.additional_info && (
                      <p className="text-sm text-muted-foreground">
                        {trip.additional_info}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 mt-4">
                      {!expired && trip.status === 'active' && trip.profiles?.phone && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            const whatsappLink = generateWhatsAppLink(
                              trip.profiles!.phone,
                              'trip',
                              {
                                name: trip.profiles!.full_name,
                                route: route,
                                date: trip.departure_date,
                                time: trip.departure_time,
                              }
                            );
                            window.open(whatsappLink, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Entrar em Contato
                        </Button>
                      )}
                      {!expired && trip.status === 'active' && trip.user_id !== auth.currentUser?.uid && (() => {
                        const req = myRequestsMap[trip.id];
                        const isPending = req?.status === 'pending';
                        const isAccepted = req?.status === 'accepted';
                        const isRejected = req?.status === 'rejected';
                        return (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={isPending || isAccepted || requestingId === trip.id}
                            onClick={() => !isPending && !isAccepted && handleSolicitar(trip)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {requestingId === trip.id ? 'Enviando...'
                              : isPending ? 'Solicitação enviada'
                              : isAccepted ? 'Solicitação aceita ✓'
                              : isRejected ? 'Solicitar novamente'
                              : 'Solicitar via Plataforma'}
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
