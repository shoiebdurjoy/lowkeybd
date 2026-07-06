export type MemberRole = 'MEMBER' | 'MODERATOR' | 'ADMIN';

export interface CommunityMember {
  userId: string;
  communityId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    members: number;
    posts: number;
  };
}

export interface CommunityDetail extends Community {
  membership: CommunityMember | null;
}

export interface MockPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  author: {
    username: string;
    displayName: string;
  };
  commentCount: number;
  createdAt: string;
}
