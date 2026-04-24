import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import DriversPage from "./pages/DriversPage";
import TripsPage from "./pages/TripsPage";
import MyDriversPage from "./pages/MyDriversPage";
import MyTripsPage from "./pages/MyTripsPage";
import NotFound from "./pages/NotFound";
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
        setUserName(profileSnap.data()?.full_name || "Usuário");
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
              <main className="flex-1">
                {user && (
                  <div className="md:hidden sticky top-0 z-50 bg-background border-b px-4 py-2">
                    <SidebarTrigger />
                  </div>
                )}
                <Routes>
                  <Route
                    path="/login"
                    element={
                      user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
                    }
                  />
                  <Route
                    path="/"
                    element={
                      user ?
                        <HomePage userName={userName} onLogout={handleLogout} /> :
                        <Navigate to="/login" replace />
                    }
                  />
                  <Route
                    path="/drivers"
                    element={
                      <DriversPage isLoggedIn={!!user} userName={userName} onLogout={handleLogout} />
                    }
                  />
                  <Route
                    path="/trips"
                    element={
                      <TripsPage isLoggedIn={!!user} userName={userName} onLogout={handleLogout} />
                    }
                  />
                  <Route
                    path="/my-drivers"
                    element={
                      user ?
                        <MyDriversPage userName={userName} onLogout={handleLogout} /> :
                        <Navigate to="/login" replace />
                    }
                  />
                  <Route
                    path="/my-trips"
                    element={
                      user ?
                        <MyTripsPage userName={userName} onLogout={handleLogout} /> :
                        <Navigate to="/login" replace />
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
