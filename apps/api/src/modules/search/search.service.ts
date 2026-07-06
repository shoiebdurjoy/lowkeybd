/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Meilisearch, Index } from 'meilisearch';
import { PrismaService } from '../../common/database/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Meilisearch;
  private postsIndex: Index;
  private communitiesIndex: Index;
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {
    const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey123!';
    this.client = new Meilisearch({ host, apiKey });
  }

  async onModuleInit() {
    try {
      this.postsIndex = this.client.index('posts');
      this.communitiesIndex = this.client.index('communities');

      // Configure settings for posts
      await this.postsIndex.updateSettings({
        searchableAttributes: [
          'title',
          'content',
          'authorName',
          'communityName',
          'communitySlug',
          'type',
        ],
        filterableAttributes: ['type', 'communitySlug'],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
        ],
      });

      // Configure settings for communities
      await this.communitiesIndex.updateSettings({
        searchableAttributes: ['name', 'description', 'slug'],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
        ],
      });

      this.logger.log('Meilisearch indexes initialized successfully');
    } catch (err: unknown) {
      this.logger.error('Failed to initialize Meilisearch indexes', err);
    }
  }

  // --- INDEXING METHODS ---

  async indexPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      include: {
        author: true,
        community: true,
      },
    });

    if (!post) {
      return;
    }

    await this.postsIndex.addDocuments([
      {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        score: post.score,
        authorName: post.author.username,
        communityName: post.community?.name || null,
        communitySlug: post.community?.slug || null,
        createdAt: post.createdAt.toISOString(),
      },
    ]);
  }

  async indexCommunity(communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, deletedAt: null },
    });

    if (!community) {
      return;
    }

    await this.communitiesIndex.addDocuments([
      {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description || '',
        createdAt: community.createdAt.toISOString(),
      },
    ]);
  }

  async removePostFromIndex(postId: string) {
    await this.postsIndex.deleteDocument(postId);
  }

  async removeCommunityFromIndex(communityId: string) {
    await this.communitiesIndex.deleteDocument(communityId);
  }

  // --- EVENTS HANDLERS (Asynchronous Decoupled Listeners) ---

  @OnEvent('post.created')
  handlePostCreated(payload: { postId: string }) {
    this.indexPost(payload.postId).catch((err) =>
      this.logger.error(`Error indexing post ${payload.postId}`, err),
    );
  }

  @OnEvent('post.updated')
  handlePostUpdated(payload: { postId: string }) {
    this.indexPost(payload.postId).catch((err) =>
      this.logger.error(`Error updating post ${payload.postId}`, err),
    );
  }

  @OnEvent('post.deleted')
  handlePostDeleted(payload: { postId: string }) {
    this.removePostFromIndex(payload.postId).catch((err) =>
      this.logger.error(
        `Error removing post ${payload.postId} from index`,
        err,
      ),
    );
  }

  @OnEvent('community.created')
  handleCommunityCreated(payload: { communityId: string }) {
    this.indexCommunity(payload.communityId).catch((err) =>
      this.logger.error(`Error indexing community ${payload.communityId}`, err),
    );
  }

  @OnEvent('community.updated')
  handleCommunityUpdated(payload: { communityId: string }) {
    this.indexCommunity(payload.communityId).catch((err) =>
      this.logger.error(`Error updating community ${payload.communityId}`, err),
    );
  }

  @OnEvent('community.deleted')
  handleCommunityDeleted(payload: { communityId: string }) {
    this.removeCommunityFromIndex(payload.communityId).catch((err) =>
      this.logger.error(
        `Error removing community ${payload.communityId} from index`,
        err,
      ),
    );
  }

  // --- SEARCH & SUGGESTION METHODS ---

  async search(query: string, type?: 'posts' | 'communities') {
    if (!type || type === 'posts') {
      const postsRes = await this.postsIndex.search(query, {
        limit: 20,
      });

      if (type === 'posts') {
        return { posts: postsRes.hits };
      }

      const commsRes = await this.communitiesIndex.search(query, {
        limit: 10,
      });

      return {
        posts: postsRes.hits,
        communities: commsRes.hits,
      };
    }

    const commsRes = await this.communitiesIndex.search(query, {
      limit: 20,
    });

    return {
      communities: commsRes.hits,
    };
  }

  async getSuggestions(query: string) {
    if (!query) {
      return { suggestions: [] };
    }

    const postsRes = await this.postsIndex.search(query, { limit: 5 });
    const commsRes = await this.communitiesIndex.search(query, { limit: 5 });

    const suggestions: Array<{
      text: string;
      type: 'post' | 'community';
      id: string;
      slug?: string;
    }> = [];

    commsRes.hits.forEach((hit) => {
      suggestions.push({
        text: `c/${hit.slug} - ${hit.name}`,
        type: 'community',
        id: hit.id,
        slug: hit.slug,
      });
    });

    postsRes.hits.forEach((hit) => {
      suggestions.push({
        text: hit.title,
        type: 'post',
        id: hit.id,
      });
    });

    return { suggestions };
  }

  // --- REINDEX WORKER ---

  async reindexAll() {
    this.logger.log('Starting full search reindexing worker...');

    // Clear indexes
    try {
      await this.postsIndex.deleteAllDocuments();
      await this.communitiesIndex.deleteAllDocuments();
    } catch {
      // index might not exist yet
    }

    const posts = await this.prisma.post.findMany({
      where: { deletedAt: null },
      include: { author: true, community: true },
    });

    const communities = await this.prisma.community.findMany({
      where: { deletedAt: null },
    });

    if (posts.length > 0) {
      const postDocs = posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        score: post.score,
        authorName: post.author.username,
        communityName: post.community?.name || null,
        communitySlug: post.community?.slug || null,
        createdAt: post.createdAt.toISOString(),
      }));
      await this.postsIndex.addDocuments(postDocs);
    }

    if (communities.length > 0) {
      const commDocs = communities.map((community) => ({
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description || '',
        createdAt: community.createdAt.toISOString(),
      }));
      await this.communitiesIndex.addDocuments(commDocs);
    }

    this.logger.log(
      `Reindexing complete. Indexed ${posts.length} posts and ${communities.length} communities.`,
    );
    return {
      postsIndexed: posts.length,
      communitiesIndexed: communities.length,
    };
  }
}
