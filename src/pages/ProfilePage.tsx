import { useState, useEffect } from 'react';
import { Building2, Phone, Save } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/integrations/firebase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function ProfilePage() {
  const { profile, loading, updateProfile } = useUserProfile();
  const { toast } = useToast();

  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setAgencyName(profile.agency_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ agency_name: agencyName, phone });
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Não foi possível salvar o perfil.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={true} userName={profile?.full_name} onLogout={() => signOut(auth)} />
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Meu Perfil</h1>

        {/* Upload de logo desativado (Firebase Storage é pago).
            O hook useUserProfile expõe uploadLogo() quando for reativado.
        <LogoUploadSection profile={profile} onUpload={uploadLogo} />
        */}

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Building2 size={14} /> Nome da Agência
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Ex: Serra Sul Transportes"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Phone size={14} /> Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(54) 99999-9999"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </div>
    </div>
  );
}
