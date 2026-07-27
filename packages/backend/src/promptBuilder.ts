import type { Entity } from '@backstage/catalog-model';
import type { ChatHistoryMessage } from './chatbot-backend';

export function buildCatalogPrompt(question: string, entities: Entity[], history: ChatHistoryMessage[]): string {
  const catalogData = entities.map(entity => ({
    apiVersion: entity.apiVersion,
    kind: entity.kind,
    metadata: {
      name: entity.metadata.name,
      namespace: entity.metadata.namespace,
      title: entity.metadata.title,
      description: entity.metadata.description,
      annotations: entity.metadata.annotations,
      labels: entity.metadata.labels,
    },
    spec: entity.spec,
  }));

  const historyText = history
    .map(item => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
    .join('\n');

  return `You are a helpful assistant answering questions using only the provided catalog information.

Do not use any outside knowledge or make assumptions beyond this catalog data.
If the answer cannot be found in the catalog, reply exactly: "I couldn't find that information in the catalog."

Conversation history:
${historyText}

Question:
${question}

Catalog entities:
${JSON.stringify(catalogData, null, 2)}

Answer:`;
}
