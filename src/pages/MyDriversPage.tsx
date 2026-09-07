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
import { Car, Users, MapPin, Clock, Edit, Trash2, Truck, Package, Copy, Check, ChevronDown, ChevronUp, CheckCircle, XCircle, Star, DollarSign } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { useDrivers } from "@/hooks/useDrivers";
import { useRequests } from "@/hooks/useRequests";
import { useRatings } from "@/hooks/useRatings";
import { RatingDialog } from "@/components/RatingDialog";
import { RatingStars } from "@/components/RatingStars";
import { ReviewsDialog } from "@/components/ReviewsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";
import { generateShareText, generateOwnerWhatsAppLink } from "@/utils/whatsapp";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Driver, Request } from '@/integrations/firebase/types';

interface MyDriversPageProps {
  userName: string;
  onLogout: () => void;
}

export default function MyDriversPage({ userName, onLogout }: MyDriversPageProps) {
  const { deleteDriver, updateDriver, fetchMyDrivers, isLoading } = useDrivers();
  const { fetchRequestsForOwner, updateRequestStatus, fetchUsersByIds } = useRequests();
  const { hasRated } = useRatings();
  const { toast } = useToast();
  const [myDrivers, setMyDrivers] = useState<Driver[]>([]);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [requestsByDriver, setRequestsByDriver] = useState<Record<string, Request[]>>({});
  const [expandedRequests, setExpandedRequests] = useState<string | null>(null);
  const [ratedOwnerSet, setRatedOwnerSet] = useState<Set<string>>(new Set());
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, { rating_avg?: number; rating_count?: number }>>({});
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; requestId: string; userId: string; name: string } | null>(null);
  const [reviewsDialog, setReviewsDialog] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    loadMyDrivers();
  }, []);

  const loadMyDrivers = async () => {
    const drivers = await fetchMyDrivers();
    setMyDrivers(drivers || []);
    const reqs = await fetchRequestsForOwner();
    const map: Record<string, Request[]> = {};
    reqs.filter(r => r.type === 'driver').forEach(r => {
      if (!map[r.reference_id]) map[r.reference_id] = [];
      map[r.reference_id].push(r);
    });
    setRequestsByDriver(map);
    // Verifica quais solicitações concluídas já foram avaliadas
    const completedReqs = reqs.filter(r => r.type === 'driver' && r.status === 'completed' && r.id);
    const ratedResults = await Promise.all(completedReqs.map(r => hasRated(r.id!).then(rated => [r.id!, rated] as const)));
    setRatedOwnerSet(new Set(ratedResults.filter(([, rated]) => rated).map(([id]) => id)));
    // Carrega perfis dos solicitantes para exibir ratings
    const requesterIds = [...new Set(reqs.filter(r => r.type === 'driver').map(r => r.requester_id))];
    const profiles = await fetchUsersByIds(requesterIds);
    setRequesterProfiles(profiles);
  };

  const handleAcceptRequest = async (req: Request, driver: Driver) => {
    const ok = await updateRequestStatus(req.id!, 'accepted');
    if (ok) {
      setRequestsByDriver(prev => ({
        ...prev,
        [req.reference_id]: prev[req.reference_id].map(r => r.id === req.id ? { ...r, status: 'accepted' } : r),
      }));
      // Marca o card como inativo — não aceita mais solicitações
      await updateDriver(driver.id, { status: 'inactive' });
      setMyDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'inactive' } : d));
    }
  };

  const handleCompleteRequest = async (req: Request) => {
    const ok = await updateRequestStatus(req.id!, 'completed');
    if (ok) {
      setRequestsByDriver(prev => ({
        ...prev,
        [req.reference_id]: prev[req.reference_id].map(r => r.id === req.id ? { ...r, status: 'completed' } : r),
      }));
      await updateDriver(req.reference_id, { status: 'inactive' });
      setMyDrivers(prev => prev.map(d => d.id === req.reference_id ? { ...d, status: 'inactive' } : d));
    }
  };

  const openWhatsAppForRequest = (req: Request, driver: Driver) => {
    if (!req.requester_phone) return;
    const link = generateOwnerWhatsAppLink(req.requester_phone, 'driver', {
      requesterName: req.requester_name,
      route: `${driver.origin} → ${driver.destination}`,
      date: driver.departure_date,
      time: driver.departure_time,
    });
    window.open(link, '_blank');
  };

  const handleRejectRequest = async (req: Request) => {
    const ok = await updateRequestStatus(req.id!, 'rejected');
    if (ok) {
      setRequestsByDriver(prev => ({
        ...prev,
        [req.reference_id]: prev[req.reference_id].map(r => r.id === req.id ? { ...r, status: 'rejected' } : r),
      }));
    }
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
      // Ao reativar, rejeita solicitações que estavam aceitas (o serviço não foi realizado)
      if (newStatus === 'active') {
        const acceptedReqs = (requestsByDriver[driver.id] ?? []).filter(r => r.status === 'accepted');
        if (acceptedReqs.length > 0) {
          await Promise.all(acceptedReqs.map(req => updateRequestStatus(req.id!, 'rejected')));
          setRequestsByDriver(prev => ({
            ...prev,
            [driver.id]: (prev[driver.id] ?? []).map(r =>
              r.status === 'accepted' ? { ...r, status: 'rejected' } : r
            ),
          }));
        }
      }
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
        price: editingDriver.price,
        price_private: (editingDriver as any).price_private,
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

  const handleCopyShare = async (driver: Driver) => {
    const text = generateShareText({
      origin: driver.origin,
      destination: driver.destination,
      departure_date: driver.departure_date,
      departure_time: driver.departure_time,
      available_seats: driver.available_seats,
      service_type: (driver as any).service_type,
      vehicle_info: driver.vehicle_info,
      additional_info: driver.additional_info,
      has_trailer: driver.has_trailer,
      has_rooftop_carrier: driver.has_rooftop_carrier,
    });
    await navigator.clipboard.writeText(text);
    setCopiedId(driver.id);
    toast({ title: "Texto copiado!", description: "Cole nos grupos de WhatsApp." });
    setTimeout(() => setCopiedId(null), 2500);
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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Minhas Disponibilidades
            </h1>
            <HelpButton pageKey="minhas-disponibilidades" />
          </div>
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

                    {(driver as any).service_type !== 'privativo' && driver.price > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>R$ {driver.price.toFixed(2)} por assento</span>
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
                      <p className="text-sm text-muted-foreground border-t pt-3">
                        {driver.additional_info.length > 80 
                          ? `${driver.additional_info.substring(0, 80)}...` 
                          : driver.additional_info
                        }
                      </p>
                    )}
                    
                    {!expired && driver.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCopyShare(driver)}
                      >
                        {copiedId === driver.id
                          ? <><Check className="w-4 h-4 mr-1" />Copiado!</>
                          : <><Copy className="w-4 h-4 mr-1" />Copiar para WhatsApp</>
                        }
                      </Button>
                    )}

                    {/* Seção de solicitações recebidas */}
                    {(() => {
                      const reqs = requestsByDriver[driver.id] ?? [];
                      if (reqs.length === 0) return null;
                      const pendingCount = reqs.filter(r => r.status === 'pending').length;
                      const isExpanded = expandedRequests === driver.id;
                      return (
                        <div className="border rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition-colors"
                            onClick={() => setExpandedRequests(isExpanded ? null : driver.id)}
                          >
                            <span>
                              Solicitações ({reqs.length})
                              {pendingCount > 0 && <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {isExpanded && (
                            <div className="divide-y">
                              {reqs.map(req => (
                                <div key={req.id} className="p-3 bg-white text-sm">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <p className="font-medium text-slate-800 truncate">{req.requester_name}</p>
                                        {(() => {
                                          const p = requesterProfiles[req.requester_id];
                                          return p?.rating_count ? <RatingStars value={p.rating_avg ?? 0} count={p.rating_count} size="sm" onClick={() => setReviewsDialog({ userId: req.requester_id, userName: req.requester_name })} /> : null;
                                        })()}
                                      </div>
                                      {req.message && <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{req.message}</p>}
                                      <p className="text-xs text-slate-400 mt-1">
                                        {req.status === 'pending' && '⏳ Aguardando'}
                                        {req.status === 'accepted' && '✅ Aceita'}
                                        {req.status === 'rejected' && '❌ Rejeitada'}
                                        {req.status === 'completed' && '🏁 Concluída'}
                                        {req.status === 'cancelled' && '🚫 Cancelada pelo solicitante'}
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                      {req.status === 'pending' && (
                                        <>
                                          <Button size="sm" className="h-7 text-xs" onClick={() => handleAcceptRequest(req, driver)}>
                                            <CheckCircle className="w-3 h-3 mr-1" />Aceitar
                                          </Button>
                                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRejectRequest(req)}>
                                            <XCircle className="w-3 h-3 mr-1" />Rejeitar
                                          </Button>
                                        </>
                                      )}
                                      {req.status === 'accepted' && (
                                        <>
                                          {req.requester_phone && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openWhatsAppForRequest(req, driver)}>
                                              <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                                            </Button>
                                          )}
                                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCompleteRequest(req)}>
                                            Concluir
                                          </Button>
                                        </>
                                      )}
                                      {req.status === 'completed' && (
                                        ratedOwnerSet.has(req.id!)
                                          ? <p className="text-xs text-green-600">Avaliado ✓</p>
                                          : <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRatingDialog({ open: true, requestId: req.id!, userId: req.requester_id, name: req.requester_name })}>
                                              <Star className="w-3 h-3 mr-1" />Avaliar
                                            </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

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

      {reviewsDialog && (
        <ReviewsDialog
          open={!!reviewsDialog}
          onOpenChange={open => !open && setReviewsDialog(null)}
          userId={reviewsDialog.userId}
          userName={reviewsDialog.userName}
        />
      )}

      {/* Rating Dialog */}
      {ratingDialog && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={open => !open && setRatingDialog(null)}
          requestId={ratingDialog.requestId}
          ratedUserId={ratingDialog.userId}
          ratedUserName={ratingDialog.name}
          onSuccess={() => {
            if (ratingDialog) setRatedOwnerSet(prev => new Set([...prev, ratingDialog.requestId]));
            setRatingDialog(null);
          }}
        />
      )}

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

              {editingDriver.service_type !== 'privativo' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Preço por Assento (R$)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingDriver.price}
                    onChange={(e) => updateEditingDriver('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              {editingDriver.service_type !== 'coletivo' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-price-private">Valor Total (R$)</Label>
                  <Input
                    id="edit-price-private"
                    type="number"
                    min="0"
                    step="0.01"
                    value={(editingDriver as any).price_private ?? ''}
                    onChange={(e) => updateEditingDriver('price_private' as any, parseFloat(e.target.value) || undefined)}
                  />
                </div>
              )}

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