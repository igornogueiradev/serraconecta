import { jsPDF } from 'jspdf';
import type { Agendamento, UserProfile, QuestionarioResposta } from '@/integrations/firebase/types';
import { LABEL_TIPO_AGENDAMENTO } from '@/utils/financeiro/formatters';

const VERDE = [112, 136, 95] as const;
const AZUL  = [19, 50, 74]  as const;
const W = 105; // largura A6

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtMoeda(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

function loadLogoZoomed(url: string, sizePx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sizePx;
      canvas.height = sizePx;
      const ctx = canvas.getContext('2d')!;
      const scale = 1.6;
      const drawSize = sizePx * scale;
      const offset = (sizePx - drawSize) / 2;
      ctx.drawImage(img, offset, offset, drawSize, drawSize);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Estima quantas linhas de texto uma string vai ocupar
function estimateLines(text: string, maxWidth: number, charsPerMm = 0.55): number {
  const charsPerLine = Math.floor(maxWidth / charsPerMm / 9); // font size ~9
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

function calcDocHeight(
  agendamento: Agendamento,
  resposta?: QuestionarioResposta | null,
): number {
  const valueX = 42;
  const textW = W - valueX - 8;

  let y = 53; // após header + título + linha

  // Linhas de detalhe
  const rows: [string, string][] = [
    ['Tipo', LABEL_TIPO_AGENDAMENTO[agendamento.tipo]],
  ];
  if (agendamento.clienteNome) rows.push(['Cliente', agendamento.clienteNome]);

  if (agendamento.ida_e_volta) {
    y += 5; // label IN
    rows.push(['Data ida', formatDate(agendamento.data)]);
    rows.push(['Hora ida', agendamento.hora]);
    if (agendamento.destino) rows.push(['Rota ida', agendamento.destino]);
    y += 5; // label OUT
    if (agendamento.data_volta) rows.push(['Data volta', formatDate(agendamento.data_volta)]);
    if (agendamento.hora_volta) rows.push(['Hora volta', agendamento.hora_volta]);
    if (agendamento.destino_volta) rows.push(['Rota volta', agendamento.destino_volta]);
  } else {
    rows.push(['Data', formatDate(agendamento.data)]);
    rows.push(['Hora', agendamento.hora]);
    if (agendamento.destino) rows.push(['Rota', agendamento.destino]);
  }

  if (agendamento.observacao) rows.push(['Obs.', agendamento.observacao]);

  for (const [, value] of rows) {
    const lines = estimateLines(value, textW);
    y += lines * 5 + 2;
  }

  // Financeiro
  if (agendamento.valorCombinado) {
    y += 2 + 1 + 5; // linha + espaço
    y += 6; // valor total
    if ((agendamento.adiantamentoPago ?? 0) > 0) {
      y += 6; // adiantamento
      y += 10; // saldo caixa
    }
  }

  // Passageiro
  if (resposta) {
    y += 3 + 1 + 5; // linha + header
    y += 5; // título seção

    const pRows: string[] = [];
    if (resposta.nome)           pRows.push(resposta.nome);
    if (resposta.telefone)       pRows.push(resposta.telefone);
    if (agendamento.ida_e_volta) {
      if (resposta.hotel)        pRows.push(resposta.hotel);
      if (resposta.num_voo_ida)  pRows.push(resposta.num_voo_ida);
      if (resposta.num_voo_volta) pRows.push(resposta.num_voo_volta);
    } else {
      if (resposta.num_voo)        pRows.push(resposta.num_voo);
      if (resposta.ponto_embarque) pRows.push(resposta.ponto_embarque);
    }
    pRows.push('1 adulto(s)'); // passageiros
    if ((resposta.bagagens_23kg ?? 0) + (resposta.bagagens_10kg ?? 0) + (resposta.bolsas ?? 0) > 0)
      pRows.push('bagagens');
    if (resposta.item_volumoso)  pRows.push(resposta.item_volumoso_desc || 'Sim');
    if (resposta.observacoes)    pRows.push(resposta.observacoes);

    for (const value of pRows) {
      const lines = estimateLines(value, textW, 0.5);
      y += lines * 4.5 + 1.5;
    }
  }

  return y + 16; // espaço para o rodapé
}

export async function generateVoucherPDF(
  agendamento: Agendamento,
  profile: (UserProfile & { user_id?: string }) | null,
  resposta?: QuestionarioResposta | null,
): Promise<void> {
  const H = calcDocHeight(agendamento, resposta);
  const doc = new jsPDF({ unit: 'mm', format: [W, H], orientation: 'portrait' });
  const code = `SC-${(agendamento.id ?? 'XXXXXXXX').slice(0, 8).toUpperCase()}`;

  // Fundo
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, W, H, 'F');

  // Cabeçalho
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...VERDE);
  doc.rect(0, 26, W, 2, 'F');

  // Logo
  let logoLoaded = false;
  try {
    const dataUrl = await loadLogoZoomed('/LOGO.png', 200);
    doc.addImage(dataUrl, 'PNG', 4, 3, 20, 20);
    logoLoaded = true;
  } catch { /* sem logo */ }

  const agencyLabel = profile?.agency_name || profile?.full_name || 'Meu Executivo Gramado';
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(agencyLabel, logoLoaded ? 27 : 5, 13);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 180);
  doc.text('Transfer Executivo · Serra Gaúcha', logoLoaded ? 27 : 5, 19);

  // Título
  doc.setTextColor(...AZUL);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VOUCHER DE AGENDAMENTO', W / 2, 36, { align: 'center' });

  // Código
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(`Código: ${code}`, W / 2, 42, { align: 'center' });

  // Linha verde
  doc.setDrawColor(...VERDE);
  doc.setLineWidth(0.6);
  doc.line(8, 46, W - 8, 46);

  // Detalhes do agendamento
  let y = 53;
  const valueX = 42;

  function drawRow(label: string, value: string) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(label, 10, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(value, W - valueX - 8);
    doc.text(lines, valueX, y);
    y += lines.length * 5 + 2;
  }

  function drawLegLabel(label: string) {
    // Retângulo colorido + texto — sem emoji (jsPDF não suporta)
    doc.setFillColor(...VERDE);
    doc.roundedRect(10, y - 3.5, 3, 3.5, 0.8, 0.8, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...VERDE);
    doc.text(label, 15, y);
    y += 5;
  }

  drawRow('Tipo', LABEL_TIPO_AGENDAMENTO[agendamento.tipo]);
  if (agendamento.clienteNome) drawRow('Cliente', agendamento.clienteNome);

  if (agendamento.ida_e_volta) {
    drawLegLabel('IN');
    drawRow('Data', formatDate(agendamento.data));
    drawRow('Hora', agendamento.hora);
    if (agendamento.destino) drawRow('Rota', agendamento.destino);
    drawLegLabel('OUT');
    if (agendamento.data_volta) drawRow('Data', formatDate(agendamento.data_volta));
    if (agendamento.hora_volta) drawRow('Hora', agendamento.hora_volta);
    if (agendamento.destino_volta) drawRow('Rota', agendamento.destino_volta);
  } else {
    drawRow('Data', formatDate(agendamento.data));
    drawRow('Hora', agendamento.hora);
    if (agendamento.destino) drawRow('Rota', agendamento.destino);
  }

  if (agendamento.observacao) drawRow('Obs.', agendamento.observacao);

  // Financeiro
  if (agendamento.valorCombinado) {
    y += 2;
    doc.setDrawColor(220, 225, 220);
    doc.setLineWidth(0.3);
    doc.line(8, y, W - 8, y);
    y += 5;

    const total = agendamento.valorCombinado;
    const adiant = agendamento.adiantamentoPago ?? 0;
    const saldo = total - adiant;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Valor total', 10, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(fmtMoeda(total), W - 10, y, { align: 'right' });
    y += 6;

    if (adiant > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Adiantamento pago', 10, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...VERDE);
      doc.text(fmtMoeda(adiant), W - 10, y, { align: 'right' });
      y += 6;

      doc.setFillColor(240, 245, 238);
      doc.roundedRect(8, y - 3.5, W - 16, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...AZUL);
      doc.text('Saldo a pagar', 12, y + 1.5);
      doc.setTextColor(180, 80, 20);
      doc.text(fmtMoeda(saldo), W - 12, y + 1.5, { align: 'right' });
      y += 10;
    }
  }

  // Dados do passageiro
  if (resposta) {
    y += 3;
    doc.setDrawColor(...VERDE);
    doc.setLineWidth(0.6);
    doc.line(8, y, W - 8, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...AZUL);
    doc.text('Dados do Passageiro', 10, y);
    y += 5;

    const pRows: [string, string][] = [];
    if (resposta.nome)           pRows.push(['Nome', resposta.nome]);
    if (resposta.telefone)       pRows.push(['Tel.', resposta.telefone]);
    if (agendamento.ida_e_volta) {
      if (resposta.hotel)         pRows.push(['Hotel', resposta.hotel]);
      if (resposta.num_voo_ida)   pRows.push(['Voo (IN)', resposta.num_voo_ida]);
      if (resposta.num_voo_volta) pRows.push(['Voo (OUT)', resposta.num_voo_volta]);
    } else {
      if (resposta.num_voo)        pRows.push(['Voo', resposta.num_voo]);
      if (resposta.ponto_embarque) pRows.push(['Embarque', resposta.ponto_embarque]);
    }

    const paxParts = [`${resposta.adultos} adulto(s)`];
    if ((resposta.criancas ?? 0) > 0) paxParts.push(`${resposta.criancas} criança(s)`);
    pRows.push(['Passag.', paxParts.join(', ')]);
    if ((resposta.cadeirinha ?? 0) > 0) pRows.push(['Cadeirinha', `${resposta.cadeirinha} (motorista fornece)`]);
    if ((resposta.elevacao ?? 0) > 0)   pRows.push(['Elevação', `${resposta.elevacao} (motorista fornece)`]);

    const bagParts: string[] = [];
    if ((resposta.bagagens_23kg ?? 0) > 0) bagParts.push(`${resposta.bagagens_23kg}×23kg`);
    if ((resposta.bagagens_10kg ?? 0) > 0) bagParts.push(`${resposta.bagagens_10kg}×10kg`);
    if ((resposta.bolsas ?? 0) > 0)        bagParts.push(`${resposta.bolsas} bolsa(s)`);
    if (bagParts.length) pRows.push(['Bag.', bagParts.join(' | ')]);

    if (resposta.item_volumoso)       pRows.push(['Volumoso', resposta.item_volumoso_desc || 'Sim']);
    if (resposta.mobilidade_reduzida) pRows.push(['Mobilidade', resposta.mobilidade_reduzida_desc || 'Necessita atenção']);
    if (resposta.roteiro)             pRows.push(['Roteiro', resposta.roteiro]);
    if (resposta.observacoes)         pRows.push(['Obs.', resposta.observacoes]);

    doc.setFontSize(8.5);
    for (const [label, value] of pRows) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(label, 10, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(value, W - valueX - 8);
      doc.text(lines, valueX, y);
      y += lines.length * 4.5 + 1.5;
    }
  }

  // Rodapé — posicionado no final real do conteúdo
  const footerY = H - 10;
  doc.setFillColor(...AZUL);
  doc.rect(0, footerY, W, 10, 'F');
  doc.setFillColor(...VERDE);
  doc.rect(0, footerY - 1, W, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('meuexecutivogramado.com.br  ·  (54) 99243-6396', W / 2, footerY + 6, { align: 'center' });

  doc.save(`voucher-${code}.pdf`);
}
