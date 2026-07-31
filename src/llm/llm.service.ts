import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES } from '../common/categories';

export interface ParsedExpense {
  amount: number;
  description: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  subcategory: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly anthropic: Anthropic | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY non configurata, categorizzazione automatica disabilitata');
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Prende un messaggio testuale tipo "gelato 1.50" o "rata palestra 45 euro"
   * e lo trasforma in una spesa strutturata e categorizzata.
   */
  async parseExpense(text: string): Promise<ParsedExpense | null> {
    if (!this.anthropic) return null;

    const prompt = `Sei un assistente che estrae e categorizza spese personali da un messaggio in linguaggio naturale.

Messaggio: "${text}"

Categorie disponibili (usa ESATTAMENTE queste chiavi):
${JSON.stringify(CATEGORIES, null, 2)}

Regole:
- "type" è FIXED solo se il messaggio parla esplicitamente di una spesa ricorrente/abbonamento appena pagato manualmente; nel dubbio usa VARIABLE.
- "category" deve essere una delle chiavi sotto FIXED o VARIABLE coerente col type scelto.
- "subcategory" deve essere una delle voci della lista corrispondente, oppure una breve etichetta simile se nessuna corrisponde bene.
- "amount" è un numero (usa il punto come separatore decimale).

Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo, in questo formato:
{"amount": number, "description": string, "type": "FIXED"|"VARIABLE", "category": string, "subcategory": string}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return null;

      const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as ParsedExpense;

      if (!parsed.amount || !parsed.category || !parsed.type) {
        this.logger.warn(`Parsing incompleto per: "${text}"`);
        return null;
      }

      return parsed;
    } catch (err) {
      this.logger.error(`Errore categorizzazione LLM: ${err.message}`);
      return null;
    }
  }

  isEnabled(): boolean {
    return this.anthropic !== null;
  }
}
