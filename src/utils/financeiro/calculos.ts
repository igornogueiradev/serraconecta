import type { Receita, Gasto, DashboardKpis } from '@/integrations/firebase/types';
import { LABEL_APP, LABEL_CATEGORIA, LABEL_TIPO_PARTICULAR } from './formatters';

function fatorTrabalho(g: Gasto): number {
  if (g.kmTripB && g.kmPessoal && g.kmTripB > 0 && g.kmPessoal > 0 && g.kmPessoal < g.kmTripB) {
    return 1 - g.kmPessoal / g.kmTripB;
  }
  return 1;
}

function valorTrabalho(g: Gasto): number {
  return g.valor * fatorTrabalho(g);
}

export function litrosTrabalho(g: Gasto): number {
  return (g.litros ?? 0) * fatorTrabalho(g);
}

export function calcularKpis(receitas: Receita[], gastos: Gasto[]): DashboardKpis {
  const receitaBruta = receitas.reduce((acc, r) => {
    const apps = r.ganhosPorApp.reduce((s, g) => s + g.valor, 0);
    return acc + apps + (r.valorParticular ?? 0) + (r.gorjeta ?? 0) + (r.comissao ?? 0);
  }, 0);

  const totalGastos = gastos.reduce((acc, g) => acc + valorTrabalho(g), 0);
  const lucroLiquido = receitaBruta - totalGastos;
  const kmRodados = receitas.reduce((acc, r) => acc + (r.kmTotal ?? 0), 0);
  const percentGastos = receitaBruta > 0 ? (totalGastos / receitaBruta) * 100 : 0;
  const ganhoPorKm = kmRodados > 0 ? receitaBruta / kmRodados : 0;
  const custoPorKm = kmRodados > 0 ? totalGastos / kmRodados : 0;
  const lucroporKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;

  const mapaGastos: Record<string, number> = {};
  for (const g of gastos) {
    mapaGastos[g.categoria] = (mapaGastos[g.categoria] ?? 0) + valorTrabalho(g);
  }
  const gastosPorCategoria = Object.entries(mapaGastos).map(([cat, valor]) => ({
    categoria: LABEL_CATEGORIA[cat] ?? cat,
    valor,
    percentual: totalGastos > 0 ? (valor / totalGastos) * 100 : 0,
  })).sort((a, b) => b.valor - a.valor);

  const mapaApps: Record<string, number> = {};
  const mapaCorridasApps: Record<string, number> = {};
  const mapaIsApp: Record<string, boolean> = {};

  for (const r of receitas) {
    for (const g of r.ganhosPorApp) {
      const nome = g.app === 'outro' ? (g.appNome ?? 'Outro') : (LABEL_APP[g.app] ?? g.app);
      mapaApps[nome] = (mapaApps[nome] ?? 0) + g.valor;
      mapaIsApp[nome] = true;
      if (g.qtdCorridas && g.qtdCorridas > 0) {
        mapaCorridasApps[nome] = (mapaCorridasApps[nome] ?? 0) + g.qtdCorridas;
      }
    }
    if (r.valorParticular) {
      const labelParticular = r.tipoParticular
        ? (LABEL_TIPO_PARTICULAR[r.tipoParticular] ?? 'Particular')
        : 'Particular';
      mapaApps[labelParticular] = (mapaApps[labelParticular] ?? 0) + r.valorParticular;
      mapaIsApp[labelParticular] = true;
      if (r.qtdCorridas && r.qtdCorridas > 0) {
        mapaCorridasApps[labelParticular] = (mapaCorridasApps[labelParticular] ?? 0) + r.qtdCorridas;
      }
    }
    if (r.gorjeta) {
      mapaApps['Gorjeta'] = (mapaApps['Gorjeta'] ?? 0) + r.gorjeta;
      mapaIsApp['Gorjeta'] = false;
    }
    if (r.comissao) {
      const label = r.comissaoDescricao ? `Comissão — ${r.comissaoDescricao}` : 'Comissão';
      mapaApps[label] = (mapaApps[label] ?? 0) + r.comissao;
      mapaIsApp[label] = false;
    }
  }

  const receitaPorApp = Object.entries(mapaApps).map(([nome, valor]) => {
    const qtdCorridas = mapaCorridasApps[nome] ?? 0;
    return {
      nome,
      valor,
      percentual: receitaBruta > 0 ? (valor / receitaBruta) * 100 : 0,
      qtdCorridas,
      receitaMedia: qtdCorridas > 0 ? valor / qtdCorridas : 0,
      isApp: mapaIsApp[nome] ?? false,
    };
  }).sort((a, b) => b.valor - a.valor);

  const totalCorridas = receitas.reduce((acc, r) => {
    const corridasApps = r.ganhosPorApp.reduce((s, g) => s + (g.qtdCorridas ?? 0), 0);
    return acc + corridasApps + (r.qtdCorridas ?? 0);
  }, 0);
  const receitaMediaPorCorrida = totalCorridas > 0 ? receitaBruta / totalCorridas : 0;

  return {
    receitaBruta, totalGastos, lucroLiquido, kmRodados, percentGastos,
    ganhoPorKm, custoPorKm, lucroporKm, gastosPorCategoria, receitaPorApp,
    totalCorridas, receitaMediaPorCorrida,
  };
}

export function agruparPorDia(receitas: Receita[], gastos: Gasto[], dias = 7) {
  const hoje = new Date();
  const resultado: { dia: string; receita: number; gasto: number }[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const receitaDia = receitas
      .filter(r => new Date(r.data).toDateString() === d.toDateString())
      .reduce((acc, r) => {
        const apps = r.ganhosPorApp.reduce((s, g) => s + g.valor, 0);
        return acc + apps + (r.valorParticular ?? 0);
      }, 0);

    const gastoDia = gastos
      .filter(g => new Date(g.data).toDateString() === d.toDateString())
      .reduce((acc, g) => acc + g.valor, 0);

    resultado.push({ dia: key, receita: receitaDia, gasto: gastoDia });
  }

  return resultado;
}

export function melhorDiaSemana(receitas: Receita[], gastos: Gasto[]): string {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const soma: Record<number, number> = {};
  const cont: Record<number, number> = {};

  for (const r of receitas) {
    const diaIdx = new Date(r.data).getDay();
    const receitaTotal = r.ganhosPorApp.reduce((s, g) => s + g.valor, 0) + (r.valorParticular ?? 0);
    const gastosDia = gastos
      .filter(g => new Date(g.data).toDateString() === new Date(r.data).toDateString())
      .reduce((s, g) => s + g.valor, 0);
    soma[diaIdx] = (soma[diaIdx] ?? 0) + (receitaTotal - gastosDia);
    cont[diaIdx] = (cont[diaIdx] ?? 0) + 1;
  }

  let melhorIdx = -1;
  let melhorMedia = -Infinity;
  for (const [idx, total] of Object.entries(soma)) {
    const media = total / cont[Number(idx)];
    if (media > melhorMedia) {
      melhorMedia = media;
      melhorIdx = Number(idx);
    }
  }

  return melhorIdx >= 0 ? dias[melhorIdx] : '—';
}

export function agruparPorMes(receitas: Receita[], gastos: Gasto[], meses = 6) {
  const hoje = new Date();
  const resultado: { mes: string; receita: number; gasto: number }[] = [];

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    const receitaMes = receitas
      .filter(r => {
        const rd = new Date(r.data);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      })
      .reduce((acc, r) => {
        const apps = r.ganhosPorApp.reduce((s, g) => s + g.valor, 0);
        return acc + apps + (r.valorParticular ?? 0) + (r.gorjeta ?? 0) + (r.comissao ?? 0);
      }, 0);

    const gastoMes = gastos
      .filter(g => {
        const gd = new Date(g.data);
        return gd.getMonth() === d.getMonth() && gd.getFullYear() === d.getFullYear();
      })
      .reduce((acc, g) => acc + g.valor, 0);

    resultado.push({ mes: mesLabel, receita: receitaMes, gasto: gastoMes });
  }

  return resultado;
}
