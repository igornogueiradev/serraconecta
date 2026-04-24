# Serra Conecta — Contexto para Claude Code

## O que é o projeto

Plataforma web chamada **Serra Conecta** para compartilhamento de clientes entre motoristas autônomos da Serra Gaúcha. O problema central: motoristas precisam descer/subir vazios entre a Serra e Porto Alegre/Aeroporto, e usavam grupos de WhatsApp para repassar clientes — gerando duplicidade e confusão.

- **Repositório:** https://github.com/igornogueiradev/serraconecta
- **Deploy atual:** https://serraconecta.lovable.app/login
- **Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase

## Problema de backend

O Supabase está na versão gratuita, que pausa o banco após 7 dias sem uso. Isso precisa ser resolvido (migrar para Firebase ou pagar Supabase Pro ~$25/mês).

## Melhorias identificadas (em ordem de prioridade)

### 🔴 Prioridade 1 — Liberar acesso público ao mural
**Arquivo:** `src/App.tsx`

Atualmente todas as rotas redirecionam para `/login` se não há sessão. Isso é a maior barreira de adesão — ninguém consegue ver nada sem criar conta.

**O que fazer:** Tornar `/drivers` e `/trips` acessíveis sem login. Exigir login apenas para postar (adicionar disponibilidade ou ofertar viagem).

---

### 🔴 Prioridade 2 — Expandir rotas disponíveis
**Arquivos:** `src/pages/DriversPage.tsx`, `src/pages/TripsPage.tsx`

Atualmente as opções de origem/destino são só 3 cidades fixas em um `<Select>`:
- Caxias do Sul
- Gramado
- Porto Alegre

**O que fazer:** Adicionar as cidades que faltam e trocar o `Select` fixo por um campo com autocomplete (ou pelo menos um Select expandido). Cidades a adicionar:
- Canela
- Nova Petrópolis
- Bento Gonçalves
- Farroupilha
- Carlos Barbosa
- Garibaldi
- Aeroporto Salgado Filho (POA) — diferente de Porto Alegre centro

---

### 🟡 Prioridade 3 — Adicionar filtros no mural
**Arquivos:** `src/pages/DriversPage.tsx`, `src/pages/TripsPage.tsx`

Atualmente não há nenhum filtro — tudo é listado de uma vez. Quando crescer vai virar bagunça igual aos grupos de WhatsApp.

**O que fazer:** Adicionar no topo da página pelo menos:
- Filtro por origem
- Filtro por destino
- Filtro por data

---

### 🟡 Prioridade 4 — Corrigir mensagem do WhatsApp
**Arquivo:** `src/utils/whatsapp.ts`

A mensagem gerada para contato com motorista não inclui a data:
```
"Olá [nome]! Vi sua disponibilidade de [veículo] para [rota] às [hora]. Gostaria de mais informações."
```

**O que fazer:** Incluir a data na mensagem do tipo `driver`. O parâmetro `date` já existe na interface mas não é usado nesse caso.

---

### 🟡 Prioridade 5 — Botão "Copiar para WhatsApp"
**Arquivos:** `src/pages/DriversPage.tsx`, `src/pages/MyDriversPage.tsx`

Ao postar uma disponibilidade, gerar um texto formatado pronto para colar nos grupos de WhatsApp. Isso usa os grupos existentes a favor da plataforma em vez de competir com eles.

**Formato sugerido:**
```
🚗 Serra Conecta
📍 [Origem] → [Destino]
📅 [Data] às [Hora]
🪑 [X] lugares | [Tipo de serviço]
🚙 [Veículo]
📲 Ver e contatar: https://serraconecta.lovable.app/drivers
```

---

### 🟢 Prioridade 6 — Ativar cron job para expiração
**Arquivo:** `supabase/` (configuração do banco)

A função `mark_expired_items` existe no banco mas nunca é chamada automaticamente. Itens vencidos ficam como `status = 'active'` no banco para sempre — só o frontend os filtra visualmente.

**O que fazer:** Configurar um Scheduled Job no Supabase para rodar `mark_expired_items` a cada hora.

---

### 🟢 Prioridade 7 — Campo de preço no formulário de motorista
**Arquivo:** `src/pages/DriversPage.tsx`

O banco já tem o campo `price` na tabela `drivers`, mas o formulário sempre salva como `0` e os cards nunca mostram. 

**O que fazer:** Adicionar campo de preço por assento no formulário e exibir nos cards.

---

## Estrutura do banco (resumo)

### Tabela `drivers`
Disponibilidades de motoristas: origin, destination, vehicle_info, available_seats, departure_date, departure_time, price, service_type (coletivo/privativo/ambos), has_trailer, has_rooftop_carrier, status, user_id

### Tabela `trips`
Viagens ofertadas por passageiros/agências: origin, destination, passengers_count, adults_count, children_count, baggage_23kg, baggage_10kg, baggage_bags, departure_date, departure_time, service_type, status, user_id

### Tabela `profiles`
Perfil dos usuários: full_name, phone, user_type, avatar_url

### Tabela `ratings`
Avaliações entre usuários: from_user_id, to_user_id, rating, comment, driver_id, trip_id

## Observação sobre adesão

Os admins dos grupos de WhatsApp bloquearam a divulgação da plataforma. A estratégia é **não competir com os grupos, mas usar os grupos como canal de divulgação** — via o botão de copiar texto formatado (Prioridade 5) e via acesso público ao mural sem login (Prioridade 1).
