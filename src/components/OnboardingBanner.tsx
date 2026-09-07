import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'sc_onboarding_v1';

export function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5 mb-6 shadow-lg">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-white/60 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-yellow-300" />
        <p className="font-bold text-base">Bem-vindo à SerraConecta!</p>
      </div>

      <p className="text-sm text-white/90 leading-relaxed mb-4">
        Aqui motoristas da Serra Gaúcha se conectam para otimizar viagens, repassar clientes e controlar suas finanças.
        Em cada tela, toque no ícone <strong className="bg-white/20 px-1 rounded">?</strong> para ver um guia explicativo.
      </p>

      <div className="grid grid-cols-1 gap-1.5 text-sm mb-4">
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span>🚗</span>
          <span><strong>Disponibilidades</strong> — ofereça ou encontre motoristas livres</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span>👥</span>
          <span><strong>Repasses</strong> — divida ou assuma viagens com demanda excedente</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span>📋</span>
          <span><strong>Minhas Solicitações</strong> — acompanhe o que você enviou</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span>💰</span>
          <span><strong>Financeiro</strong> — controle receitas, gastos e lucro</span>
        </div>
      </div>

      <button
        onClick={dismiss}
        className="w-full bg-white text-blue-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
      >
        Entendi, vamos começar!
      </button>
    </div>
  );
}
