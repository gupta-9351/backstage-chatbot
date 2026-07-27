import { CatalogClient } from '@backstage/catalog-client';
import type { AuthService, DiscoveryService, LoggerService } from '@backstage/backend-plugin-api';
import type { CompoundEntityRef, Entity } from '@backstage/catalog-model';

export class CatalogService {
  private readonly client: CatalogClient;

  constructor(
    discoveryService: DiscoveryService,
    private readonly auth: AuthService,
    private readonly logger?: LoggerService,
  ) {
    this.client = new CatalogClient({
      discoveryApi: {
        getBaseUrl: pluginId => discoveryService.getBaseUrl(pluginId),
      },
    });
  }

  private async getCatalogToken() {
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    return token;
  }

  async getAllEntities(): Promise<Entity[]> {
    const token = await this.getCatalogToken();
    const response = await this.client.getEntities({}, { token });
    return response.items;
  }

  async getEntitiesByKind(kind: string): Promise<Entity[]> {
    const token = await this.getCatalogToken();
    const response = await this.client.getEntities({ filter: [{ kind }] }, { token });
    return response.items;
  }

  async getRelevantEntities(question: string): Promise<Entity[]> {
    const allEntities = await this.getAllEntities();
    const queryTokens = this.extractQueryTokens(question);

    if (!queryTokens.length) {
      return allEntities;
    }

    return allEntities.filter(entity => {
      const searchableText = this.buildSearchableText(entity);
      return queryTokens.some(token => searchableText.includes(token));
    });
  }

  async getEntityByName(kind: string, namespace: string, name: string): Promise<Entity | undefined> {
    const entityRef: CompoundEntityRef = {
      kind: kind.trim(),
      namespace: namespace.trim() || 'default',
      name: name.trim(),
    };

    this.logger?.info(`catalogService looking up entity ${entityRef.kind}:${entityRef.namespace}/${entityRef.name}`);

    const token = await this.getCatalogToken();
    return this.client.getEntityByRef(entityRef, { token });
  }

  private extractQueryTokens(question: string): string[] {
    const stopWords = new Set([
      'who',
      'what',
      'where',
      'when',
      'why',
      'how',
      'is',
      'are',
      'does',
      'do',
      'the',
      'a',
      'an',
      'of',
      'in',
      'to',
      'for',
      'by',
      'with',
      'on',
      'that',
      'this',
      'it',
      'its',
      'owner',
      'owns',
      'name',
      'service',
    ]);

    return Array.from(
      new Set(
        (question
          .toLowerCase()
          .match(/[\w-]+/g) ?? [])
          .filter(token => token.length > 1 && !stopWords.has(token)),
      ),
    );
  }

  private buildSearchableText(entity: Entity): string {
    const tags = Array.isArray(entity.metadata.tags) ? entity.metadata.tags.join(' ') : '';
    const annotations = entity.metadata.annotations
      ? Object.values(entity.metadata.annotations).join(' ')
      : '';
    const owner = (entity.spec as any)?.owner ? String((entity.spec as any).owner) : '';
    const system = (entity.spec as any)?.system ? String((entity.spec as any).system) : '';

    return [
      entity.metadata.name,
      entity.metadata.title,
      entity.metadata.description,
      entity.kind,
      entity.metadata.namespace,
      tags,
      annotations,
      owner,
      system,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
}
