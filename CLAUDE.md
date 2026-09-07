# Meu Executivo Gramado — Painel de Gestão

Webapp pessoal exclusivo de Igor (igor_flavio12@hotmail.com) para gestão de agendamentos, financeiro e leads do serviço de transfer executivo na Serra Gaúcha.

**Painel:** https://serraconecta-1737c.web.app  
**Landing page:** https://meuexecutivogramado.vercel.app (repo: github.com/igornogueiradev/meuexecutivogramado)  
**Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + Firebase (Firestore + Auth + Hosting)  
**Idioma:** Sempre responder em português-br.

---

## Regras de trabalho

- Após qualquer alteração no painel: `npm run build && firebase deploy --only hosting,firestore`
- Para a landing page: editar em `c:\Users\igor_\Downloads\meuexecutivogramado` e `git push origin main` (Vercel faz deploy automático)
- Nunca criar arquivos de documentação extras além deste CLAUDE.md
- Não adicionar comentários desnecessários no código

---

## Acesso e segurança

- Login bloqueado para qualquer e-mail diferente de `igor_flavio12@hotmail.com` (validação em `src/pages/Login.tsx`)
- Sem tela de cadastro — só login
- Firestore rules: dados financeiros/agenda/leads são privados (só autenticado lê); leads aceitam escrita pública (da landing page)

---

## Identidade visual

- **Cores:** verde `#70885f` (HSL 95 18% 45%) como primária, azul escuro `#13324a` (HSL 206 59% 18%) como secundária
- Definidas em `src/index.css` via variáveis CSS `--primary` e `--secondary`
- Alinhadas com a landing page meuexecutivogramado.vercel.app

---

## Histórico de implementações

### Transformação para painel pessoal (jun/2026)
- Removidas: páginas de Disponibilidades, Repasses, Minhas Disponibilidades, Meus Repasses, Solicitações
- `src/pages/Login.tsx` — simplificado (só login), bloqueio de e-mails não autorizados, marca renomeada
- `src/pages/HomePage.tsx` — reescrita como dashboard pessoal (compromissos de amanhã + atalhos rápidos)
- `src/components/AppSidebar.tsx` — apenas Início, Leads, Agenda, Perfil, Financeiro
- `src/components/BottomNav.tsx` — Início, Leads, Agenda, Financeiro, Perfil
- `src/index.css` — paleta de cores atualizada para verde/azul escuro da marca

### Sistema de Leads
- `src/pages/LeadsPage.tsx` — listagem de leads com filtros, WhatsApp, conversão em agendamento
- `src/hooks/useLeads.ts` — fetch/update de leads no Firestore
- Firestore collection `leads`: escrita pública (landing page), leitura/update apenas autenticado
- Lead status: `novo` → `respondido` → `agendado`

### Integração Landing Page ↔ Painel
- `meuexecutivogramado/script.js` — ao submeter o formulário de orçamento, salva lead no Firestore E abre WhatsApp
- `meuexecutivogramado/index.html` — script carregado como módulo ES para permitir imports Firebase

### Módulo Financeiro
- Páginas: Dashboard, NovaReceita, EditarReceita, NovoGasto, EditarGasto, Historico, Relatorios, Agenda, NovoAgendamento, EditarAgendamento
- `src/hooks/financeiro/` — hooks de receitas, gastos e agendamentos
- `src/integrations/firebase/financeiro.ts` — funções CRUD do Firestore
- `src/utils/financeiro/formatters.ts` — `toLocalDate()` helper, formatadores de moeda/data

### Geração de Voucher PDF
- `src/utils/generateVoucherPDF.ts` — jsPDF, layout com cabeçalho, código `SC-XXXXXXXX`
- `src/pages/financeiro/Agenda.tsx` — botão "Gerar Voucher" em cada card expandido

### Questionário do Cliente
- `src/pages/QuestionarioCliente.tsx` — página pública (`/q/:id`); expira após data/hora do agendamento
- `src/integrations/firebase/questionario.ts` — CRUD `questionario_respostas`; marca `agendamento.questionario_respondido = true`
- `src/hooks/useQuestionario.ts` — hook por agendamento_id
- `src/utils/whatsapp.ts` — `generateQuestionarioWhatsApp()` e `generateQuestionarioLink()`
- `src/pages/financeiro/Agenda.tsx` — botão "Questionário", badges amarelo/verde, bloco "Dados do Cliente"

### Perfil do Usuário
- `src/pages/ProfilePage.tsx` — Nome da Agência + Telefone/WhatsApp
- `src/hooks/useUserProfile.ts` — fetch/update de perfil

---

## Tipos principais (`src/integrations/firebase/types.ts`)

```ts
UserProfile  { full_name, phone, user_type, created_at, agency_name? }
Agendamento  { data, hora, clienteNome?, tipo, destino?, valorCombinado?, status, questionario_enviado?, questionario_respondido? }
Receita      { data, kmTotal, ganhosPorApp[], valorParticular?, ... }
Gasto        { categoria, descricao, valor, data, kmAtual?, litros? }
Lead         { nome, telefone, data_desejada?, destino?, servico?, mensagem?, status: 'novo'|'respondido'|'agendado' }
QuestionarioResposta { agendamento_id, owner_id, nome, telefone, adultos, criancas?, bagagens_23kg?, ... }
```

---

## Pendências conhecidas

- **Firebase Storage** — ativar em https://console.firebase.google.com/project/serraconecta-1737c/storage para habilitar upload de logo no perfil
- **Índice Firestore para leads** — se aparecer erro de índice ao listar leads, criar índice em `created_at desc` na coleção `leads`
