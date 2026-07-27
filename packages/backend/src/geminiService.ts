import { GoogleGenAI } from '@google/genai';
import type { RootConfigService } from '@backstage/backend-plugin-api';

export class GeminiService {
  private readonly client?: GoogleGenAI;
  private readonly model: string;

  constructor(config: RootConfigService) {
    const apiKey = config.getOptionalString('gemini.apiKey');

    this.model =
      config.getOptionalString('gemini.model') ?? 'gemini-2.5-flash';

    if (!apiKey) {
      return;
    }

    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  async generate(prompt: string): Promise<string> {
    if (!this.client) {
      return 'Gemini is not configured. Set gemini.apiKey in app-config.yaml.';
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response.');
    }

    return response.text.trim();
  }
}