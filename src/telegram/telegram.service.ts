import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { LlmService } from '../llm/llm.service';
import { ExpensesService } from '../expenses/expenses.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;

  constructor(
    private readonly config: ConfigService,
    private readonly llmService: LlmService,
    private readonly expensesService: ExpensesService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN non configurato, bot disattivato');
      return;
    }

    this.bot = new Telegraf(token);

    this.bot.on('text', async (ctx) => {
      const chatId = String(ctx.chat.id);
      const text = ctx.message.text;

      try {
        // recupera l'utente collegato a questo chat Telegram
        const user = await this.prisma.user.findUnique({ where: { telegramChatId: chatId } });
        if (!user) {
          await ctx.reply(
            'Questo chat non è collegato a nessun account. Collega il tuo telegramChatId dal profilo utente.',
          );
          return;
        }

        const parsed = await this.llmService.parseExpense(text);
        if (!parsed) {
          await ctx.reply(
            this.llmService.isEnabled()
              ? 'Non sono riuscito a capire la spesa, riprova con più dettagli (es. "gelato 1.50").'
              : 'Categorizzazione automatica non disponibile (manca ANTHROPIC_API_KEY): per ora crea la spesa manualmente via API.',
          );
          return;
        }

        await this.expensesService.create(user.id, {
          amount: parsed.amount,
          description: parsed.description,
          category: parsed.category,
          subcategory: parsed.subcategory,
          type: parsed.type,
          source: 'telegram',
        });

        await ctx.reply(
          `✅ €${parsed.amount.toFixed(2)} - ${parsed.category}/${parsed.subcategory} registrato`,
        );
      } catch (err) {
        this.logger.error(`Errore gestione messaggio Telegram: ${err.message}`);
        await ctx.reply('Errore nel salvataggio della spesa, riprova.');
      }
    });

    this.bot.launch();
    this.logger.log('Bot Telegram avviato');
  }
}
