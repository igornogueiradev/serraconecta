import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { auth, db } from "@/integrations/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

const ALLOWED_EMAIL = "igor_flavio12@hotmail.com";

interface LoginProps {
  onLogin: (userName: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase().trim() !== ALLOWED_EMAIL) {
      toast({ title: "Acesso restrito", description: "Este painel é de uso exclusivo.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const profileSnap = await getDoc(doc(db, "users", user.uid));
      const fullName = profileSnap.data()?.full_name || "Igor";
      onLogin(fullName);
      navigate("/");
    } catch (error: any) {
      const msg = error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
        ? "Email ou senha incorretos"
        : "Ocorreu um erro inesperado";
      toast({ title: "Erro no login", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-elegant mb-4">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Meu Executivo Gramado</h1>
          <p className="text-white/80 text-sm">Painel de Gestão</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-elegant border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Acesso ao Painel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
