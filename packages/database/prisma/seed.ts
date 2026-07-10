import { PrismaClient, Role, MemberRole, PostType, PostStatus, ReportStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding database...');

  // 1. Clear existing data in correct dependency order
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.userRestriction.deleteMany({});
  await prisma.moderationAction.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.communityMember.deleteMany({});
  await prisma.community.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.emailVerificationToken.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.featureFlag.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash default password
  console.log('🔑 Hashing default passwords...');
  const passwordHash = await argon2.hash('password123');

  // 3. Create Users
  console.log('👤 Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lowkeybd.com',
      username: 'admin',
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      profile: {
        create: {
          bio: 'Platform administrator for LowKeyBD. Keeping communities safe and helpful.',
          locationText: 'Dhaka, Bangladesh',
          reputationScore: 500,
          contributionCount: 15,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@lowkeybd.com',
      username: 'moderator',
      passwordHash,
      role: Role.MODERATOR,
      isVerified: true,
      profile: {
        create: {
          bio: 'Community moderator. Open to feedback on moderation queue events.',
          locationText: 'Chittagong, Bangladesh',
          reputationScore: 250,
          contributionCount: 8,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  const john = await prisma.user.create({
    data: {
      email: 'john@lowkeybd.com',
      username: 'john',
      passwordHash,
      role: Role.USER,
      isVerified: true,
      profile: {
        create: {
          bio: 'Food enthusiast and tech reviewer from Dhaka. Love street food!',
          locationText: 'Dhaka Old Town',
          reputationScore: 120,
          contributionCount: 22,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  const shawn = await prisma.user.create({
    data: {
      email: 'shawn@lowkeybd.com',
      username: 'shawn',
      passwordHash,
      role: Role.USER,
      isVerified: true,
      profile: {
        create: {
          bio: 'Software engineer interested in backend architectures, system design, and database scaling.',
          locationText: 'Sylhet, Bangladesh',
          reputationScore: 95,
          contributionCount: 14,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  const guest = await prisma.user.create({
    data: {
      email: 'guest@lowkeybd.com',
      username: 'guest',
      passwordHash,
      role: Role.USER,
      isVerified: false,
      profile: {
        create: {
          bio: 'Just looking around. Not verified yet.',
          reputationScore: 0,
          contributionCount: 0,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  // 4. Create Communities
  console.log('🏢 Creating communities...');
  const foodies = await prisma.community.create({
    data: {
      name: 'Dhaka Foodies',
      slug: 'dhaka-foodies',
      description: 'Reviewing the best street food, biryanis, and premium dining spots across Dhaka.',
      avatarUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    },
  });

  const tech = await prisma.community.create({
    data: {
      name: 'Tech BD',
      slug: 'tech-bd',
      description: 'Software engineers, designers, product managers, and freelancers in Bangladesh discussing tech developments.',
      avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    },
  });

  const uni = await prisma.community.create({
    data: {
      name: 'University Life',
      slug: 'university-life',
      description: 'Discussing admissions, class routines, exams, university events, and general student life in Bangladesh.',
      avatarUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
    },
  });

  // 5. Add Members to Communities
  console.log('👥 Adding community memberships...');
  const membersData = [
    { userId: admin.id, communityId: foodies.id, role: MemberRole.ADMIN },
    { userId: admin.id, communityId: tech.id, role: MemberRole.ADMIN },
    { userId: admin.id, communityId: uni.id, role: MemberRole.ADMIN },

    { userId: moderator.id, communityId: foodies.id, role: MemberRole.MODERATOR },
    { userId: moderator.id, communityId: tech.id, role: MemberRole.MODERATOR },
    { userId: moderator.id, communityId: uni.id, role: MemberRole.MODERATOR },

    { userId: john.id, communityId: foodies.id, role: MemberRole.MEMBER },
    { userId: john.id, communityId: tech.id, role: MemberRole.MEMBER },

    { userId: shawn.id, communityId: tech.id, role: MemberRole.MEMBER },
    { userId: shawn.id, communityId: uni.id, role: MemberRole.MEMBER },
  ];

  for (const item of membersData) {
    await prisma.communityMember.create({ data: item });
  }

  // 6. Create Posts
  console.log('📝 Seeding posts...');
  const post1 = await prisma.post.create({
    data: {
      title: 'Best Biryani spot in Old Dhaka currently?',
      content: `I am taking some international guests out next Friday and want to give them the ultimate Old Dhaka biryani experience.
      
      Should I take them to Beauty Lassi & Nanna Biryani, Nanna Biryani on Becharam Dewri, or is Hanif Biryani still the king? Please suggest places that are relatively hygienic but authentic!`,
      type: PostType.QUESTION,
      slug: 'best-biryani-spot-in-old-dhaka-currently',
      status: PostStatus.PUBLISHED,
      authorId: john.id,
      communityId: foodies.id,
      upvotes: 5,
      score: 5,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Warning: Avoid this agency in Dhaka for System Integrations',
      content: `I had a terrible experience contracting a local software house near Banani for a simple NestJS enterprise dashboard.
      
      They missed deadlines by 4 months, delivered buggy code with security vulnerabilities (SQL injection in login endpoints!), and refused to refund. Be careful when choosing local agencies without checking their GitHub presence or verified client reviews!`,
      type: PostType.WARNING,
      slug: 'warning-avoid-this-agency-in-dhaka-for-system-integrations',
      status: PostStatus.PUBLISHED,
      authorId: shawn.id,
      communityId: tech.id,
      upvotes: 8,
      downvotes: 1,
      score: 7,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Ultimate Guide to BUET Admission Test Preparation',
      content: `Here is a comprehensive breakdown of resources and strategies for passing the BUET entrance examination:
      
      1. Physics: Focus on concepts in Concepts of Physics by HC Verma and solve all exercises from the Engineering Question Bank.
      2. Chemistry: Memorize organic reaction flows. Make flashcards.
      3. Math: Solve calculus and coordinate geometry problems quickly. Speed is everything.
      
      Ensure you take multiple mock exams to manage time. Good luck to all engineering candidates!`,
      type: PostType.GUIDE,
      slug: 'ultimate-guide-to-buet-admission-test-preparation',
      status: PostStatus.PUBLISHED,
      authorId: admin.id,
      communityId: uni.id,
      upvotes: 12,
      score: 12,
    },
  });

  // 7. Create Comments
  console.log('💬 Seeding comments & replies...');
  const comm1 = await prisma.comment.create({
    data: {
      content: 'For guests, Hanif Biryani might be too crowded. I highly recommend Al-Razzaque in Nazimuddin Road. They have decent seating arrangements and their Kacchi is top notch!',
      postId: post1.id,
      authorId: admin.id,
      score: 4,
    },
  });

  const comm2 = await prisma.comment.create({
    data: {
      content: 'I agree. Al-Razzaque is very hygienic compared to other street biryani joints. Try to reserve their upstairs cabin space if possible.',
      postId: post1.id,
      authorId: moderator.id,
      parentId: comm1.id,
      score: 2,
    },
  });

  const comm3 = await prisma.comment.create({
    data: {
      content: 'Thanks for the warning. Can you DM me the name of the agency? Our startup was planning to outsource some dashboard work next month.',
      postId: post2.id,
      authorId: john.id,
      score: 3,
    },
  });

  // 8. Create Votes
  console.log('🔺 Registering votes...');
  await prisma.vote.create({
    data: { value: 1, userId: admin.id, postId: post1.id },
  });
  await prisma.vote.create({
    data: { value: 1, userId: moderator.id, postId: post1.id },
  });
  await prisma.vote.create({
    data: { value: 1, userId: admin.id, commentId: comm1.id },
  });
  await prisma.vote.create({
    data: { value: 1, userId: moderator.id, commentId: comm3.id },
  });

  // 9. Feature Flags
  console.log('🏁 Creating feature flags...');
  await prisma.featureFlag.create({
    data: {
      key: 'dark_mode_v2',
      description: 'Enable class-based manual light/dark toggle switcher in the header.',
      enabled: true,
      rolloutPercentage: 100,
    },
  });

  await prisma.featureFlag.create({
    data: {
      key: 'deep_search_toggle',
      description: 'Allows toggling between normal indexing and deep document text indexing.',
      enabled: false,
      rolloutPercentage: 0,
    },
  });

  // 10. Reports & Moderation Actions
  console.log('🚩 Seeding moderation logs...');
  const report1 = await prisma.report.create({
    data: {
      reporterId: john.id,
      targetType: 'post',
      targetId: post2.id,
      reason: 'Spam or misleading',
      details: 'This post mentions security issues but did not publish proof. I want moderator to verify the claim.',
      status: ReportStatus.PENDING,
    },
  });

  // 11. Audit Logs
  console.log('📋 Creating audit logs...');
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'COMMUNITY_CREATED',
      entityType: 'community',
      entityId: foodies.id,
      metadata: { name: foodies.name, slug: foodies.slug },
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'COMMUNITY_CREATED',
      entityType: 'community',
      entityId: tech.id,
      metadata: { name: tech.name, slug: tech.slug },
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'FEATURE_FLAG_CREATED',
      entityType: 'feature_flag',
      entityId: 'seed-flag-1',
      metadata: { key: 'dark_mode_v2' },
    },
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
