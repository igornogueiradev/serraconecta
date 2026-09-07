export type HelpPageKey =
  | 'disponibilidades'
  | 'repasses'
  | 'minhas-disponibilidades'
  | 'meus-repasses'
  | 'minhas-solicitacoes'
  | 'financeiro-dashboard'
  | 'financeiro-receita'
  | 'financeiro-gasto'
  | 'financeiro-agenda'
  | 'financeiro-historico'
  | 'financeiro-relatorios';

export interface HelpContent {
  title: string;
  description: string;
  benefit: string;
  steps: string[];
  examples?: string[];
  tips?: string[];
}

export const HELP_CONTENT: Record<HelpPageKey, HelpContent> = {
  disponibilidades: {
    title: 'Disponibilidades de Motoristas',
    description:
      'Aqui você encontra motoristas disponíveis para realizar transfers e serviços de transporte na Serra Gaúcha. Também pode divulgar a sua própria disponibilidade para outros motoristas verem.',
    benefit:
      'Conecta motoristas que têm vagas no veículo com colegas que precisam de ajuda, gerando renda extra e otimizando viagens.',
    steps: [
      'Veja os cards de disponibilidade listados na tela',
      'Use os filtros de origem, destino e data para encontrar o que precisa',
      'Clique em "WhatsApp" para entrar em contato direto com o motorista',
      'Ou clique em "Solicitar via Plataforma" para registrar seu interesse sem sair da plataforma',
      'Para cadastrar sua própria disponibilidade, clique no botão "+" no canto superior',
    ],
    examples: [
      'Você tem 2 lugares livres no carro para Gramado amanhã → cadastre sua disponibilidade',
      'Precisa de um motorista para Porto Alegre na sexta → filtre por destino e encontre alguém disponível',
    ],
    tips: [
      'Clique nas estrelas ⭐ de um motorista para ver avaliações de outros usuários antes de decidir',
      'Disponibilidades com data já passada são automaticamente ocultadas',
    ],
  },

  repasses: {
    title: 'Repasses Ofertados',
    description:
      'Aqui aparecem viagens com demanda excedente: passageiros que precisam de um motorista, ou grupos que querem dividir o custo de uma viagem. Você também pode ofertar uma viagem que precisa de um motorista.',
    benefit:
      'Permite que motoristas assumam viagens já formatadas, economizando tempo de captação e garantindo trabalho imediato.',
    steps: [
      'Veja os repasses disponíveis na listagem',
      'Clique em "Entrar em Contato" para abrir o WhatsApp diretamente com o ofertante',
      'Ou clique em "Solicitar via Plataforma" para registrar seu interesse sem sair da plataforma',
      'Para ofertar uma viagem, clique no botão "+" no canto superior',
    ],
    examples: [
      'Outro motorista ofertou 3 passageiros para Gramado amanhã mas não tem disponibilidade → veja o repasse e entre em contato',
      'Você recebeu uma viagem com 6 pessoas mas seu carro comporta 4 → crie um repasse para os outros 2',
    ],
    tips: [
      'Repasses com data mais próxima aparecem primeiro — confira sempre ao iniciar o dia',
      'Clique nas estrelas de quem ofertou para ver o histórico de avaliações',
    ],
  },

  'minhas-disponibilidades': {
    title: 'Minhas Disponibilidades',
    description:
      'Gerencie todas as disponibilidades que você cadastrou. Veja quem solicitou seus serviços e aceite ou recuse as solicitações recebidas.',
    benefit:
      'Centraliza o gerenciamento dos seus serviços oferecidos em um só lugar, sem precisar sair da plataforma.',
    steps: [
      'Veja seus cards de disponibilidade e expanda para ver as solicitações recebidas em cada um',
      'Clique em "Aceitar" para confirmar uma solicitação — o solicitante será notificado',
      'Clique em "Recusar" se não puder atender aquela solicitação',
      'Quando o serviço for realizado, clique em "Concluído" para encerrar',
      'Edite ou desative uma disponibilidade clicando no ícone de lápis ✏️',
    ],
    examples: [
      'Você cadastrou disponibilidade para sábado e dois motoristas solicitaram → aceite um e recuse o outro',
      'A viagem foi realizada → clique em "Concluído" e o solicitante poderá te avaliar',
    ],
    tips: [
      'Ao aceitar, o card fica inativo automaticamente para evitar solicitações duplicadas',
      'Clique nas estrelas de um solicitante para ver o histórico de avaliações antes de aceitar',
    ],
  },

  'meus-repasses': {
    title: 'Meus Repasses',
    description:
      'Gerencie os repasses que você ofertou e veja os motoristas interessados em realizá-los.',
    benefit:
      'Facilita a gestão de demanda excedente, permitindo aceitar o motorista certo para cada viagem.',
    steps: [
      'Veja seus repasses cadastrados e expanda para ver as solicitações de motoristas interessados',
      'Clique em "Aceitar" para confirmar o motorista escolhido',
      'Clique em "Concluído" quando a viagem for realizada',
      'Edite os dados do repasse caso algo mude (horário, número de passageiros, etc.)',
    ],
    examples: [
      'Você ofertou um repasse para o aeroporto e 3 motoristas se interessaram → escolha o melhor avaliado',
    ],
    tips: [
      'Clique nas estrelas de um solicitante para ver o histórico de avaliações antes de aceitar',
      'Após concluir, ambos poderão se avaliar na plataforma',
    ],
  },

  'minhas-solicitacoes': {
    title: 'Minhas Solicitações',
    description:
      'Acompanhe o histórico de todas as solicitações que você enviou para disponibilidades ou repasses de outros motoristas.',
    benefit:
      'Mantém o controle das suas solicitações em andamento e concluídas, sem precisar guardar na memória.',
    steps: [
      'Veja a lista de solicitações com o status atual de cada uma',
      '"Aguardando" → o dono do card ainda não respondeu',
      '"Aceita" → sua solicitação foi confirmada, entre em contato para acertar os detalhes',
      '"Recusada" → o dono não pôde atender desta vez, tente outro disponível',
      '"Concluída" → clique em "Avaliar Motorista" para dar feedback',
      'Você pode cancelar solicitações com status "Aguardando" a qualquer momento',
    ],
    examples: [
      'Você solicitou uma disponibilidade para segunda → volte aqui para ver se foi aceita sem precisar perguntar por WhatsApp',
      'A viagem foi concluída → avalie o motorista para ajudar outros usuários a escolherem melhor',
    ],
    tips: [
      'Avaliar os motoristas após cada serviço ajuda toda a comunidade a escolher com mais segurança',
    ],
  },

  'financeiro-dashboard': {
    title: 'Painel Financeiro',
    description:
      'Visão geral das suas finanças como motorista: receitas, gastos, lucro, quilômetros rodados e desempenho por aplicativo.',
    benefit:
      'Você sabe exatamente quanto ganhou, quanto gastou e qual é seu lucro real — sem depender de planilhas ou cálculos manuais.',
    steps: [
      'Selecione o período: Hoje, Semana, Mês ou Geral',
      'Veja os cards de KPIs: Receita Bruta, Gastos Totais, Lucro Líquido e Km Rodados',
      'O gráfico de barras mostra a evolução dos seus ganhos ao longo do período',
      'O gráfico de pizza mostra a distribuição dos seus gastos por categoria',
      'Clique em "Nova Receita" ou "Novo Gasto" para registrar um lançamento',
    ],
    examples: [
      'Ao final do mês: compare se o Lucro Líquido ficou acima da sua meta mensal',
      'Analise qual app (Uber, 99, particular) gera mais receita e foque seus esforços lá',
    ],
    tips: [
      'Registre receitas e gastos diariamente para ter dados mais precisos e confiáveis',
      'Use o período "Geral" para ver a evolução de toda a sua carreira na plataforma',
    ],
  },

  'financeiro-receita': {
    title: 'Registrar Nova Receita',
    description:
      'Registre seus ganhos do dia: corridas por app, serviços particulares, gorjetas e comissões.',
    benefit:
      'Mantém seu histórico financeiro sempre atualizado, permitindo análises precisas no dashboard e relatórios.',
    steps: [
      'Selecione a data da receita (hoje ou uma data passada)',
      'Informe o total de km rodados no dia',
      'Adicione os ganhos por aplicativo: clique em "+" e escolha Uber, 99, BlaBlaCar ou Outro',
      'Informe o valor recebido e a quantidade de corridas naquele app',
      'Se teve serviço particular, preencha o campo com o valor e o tipo (transfer, city tour, etc.)',
      'Adicione gorjeta ou comissão se houver, e clique em "Salvar"',
    ],
    examples: [
      'Hoje: 120km rodados, R$180 no Uber (8 corridas), R$60 em particular + R$10 de gorjeta → registre tudo aqui',
      'Dia sem app mas com transfer particular para o aeroporto por R$200 → registre como Particular',
    ],
    tips: [
      'Você pode registrar receitas de dias anteriores caso tenha esquecido',
    ],
  },

  'financeiro-gasto': {
    title: 'Registrar Novo Gasto',
    description:
      'Registre despesas como combustível, manutenção, pedágios e outros custos operacionais do seu trabalho.',
    benefit:
      'Saber seus gastos reais é essencial para calcular o lucro verdadeiro e tomar decisões melhores sobre preços e investimentos.',
    steps: [
      'Selecione a categoria: Combustível, Manutenção, Pedágio ou Outro',
      'Descreva o gasto de forma clara (ex: "Revisão 30.000km", "Pneu dianteiro direito")',
      'Informe o valor gasto',
      'Selecione a data em que o gasto ocorreu',
      'Para combustível: informe o km atual e os litros abastecidos (o sistema calcula o consumo)',
      'Clique em "Salvar"',
    ],
    examples: [
      'Abasteceu R$150 com 35 litros no km 48.200 → registre como Combustível com km e litros',
      'Pagou R$80 de revisão → registre como Manutenção com descrição detalhada',
      'Pagou R$12 de pedágio numa viagem → registre como Pedágio',
    ],
  },

  'financeiro-agenda': {
    title: 'Agenda de Serviços',
    description:
      'Organize seus compromissos e serviços agendados: transfers, passeios, city tours, fretamentos e outros atendimentos.',
    benefit:
      'Nunca mais esqueça um serviço agendado. Veja tudo que está por vir e gerencie confirmações em um só lugar.',
    steps: [
      'Clique no botão "+" para adicionar um novo agendamento',
      'Informe data, horário, tipo de serviço e nome do cliente',
      'Adicione observações como número de passageiros, destino ou valor combinado',
      'Quando o cliente confirmar, mude o status para "Confirmado"',
      'Após realizar o serviço, marque como "Concluído"',
    ],
    examples: [
      'Transfer para o aeroporto na sexta às 6h para a família Silva → cadastre na agenda com o valor combinado',
      'City tour em Gramado no sábado para grupo de 5 → registre como Passeio com observações do roteiro',
    ],
    tips: [
      'Agendamentos de amanhã aparecem em destaque no painel principal para você não esquecer',
    ],
  },

  'financeiro-historico': {
    title: 'Histórico Financeiro',
    description:
      'Veja todos os lançamentos de receitas e gastos que você registrou, organizados por data e com filtros por período.',
    benefit:
      'Permite revisar qualquer lançamento, corrigir erros e entender sua movimentação financeira ao longo do tempo.',
    steps: [
      'Use os filtros de período para encontrar lançamentos de uma data específica',
      'Receitas aparecem com ícone verde, gastos com ícone vermelho',
      'Clique em um item para editá-lo ou excluí-lo',
    ],
    examples: [
      'Quer conferir quanto gastou com combustível no último mês → filtre por "Mês" e veja apenas os gastos de combustível',
      'Percebe que esqueceu de registrar uma corrida → encontre a data e adicione a receita',
    ],
    tips: [
      'Revise o histórico semanalmente para garantir que todos os lançamentos estão corretos',
    ],
  },

  'financeiro-relatorios': {
    title: 'Relatórios',
    description:
      'Análises detalhadas do seu desempenho financeiro: lucratividade, eficiência por km, comparativo entre apps e evolução mensal.',
    benefit:
      'Dados organizados que te ajudam a tomar decisões sobre preços, roteiros e investimentos no veículo com base em números reais.',
    steps: [
      'Selecione o período de análise desejado',
      'Analise os gráficos de receita por app para saber qual plataforma rende mais',
      'Veja o custo por km e o lucro por km para entender sua eficiência operacional',
      'Compare períodos diferentes para identificar sazonalidades e padrões',
    ],
    examples: [
      'Comparando meses, percebe que fevereiro teve mais lucro → identifica que foi pela alta temporada e se prepara para o próximo ano',
      'Vê que o custo por km está alto → decide fazer manutenção preventiva para reduzir gastos',
    ],
    tips: [
      'Quanto mais dias você registrar no histórico, mais precisos e úteis serão os relatórios',
    ],
  },
};
