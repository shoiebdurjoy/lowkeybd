export type PostType =
  | 'QUESTION'
  | 'DISCUSSION'
  | 'RECOMMENDATION'
  | 'GUIDE'
  | 'REVIEW'
  | 'WARNING'
  | 'NEWS_DISCUSSION';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'REMOVED' | 'LOCKED';

export interface PostAuthor {
  id: string;
  username: string;
  profile?: {
    avatarUrl?: string | null;
    reputationScore?: number;
  } | null;
}

export interface PostCommunity {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  type: PostType;
  status: PostStatus;
  authorId: string;
  communityId?: string | null;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  viewCount: number;
  score: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  community?: PostCommunity | null;
  userVote?: number;
  _count?: {
    comments: number;
    votes: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  score: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  replies?: Comment[];
  userVote?: number;
  _count?: {
    replies: number;
    votes: number;
  };
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  QUESTION: '❓ Question',
  DISCUSSION: '💬 Discussion',
  RECOMMENDATION: '👍 Recommendation',
  GUIDE: '📖 Guide',
  REVIEW: '⭐ Review',
  WARNING: '⚠️ Warning',
  NEWS_DISCUSSION: '📰 News',
};

export const POST_TYPE_COLORS: Record<PostType, string> = {
  QUESTION: '#8B5CF6',
  DISCUSSION: '#3B82F6',
  RECOMMENDATION: '#10B981',
  GUIDE: '#F59E0B',
  REVIEW: '#EC4899',
  WARNING: '#EF4444',
  NEWS_DISCUSSION: '#6B7280',
};
