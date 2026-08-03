# JWT Login — Design

## Contesto

L'app espone tutte le route protette da `AuthMiddleware` (`src/auth/auth.middleware.ts`), che
richiede oggi l'header `x-api-key` risolto contro `User.apiKey` nel DB. È un tool personale
(un solo utente reale: `mikipicerno@gmail.com`), usato anche dal bot Telegram.

Per il frontend è scomodo dover recuperare l'apiKey a mano dal DB. Si aggiunge un secondo
metodo di login basato su email + password che restituisce un JWT, **senza rimuovere**
il meccanismo apiKey esistente (resta valido per bot/script).

## Data model

Aggiunta al modello `User` (prisma/schema.prisma):

```prisma
password String // hash bcrypt
```

Migrazione Prisma standard. Per l'utente esistente (già in DB senza password), uno script
one-off (`scripts/set-initial-password.ts`, eseguito una volta e poi cancellabile) genera
una password casuale sicura, la hasha con bcrypt e aggiorna la riga. La password in chiaro
viene mostrata una sola volta in output.

`CreateUserDto` (src/users/dto/create-user.dto.ts) guadagna:

```ts
@IsString()
@MinLength(8)
password: string;
```

`UsersService.create` hasha la password con bcrypt (cost factor 10) prima di salvarla.
La password hashata non deve mai essere restituita nelle risposte API (va esclusa
esplicitamente dal payload di ritorno).

## Modulo Auth

Nuovo `AuthModule` (src/auth/auth.module.ts), che finora non esisteva come modulo Nest
(solo il middleware standalone). Importa `JwtModule` (da `@nestjs/jwt`) configurato con:
- secret: `JWT_SECRET` (nuova env var, valore random generato in fase di implementazione)
- expiresIn: `7d`

Contiene:

- **AuthService**
  - `validateUser(email, password)`: legge lo `User` per email, confronta la password con
    `bcrypt.compare`; ritorna l'utente se valido, altrimenti `null`.
  - `login(user)`: firma un JWT con payload `{ sub: user.id, email: user.email }`.

- **AuthController**
  - `POST /auth/login` — body `{ email, password }` (DTO con class-validator).
    - Successo → `200 { accessToken: string }`.
    - Fallimento (email inesistente o password errata) → `401` con messaggio generico
      identico nei due casi ("Credenziali non valide"), per non permettere di enumerare
      le email registrate.

`AuthModule` viene importato in `AppModule`.

## AuthMiddleware — doppio metodo

`AuthMiddleware` viene esteso per accettare, in quest'ordine:

1. Header `Authorization: Bearer <token>` → verifica con `JwtService.verify`; se valido,
   `req.userId = payload.sub`. Se il token è presente ma invalido/scaduto → `401`
   immediato (non si fa fallback su apiKey).
2. Altrimenti, header `x-api-key` → comportamento invariato rispetto ad oggi (lookup su
   `User.apiKey`).
3. Se nessuno dei due header è presente → `401 "Header x-api-key o Authorization mancante"`.

Nessuna route esistente cambia comportamento per i client che continuano a usare
`x-api-key` (bot Telegram, script). `POST /users` resta escluso dal middleware (invariato).

## Variabili d'ambiente

Nuova variabile richiesta in `.env` (e `.env.example` se presente): `JWT_SECRET`.
Generata random (es. `openssl rand -hex 32`) in fase di implementazione e comunicata
all'utente, non committata.

## Error handling

- Login con email non esistente → stesso 401 generico del caso password errata.
- Token JWT scaduto o malformato → 401 esplicito, il client dovrà rifare login.
- Nessun refresh token: alla scadenza (7 giorni) si rifà semplicemente login.

## Testing

- Unit test `AuthService.validateUser` (password corretta / errata / utente inesistente).
- Test e2e/manuale su `POST /auth/login` (successo + fallimento) e su una route protetta
  chiamata con JWT valido, JWT scaduto, apiKey valida, nessun header.

## Fuori scope

- Refresh token / rotazione token.
- Logout lato server (JWT stateless, nessuna blacklist).
- Reset password self-service (fuori scope: unico utente, gestito manualmente se serve).
- Rate limiting sul login.
