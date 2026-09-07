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
import { Users, MapPin, Edit, Trash2, Clock, Car, Copy, Check, ChevronDown, ChevronUp, CheckCircle, XCircle, Star } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { useTrips } from "@/hooks/useTrips";
import { useRequests } from "@/hooks/useRequests";
import { useRatings } from "@/hooks/useRatings";
import { RatingDialog } from "@/components/RatingDialog";
import { RatingStars } from "@/components/RatingStars";
import { generateTripShareText, generateOwnerWhatsAppLink } from "@/utils/whatsapp";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired, formatDateTime } from "@/utils/timeUtils";
import type { Trip, Request } from '@/integrations/firebase/types';

interface MyTripsPageProps {
  userName: string;
  onLogout: () => void;
}

export default function MyTripsPage({ userName, onLogout }: MyTripsPageProps) {
  const { deleteTrip, updateTrip, fetchMyTrips, isLoading } = useTrips();
  const { fetchRequestsForOwner, updateRequestStatus, fetchUsersByIds } = useRequests();
  const { hasRated } = useRatings();
  const { toast } = useToast();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [requestsByTrip, setRequestsByTrip] = useState<Record<string, Request[]>>({});
  const [expandedRequests, setExpandedRequests] = useState<string | null>(null);
  const [ratedOwnerSet, setRatedOwnerSet] = useState<Set<string>>(new Set());
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, { rating_avg?: number; rating_count?: number }>>({});
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; requestId: string; userId: string; name: string } | null>(null);
  const [reviewsDialog, setReviewsDialog] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    loadMyTrips();
  }, []);

  const loadMyTrips = async () => {
    const trips = await fetchMyTrips();
    setMyTrips(trips || []);
    const reqs = await fetchRequestsForOwner();
    const map: Record<string, Request[]> = {};
    reqs.filter(r => r.type === 'trip').forEach(r => {
      if (!map[r.reference_id]) map[r.reference_id] = [];
      map[r.reference_id].push(r);
    });
    setRequestsByTrip(map);
    const completedReqs = reqs.filter(r => r.type === 'trip' && r.status === 'completed' && r.id);
    const ratedResults = await Promise.all(completedReqs.map(r => hasRated(r.id!).then(rated => [r.id!, rated] as const)));
    setRatedOwnerSet(new Set(ratedResults.filter(([, rated]) => rated).map(([id]) => id)));
    const requesterIds = [...new Set(reqs.filter(r => r.type === 'trip').map(r => r.requester_id))];
    const profiles = await fetchUsersByIds(requesterIds);
    setRequesterProfiles(profiles);
  };

  const handleAcceptRequest = async (req: Request, trip: Trip) => {
    const ok = await updateRequestStatus(req.id!, 'accepted');
    if (ok) {
      setRequestsByTrip(prev => ({
        ...prev,
        [req.reference_id]: prev[req.reference_id].map(r => r.id === req.id ? { ...r, status: 'accepted' } : r),
      }));
      await updateTrip(trip.id, { status: 'accepted' });
      setMyTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'accepted' } : t));
    }
  };

  const handleCompleteRequest = async (req: Request) => {
    const ok = await updateRequestStatus(req.id!, 'completed');
    if (ok) {
      setRequestsByTrip(prev => ({
        ...prev,
        [req.reference_id]: prev[req.reference_id].map(r => r.id === req.id ? { ...r, status: 'completed' } : r),
      }));
      await updateTrip(req.reference_id, { status: 'completed' });
      setMyTrips(prev => prev.map(t => t.id === req.reference_id ? { ...t, status: 'completed' } : t));
    }
  };

  const openWhatsAppForRequest = (req: Request, trip: Trip) => {
    if (!req.requester_phone) return;
    const link = generateOwnerWhatsAppLink(req.requester_phone, 'trip', {
      requesterName: req.requester_name,
      route: `${trip.origin} → ${trip.destination}`,
      date: trip.departure_date,
      time: trip.departure_time,
    });
    window.open(link, '_blank');
  };

  const handleRejectRequest = async (req: Request) => {
    const ok = await updateRequestStatus(req.id!, 'rejected');
    if (ok) {
      setRequestsByTrip(prev => ({
        ...prev,
        [req.reference_id]: prev[req.reference_id].map(r => r.id === req.id ? { ...r, status: 'rejected' } : r),
      }));
    }
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

  const handleCopyShare = async (trip: Trip) => {
    const text = generateTripShareText({
      origin: trip.origin,
      destination: trip.destination,
      departure_date: trip.departure_date,
      departure_time: trip.departure_time,
      adults_count: (trip as any).adults_count || 1,
      children_count: (trip as any).children_count || 0,
      service_type: (trip as any).service_type,
      baggage_23kg: (trip as any).baggage_23kg || 0,
      baggage_10kg: (trip as any).baggage_10kg || 0,
      baggage_bags: (trip as any).baggage_bags || 0,
      additional_info: trip.additional_info,
    });
    await navigator.clipboard.writeText(text);
    setCopiedId(trip.id);
    toast({ title: "Texto copiado!", description: "Cole nos grupos de WhatsApp." });
    setTimeout(() => setCopiedId(null), 2500);
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
              Meus Repasses Ofertados
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus repasses ofertados
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
              Meus Repasses Ofertados
            </h1>
            <HelpButton pageKey="meus-repasses" />
          </div>
          <p className="text-muted-foreground">
            Gerencie seus repasses ofertados
          </p>
        </div>

        {myTrips.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum repasse ofertado
            </h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não criou nenhum repasse.
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
                    
                    {!expired && trip.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCopyShare(trip)}
                      >
                        {copiedId === trip.id
                          ? <><Check className="w-4 h-4 mr-1" />Copiado!</>
                          : <><Copy className="w-4 h-4 mr-1" />Copiar para WhatsApp</>
                        }
                      </Button>
                    )}

                    {/* Seção de solicitações recebidas */}
                    {(() => {
                      const reqs = requestsByTrip[trip.id] ?? [];
                      if (reqs.length === 0) return null;
                      const pendingCount = reqs.filter(r => r.status === 'pending').length;
                      const isExpanded = expandedRequests === trip.id;
                      return (
                        <div className="border rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition-colors"
                            onClick={() => setExpandedRequests(isExpanded ? null : trip.id)}
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
                                          <Button size="sm" className="h-7 text-xs" onClick={() => handleAcceptRequest(req, trip)}>
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
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openWhatsAppForRequest(req, trip)}>
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
            <DialogTitle>Editar Repasse</DialogTitle>
            <DialogDescription>
              Atualize as informações do seu repasse
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