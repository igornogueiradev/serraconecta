import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HelpButton } from '@/components/HelpButton';
import type { HelpPageKey } from '@/config/helpContent';

interface FinanceiroLayoutProps {
  titulo: string;
  children: React.ReactNode;
  voltar?: boolean;
  acaoDir?: React.ReactNode;
  helpKey?: HelpPageKey;
}

export function FinanceiroLayout({ titulo, children, voltar, acaoDir, helpKey }: FinanceiroLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {voltar && (
            <button onClick={() => navigate(-1)} className="p-1 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="font-semibold text-slate-800">{titulo}</h2>
          {helpKey && <HelpButton pageKey={helpKey} />}
        </div>
        {acaoDir}
      </div>
      <main className="max-w-lg mx-auto w-full px-4 py-4 pb-10">
        {children}
      </main>
    </div>
  );
}
