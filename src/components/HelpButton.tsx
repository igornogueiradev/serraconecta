import { useState } from 'react';
import { HelpCircle, ChevronRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { HELP_CONTENT, type HelpPageKey } from '@/config/helpContent';

interface HelpButtonProps {
  pageKey: HelpPageKey;
}

export function HelpButton({ pageKey }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const content = HELP_CONTENT[pageKey];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex-shrink-0"
        title="Como funciona esta tela?"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-5 pb-8">
          <SheetHeader className="pb-3 pt-1">
            <SheetTitle className="flex items-center gap-2 text-left text-base">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
              {content.title}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* Para que serve */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Para que serve?</p>
              <p className="text-sm text-blue-900 leading-relaxed">{content.description}</p>
            </div>

            {/* Benefício */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Qual o benefício?
              </p>
              <p className="text-sm text-emerald-900 leading-relaxed">{content.benefit}</p>
            </div>

            {/* Passo a passo */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Passo a passo:</p>
              <div className="space-y-2.5">
                {content.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exemplos práticos */}
            {content.examples && content.examples.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Exemplos práticos:</p>
                <div className="space-y-2">
                  {content.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-900 leading-relaxed">{ex}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dicas */}
            {content.tips && content.tips.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dicas:</p>
                {content.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full mt-2" onClick={() => setOpen(false)}>
              Entendi, obrigado!
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
