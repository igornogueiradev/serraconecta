import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import LeadsPage from "./pages/LeadsPage";
import NotFound from "./pages/NotFound";
import QuestionarioCliente from "./pages/QuestionarioCliente";
import Dashboard from "./pages/financeiro/Dashboard";
import NovaReceita from "./pages/financeiro/NovaReceita";
import EditarReceita from "./pages/financeiro/EditarReceita";
import NovoGasto from "./pages/financeiro/NovoGasto";
import EditarGasto from "./pages/financeiro/EditarGasto";
import Historico from "./pages/financeiro/Historico";
import Relatorios from "./pages/financeiro/Relatorios";
import Agenda from "./pages/financeiro/Agenda";
import NovoAgendamento from "./pages/financeiro/NovoAgendamento";
import EditarAgendamento from "./pages/financeiro/EditarAgendamento";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUserName(profileSnap.data()?.full_name || "Igor");
      } else {
        setUserName("");
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (name: string) => {
    setUserName(name);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              {user && <AppSidebar />}
              <main className="flex-1 pb-16 md:pb-0">
                {user && (
                  <div className="md:hidden sticky top-0 z-50 bg-background border-b px-4 py-2">
                    <SidebarTrigger />
                  </div>
                )}
                <Routes>
                  <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
                  <Route path="/" element={user ? <HomePage userName={userName} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
                  <Route path="/leads" element={user ? <LeadsPage /> : <Navigate to="/login" replace />} />
                  <Route path="/perfil" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/nova-receita" element={user ? <NovaReceita /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/editar-receita/:id" element={user ? <EditarReceita /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/novo-gasto" element={user ? <NovoGasto /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/editar-gasto/:id" element={user ? <EditarGasto /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/historico" element={user ? <Historico /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/relatorios" element={user ? <Relatorios /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/agenda" element={user ? <Agenda /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/novo-agendamento" element={user ? <NovoAgendamento /> : <Navigate to="/login" replace />} />
                  <Route path="/financeiro/editar-agendamento/:id" element={user ? <EditarAgendamento /> : <Navigate to="/login" replace />} />
                  <Route path="/q/:id" element={<QuestionarioCliente />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              {user && <BottomNav />}
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
