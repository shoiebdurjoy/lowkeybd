const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

async function request(url, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          if (data) json = JSON.parse(data);
        } catch (e) {
          // not json
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json || data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== STARTING LOWKEYBD NOTIFICATIONS END-TO-END VERIFICATION ===\n');

  const timestamp = Date.now();
  const emailA = `notif_usera_${timestamp}@example.com`;
  const userA = `notif_usera_${timestamp}`;
  const emailB = `notif_userb_${timestamp}@example.com`;
  const userB = `notif_userb_${timestamp}`;
  const password = 'Password123!';

  // 1. Register & Verify User A
  console.log('1. Registering and verifying User A...');
  const regA = await request(`${API_BASE}/auth/register`, 'POST', {}, { email: emailA, username: userA, password });
  if (regA.status !== 201) throw new Error('User A registration failed');
  
  // Directly set verified in DB or fetch Mailpit (using a sleep for mail delivery check if needed, but we can verify it using AuthContext or login first)
  // Let's verify via Mailpit
  await sleep(1000);
  const messagesRes = await request('http://localhost:8025/api/v1/messages', 'GET');
  const msgA = messagesRes.body.messages.find(m => m.To[0].Address === emailA);
  if (!msgA) throw new Error('Verification email for User A not found in Mailpit');
  const msgDetailsA = await request(`http://localhost:8025/api/v1/message/${msgA.ID}`, 'GET');
  const matchA = msgDetailsA.body.Text.match(/Your verification token is: ([a-f0-9]+)/);
  if (!matchA) throw new Error('Token match failed for User A');
  const verifyA = await request(`${API_BASE}/auth/verify-email`, 'POST', {}, { token: matchA[1] });
  if (verifyA.status !== 201 && verifyA.status !== 200) throw new Error('User A verification failed');
  console.log('User A successfully verified.');

  // 2. Register & Verify User B
  console.log('2. Registering and verifying User B...');
  const regB = await request(`${API_BASE}/auth/register`, 'POST', {}, { email: emailB, username: userB, password });
  if (regB.status !== 201) throw new Error('User B registration failed');
  await sleep(1000);
  const messagesResB = await request('http://localhost:8025/api/v1/messages', 'GET');
  const msgB = messagesResB.body.messages.find(m => m.To[0].Address === emailB);
  if (!msgB) throw new Error('Verification email for User B not found in Mailpit');
  const msgDetailsB = await request(`http://localhost:8025/api/v1/message/${msgB.ID}`, 'GET');
  const matchB = msgDetailsB.body.Text.match(/Your verification token is: ([a-f0-9]+)/);
  if (!matchB) throw new Error('Token match failed for User B');
  const verifyB = await request(`${API_BASE}/auth/verify-email`, 'POST', {}, { token: matchB[1] });
  if (verifyB.status !== 201 && verifyB.status !== 200) throw new Error('User B verification failed');
  console.log('User B successfully verified.');

  // 3. Login Users
  console.log('\n3. Logging in users...');
  const loginA = await request(`${API_BASE}/auth/login`, 'POST', {}, { email: emailA, password });
  const tokenA = loginA.body.accessToken;
  const headersA = { Authorization: `Bearer ${tokenA}` };

  const loginB = await request(`${API_BASE}/auth/login`, 'POST', {}, { email: emailB, password });
  const tokenB = loginB.body.accessToken;
  const headersB = { Authorization: `Bearer ${tokenB}` };
  console.log('Users logged in successfully.');

  // Create community and post
  const slug = `notif-hub-${timestamp}`;
  console.log(`\nCreating community c/${slug}...`);
  const comm = await request(`${API_BASE}/communities`, 'POST', headersA, {
    name: `Notif Community ${timestamp}`,
    slug,
    description: 'Testing notifications'
  });
  if (comm.status !== 201) throw new Error('Community creation failed');

  console.log('User B joining the community...');
  await request(`${API_BASE}/communities/${slug}/join`, 'POST', headersB);

  console.log('User A creating a post...');
  const post = await request(`${API_BASE}/posts`, 'POST', headersA, {
    title: 'Testing Notification Post',
    content: 'Notifications are being verified.',
    type: 'DISCUSSION',
    communityId: comm.body.id
  });
  if (post.status !== 201) throw new Error('Post creation failed');
  const postId = post.body.id;

  // 4. Test Notification Preferences Endpoints
  console.log('\n4. Testing Notification Preferences...');
  const getPrefs = await request(`${API_BASE}/notifications/preferences`, 'GET', headersA);
  if (getPrefs.status !== 200) throw new Error('Get preferences failed');
  console.log('Initial Preferences:', getPrefs.body);

  console.log('Updating Preferences (toggling newCommentEmail)...');
  const updatePrefs = await request(`${API_BASE}/notifications/preferences`, 'PATCH', headersA, {
    ...getPrefs.body,
    newCommentEmail: false
  });
  if (updatePrefs.status !== 200) throw new Error('Update preferences failed');
  if (updatePrefs.body.newCommentEmail !== false) throw new Error('Preference changes were not persisted');
  console.log('Preferences updated successfully.');

  // Restore email comment preference to true for tests
  await request(`${API_BASE}/notifications/preferences`, 'PATCH', headersA, {
    ...getPrefs.body,
    newCommentEmail: true
  });

  // 5. Trigger NEW_COMMENT Notification
  console.log('\n5. User B commenting on User A\'s post...');
  const commentB = await request(`${API_BASE}/posts/${postId}/comments`, 'POST', headersB, {
    content: 'This is User B commenting!'
  });
  if (commentB.status !== 201) throw new Error('Comment B creation failed');
  const commentBId = commentB.body.id;

  // Give asynchronous event emission a split second
  await sleep(500);

  console.log('Checking User A notifications...');
  const notifsA = await request(`${API_BASE}/notifications`, 'GET', headersA);
  if (notifsA.status !== 200) throw new Error('Failed to fetch User A notifications');
  console.log('User A Notifications list size:', notifsA.body.length);
  const commentNotif = notifsA.body.find(n => n.type === 'NEW_COMMENT' && n.entityId === postId);
  if (!commentNotif) {
    throw new Error('User A did not receive NEW_COMMENT notification');
  }
  console.log('Received Notification details:', {
    title: commentNotif.title,
    body: commentNotif.body,
    readAt: commentNotif.readAt
  });

  // 6. Test Mark As Read
  console.log('\n6. Marking notification as read...');
  const readRes = await request(`${API_BASE}/notifications/${commentNotif.id}/read`, 'POST', headersA);
  if (readRes.status !== 200 && readRes.status !== 201) throw new Error('Failed to mark notification as read');
  
  const checkRead = await request(`${API_BASE}/notifications`, 'GET', headersA);
  const updatedNotif = checkRead.body.find(n => n.id === commentNotif.id);
  if (!updatedNotif.readAt) throw new Error('Notification was not marked as read');
  console.log('Notification read successfully.');

  // 7. Trigger NEW_REPLY Notification
  console.log('\n7. User A replying to User B\'s comment...');
  const replyA = await request(`${API_BASE}/posts/${postId}/comments`, 'POST', headersA, {
    content: 'Thanks for commenting, B!',
    parentId: commentBId
  });
  if (replyA.status !== 201) throw new Error('Reply A creation failed');

  await sleep(500);

  console.log('Checking User B notifications...');
  const notifsB = await request(`${API_BASE}/notifications`, 'GET', headersB);
  const replyNotif = notifsB.body.find(n => n.type === 'NEW_REPLY');
  if (!replyNotif) {
    throw new Error('User B did not receive NEW_REPLY notification');
  }
  console.log('Received Reply Notification details:', {
    title: replyNotif.title,
    body: replyNotif.body,
    readAt: replyNotif.readAt
  });

  // 8. Test No Self-Notification
  console.log('\n8. Verifying User A does not get self-notified when replying to B (on A\'s own post)...');
  const countBefore = checkRead.body.length;
  // User A comments on User A's own post
  const commentSelf = await request(`${API_BASE}/posts/${postId}/comments`, 'POST', headersA, {
    content: 'My own comment on my own post.'
  });
  if (commentSelf.status !== 201) throw new Error('Self comment failed');
  await sleep(500);

  const checkSelf = await request(`${API_BASE}/notifications`, 'GET', headersA);
  const countAfter = checkSelf.body.length;
  console.log('Notifications count before:', countBefore, 'and after:', countAfter);
  if (countAfter !== countBefore) {
    throw new Error('User A received a notification for their own action!');
  }
  console.log('SUCCESS: Self-notification prevention verified.');

  // 9. Test Mark All As Read
  console.log('\n9. Testing mark all as read...');
  // Force an unread notification for B by A making another top-level comment
  await request(`${API_BASE}/posts/${postId}/comments`, 'POST', headersA, {
    content: 'Another top level comment on B\'s thread.'
  });
  // Wait for event
  await sleep(500);

  // User B joins community and posts, then B replies to B's own? No, User B has comment, User A comments on it (nested) -> triggers reply to B
  const replyB = await request(`${API_BASE}/posts/${postId}/comments`, 'POST', headersA, {
    content: 'Another reply to B.',
    parentId: commentBId
  });
  await sleep(500);

  const checkBBefore = await request(`${API_BASE}/notifications`, 'GET', headersB);
  const unreadBCount = checkBBefore.body.filter(n => !n.readAt).length;
  console.log(`User B unread count: ${unreadBCount}`);
  if (unreadBCount === 0) throw new Error('User B has no unread notifications to test mark all read');

  console.log('Marking all as read for User B...');
  const markAllRes = await request(`${API_BASE}/notifications/read-all`, 'POST', headersB);
  if (markAllRes.status !== 200 && markAllRes.status !== 201) throw new Error('Mark all read failed');

  const checkBAfter = await request(`${API_BASE}/notifications`, 'GET', headersB);
  const unreadBCountAfter = checkBAfter.body.filter(n => !n.readAt).length;
  console.log(`User B unread count after: ${unreadBCountAfter}`);
  if (unreadBCountAfter !== 0) throw new Error('Not all notifications were marked as read');
  console.log('SUCCESS: Mark all read verified.');

  console.log('\n=== ALL NOTIFICATION FLOWS VERIFIED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('\n❌ NOTIFICATION VERIFICATION FAILED:', err);
  process.exit(1);
});
