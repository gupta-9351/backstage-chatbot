import OpenAI from 'openai';
import type { RootConfigService } from '@backstage/backend-plugin-api';

export class OpenAIService {
  private readonly client?: OpenAI;

  constructor(config: RootConfigService) {
    const apiKey = config.getOptionalString('openai.apiKey');

    if (!apiKey) {
      return;
    }

    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string): Promise<string> {
    if (!this.client) {
      return 'OpenAI is not configured yet. Set openai.apiKey in app-config.yaml to enable catalog answers.';
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 512,
    });

    const choice = response.choices[0];

    if (!choice || !choice.message?.content) {
      throw new Error('OpenAI did not return a valid response.');
    }

    return choice.message.content.trim();
  }
}
