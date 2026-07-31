# Expense Tracker — Backend

Backend NestJS per il tracking spese personali con bot Telegram, categorizzazione
automatica via Claude API e allocazione budget entrate/spese/investimenti.

## Architettura

```
src/
├── prisma/            Client Prisma condiviso (globale)
├── llm/                Categorizzazione spese via Claude API
├── expenses/           CRUD spese + calcolo riepilogo budget vs reale
├── fixed-expenses/     CRUD spese fisse + cron di generazione automatica
├── budget/             Allocazione percentuali entrate per mese
├── telegram/           Bot che riceve i messaggi e crea le spese
├── websocket/          Gateway per push live alla dashboard
├── app.module.ts
└── main.ts
```

## Flusso principale

1. L'utente scrive su Telegram, es. `gelato 1.50`
2. `TelegramService` riceve il messaggio e chiama `LlmService.parseExpense()`
3. Claude API risponde con `{amount, type, category, subcategory}`
4. `ExpensesService.create()` salva la spesa e notifica la dashboard via WebSocket
5. Le spese fisse (rata auto, assicurazione...) si creano una volta dalla dashboard/API
   e un cron giornaliero (`FixedExpensesService.generateDueFixedExpenses`) genera
   automaticamente la spesa reale nel giorno configurato (`dayOfMonth`)
6. `ExpensesService.getMonthSummary()` calcola budget allocato vs speso reale,
   usato sia per la dashboard live che per il riepilogo di fine mese

## Setup locale

```bash
cp .env.example .env
# compila DATABASE_URL, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN

npm install
npx prisma migrate dev --name init
npm run start:dev
```

Oppure con Docker:

```bash
cp .env.example .env
docker compose up -d
```

## Note importanti prima di andare in produzione

- **Auth**: i controller usano `req.userId` come placeholder — va aggiunto un vero
  guard di autenticazione (anche solo un JWT semplice) prima di esporre l'API pubblicamente.
- **telegramChatId**: va collegato manualmente al primo avvio (crea lo User via
  Prisma Studio o un endpoint dedicato, poi scrivi al bot per ottenere il tuo chat id).
- **CORS**: restringi `origin: '*'` in `main.ts` e nel gateway WebSocket al dominio
  reale del frontend (es. `expenses.michelepicerno.it`) prima del deploy.
- **Multi-utente (fase futura)**: lo schema è già pensato per più `User`, basterà
  aggiungere autenticazione reale e collegare ogni chat Telegram al proprio utente.

## Prossimi step consigliati

1. Collegare il frontend React (dashboard + gestione spese fisse)
2. Aggiungere endpoint `POST /users` + auth minima (anche solo API key personale)
3. Report mensile automatico (cron fine mese che aggrega `getMonthSummary`)
4. Deploy su Hetzner con Nginx + SSL, stesso pattern già usato per gli altri progetti
