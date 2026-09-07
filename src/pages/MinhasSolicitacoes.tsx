import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Send, Star, Navigation } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { useRequests } from "@/hooks/useRequests";
import { useRatings } from "@/hooks/useRatings";
import { RatingDialog } from "@/components/RatingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Request } from "@/integrations/firebase/types";

interface MinhasSolicitacoesProps {
  userName: string;
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:   { label: "⏳ Aguardando",  className: "bg-slate-100 text-slate-700 border-slate-300" },
  accepted:  { label: "Aceita ✓",      className: "bg-green-600 text-white border-transparent" },
  rejected:  { label: "Recusada",      className: "bg-red-500 text-white border-transparent" },
  completed: { label: "Concluída",     className: "bg-blue-600 text-white border-transparent" },
  cancelled: { label: "Cancelada",     className: "bg-red-500 text-white border-transparent" },
};

export default function MinhasSolicitacoes({ userName, onLogout }: MinhasSolicitacoesProps) {
  const { fetchMyRequests, updateRequestStatus } = useRequests();
  const { hasRated } = useRatings();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratedSet, setRatedSet] = useState<Set<string>>(new Set());
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; requestId: string; userId: string; name: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const reqs = await fetchMyRequests();
    setRequests(reqs);

    // Verifica quais já foram avaliados
    const completedIds = reqs.filter(r => r.status === 'completed').map(r => r.id!);
    const ratedResults = await Promise.all(completedIds.map(id => hasRated(id).then(rated => [id, rated] as const)));
    const rated = new Set(ratedResults.filter(([, r]) => r).map(([id]) => id));
    setRatedSet(rated);
    setLoading(false);
  };

  const handleCancel = async (req: Request) => {
    const ok = await updateRequestStatus(req.id!, 'cancelled');
    if (ok) setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'cancelled' } : r));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isLoggedIn userName={userName} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Minhas Solicitações</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-card">
                <CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-24 mt-1" /></CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
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
      <Header isLoggedIn userName={userName} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Minhas Solicitações</h1>
            <HelpButton pageKey="minhas-solicitacoes" />
          </div>
          <p className="text-muted-foreground">Acompanhe as solicitações que você enviou</p>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma solicitação enviada</h3>
            <p className="text-muted-foreground">
              Acesse Disponibilidades ou Repasses e clique em "Solicitar" para iniciar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => {
              const statusInfo = STATUS_LABEL[req.status] ?? { label: req.status, variant: "outline" as const };
              const canCancel = req.status === 'pending';
              const canRate = req.status === 'completed' && !ratedSet.has(req.id!);

              return (
                <Card key={req.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">
                          {req.type === 'driver' ? 'Disponibilidade' : 'Repasse'}
                          {req.owner_name && <span className="text-sm font-normal text-muted-foreground ml-1">· {req.owner_name}</span>}
                        </CardTitle>
                        {req.origin && req.destination && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                            <Navigation className="w-3 h-3 flex-shrink-0" />
                            {req.origin} → {req.destination}
                          </p>
                        )}
                        <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                          <Clock className="w-3 h-3" />
                          {req.departure_date
                            ? req.departure_date.split('-').reverse().join('/') + (req.departure_time ? ' às ' + req.departure_time : '')
                            : new Date(req.created_at).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      <Badge className={`flex-shrink-0 ${statusInfo.className}`}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    {req.message && (
                      <p className="text-muted-foreground italic">"{req.message}"</p>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      {canCancel && (
                        <Button variant="outline" size="sm" onClick={() => handleCancel(req)}>
                          Cancelar solicitação
                        </Button>
                      )}
                      {req.status === 'completed' && ratedSet.has(req.id!) && (
                        <p className="text-xs text-muted-foreground text-center">Avaliação enviada ✓</p>
                      )}
                      {canRate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRatingDialog({ open: true, requestId: req.id!, userId: req.owner_id, name: 'Motorista' })}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Avaliar Motorista
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {ratingDialog && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={open => !open && setRatingDialog(null)}
          requestId={ratingDialog.requestId}
          ratedUserId={ratingDialog.userId}
          ratedUserName={ratingDialog.name}
          onSuccess={() => {
            setRatingDialog(null);
            setRatedSet(prev => new Set([...prev, ratingDialog.requestId]));
          }}
        />
      )}
    </div>
  );
}
