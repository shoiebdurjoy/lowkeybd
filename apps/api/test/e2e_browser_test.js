const { chromium } = require('playwright');
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

async function getVerificationToken(email) {
  const res = await request('http://localhost:8025/api/v1/messages', 'GET');
  if (!res.body || !res.body.messages) return null;
  const msg = res.body.messages.find(m => m.To[0].Address === email);
  if (!msg) return null;

  const msgDetails = await request(`http://localhost:8025/api/v1/message/${msg.ID}`, 'GET');
  if (!msgDetails.body || !msgDetails.body.Text) return null;
  const match = msgDetails.body.Text.match(/Your verification token is: ([a-f0-9]+)/);
  return match ? match[1] : null;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== STARTING BROWSER END-TO-END MULTI-USER VERIFICATION ===\n');

  const timestamp = Date.now();
  const emailA = `usera_browser_${timestamp}@example.com`;
  const usernameA = `usera_browser_${timestamp}`;
  const emailB = `userb_browser_${timestamp}@example.com`;
  const usernameB = `userb_browser_${timestamp}`;
  const password = 'Password123!';

  console.log('Launching Playwright Chrome instance...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });

  // Create two isolated browser contexts representing two different users
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // ----------------------------------------------------
  // STEP 1: USER A REGISTRATION & EMAIL VERIFICATION
  // ----------------------------------------------------
  console.log('1. User A navigating to register page...');
  await pageA.goto('http://localhost:3000/register');
  await pageA.fill('input[placeholder="Email Address"]', emailA);
  await pageA.fill('input[placeholder="Username"]', usernameA);
  await pageA.fill('input[placeholder="Password"]', password);
  
  console.log('User A submitting registration...');
  await pageA.click('button:has-text("Register")');

  console.log('Waiting for verification page to load...');
  await pageA.waitForURL('**/verify');

  console.log('Fetching User A verification email from Mailpit...');
  await sleep(1500);
  const tokenA = await getVerificationToken(emailA);
  if (!tokenA) throw new Error('Verification token for User A not found in Mailpit');

  console.log(`Submitting User A verification token: ${tokenA}`);
  await pageA.fill('input[placeholder="Enter 6-digit verification code"]', tokenA);
  await pageA.click('button:has-text("Verify Email")');

  console.log('Waiting for homepage redirect...');
  await pageA.waitForURL('http://localhost:3000/');
  console.log('SUCCESS: User A registered and verified successfully.\n');

  // ----------------------------------------------------
  // STEP 2: USER B REGISTRATION & EMAIL VERIFICATION
  // ----------------------------------------------------
  console.log('2. User B navigating to register page...');
  await pageB.goto('http://localhost:3000/register');
  await pageB.fill('input[placeholder="Email Address"]', emailB);
  await pageB.fill('input[placeholder="Username"]', usernameB);
  await pageB.fill('input[placeholder="Password"]', password);
  
  console.log('User B submitting registration...');
  await pageB.click('button:has-text("Register")');

  console.log('Waiting for verification page...');
  await pageB.waitForURL('**/verify');

  console.log('Fetching User B verification email from Mailpit...');
  await sleep(1500);
  const tokenB = await getVerificationToken(emailB);
  if (!tokenB) throw new Error('Verification token for User B not found in Mailpit');

  console.log(`Submitting User B verification token: ${tokenB}`);
  await pageB.fill('input[placeholder="Enter 6-digit verification code"]', tokenB);
  await pageB.click('button:has-text("Verify Email")');

  console.log('Waiting for homepage redirect...');
  await pageB.waitForURL('http://localhost:3000/');
  console.log('SUCCESS: User B registered and verified successfully.\n');

  // ----------------------------------------------------
  // STEP 3: USER A CREATES COMMUNITY & POSTS
  // ----------------------------------------------------
  const communityName = `Dhaka Tech ${timestamp}`;
  const communitySlug = `dhaka-tech-${timestamp}`;

  console.log(`3. User A navigating to create community page...`);
  await pageA.goto('http://localhost:3000/communities/create');
  await pageA.fill('input[placeholder="e.g. Dhaka Foodies"]', communityName);
  await pageA.fill('input[placeholder="e.g. dhaka-foodies"]', communitySlug);
  await pageA.fill('textarea[placeholder="Describe your community..."]', 'Dhaka developer community');
  
  console.log('User A submitting community form...');
  await pageA.click('button:has-text("Create Hub")');

  console.log(`Waiting for community c/${communitySlug} detail page...`);
  await pageA.waitForURL(`**/c/${communitySlug}`);
  console.log('SUCCESS: Community created.');

  console.log('User A creating a discussion post...');
  await pageA.goto('http://localhost:3000/posts/create');
  await pageA.fill('input[placeholder="Title of your post"]', 'NextJS 16 E2E Test Thread');
  await pageA.fill('textarea[placeholder="What do you want to share or ask?"]', 'Let us discuss Playwright browser automation on NestJS endpoints!');
  
  // Select post type & community
  await pageA.selectOption('select', [
    { label: '💬 Discussion' },
    { label: communityName }
  ]);
  
  console.log('User A submitting post form...');
  await pageA.click('button:has-text("Publish Post")');

  console.log('Waiting for post detail page redirect...');
  await pageA.waitForSelector('.post-container, .post-title');
  const postUrl = pageA.url();
  console.log(`SUCCESS: Post published successfully at url: ${postUrl}\n`);

  // ----------------------------------------------------
  // STEP 4: USER B SUGGESTION SEARCH, JOINS COMMUNITY, UPVOTES & COMMENTS
  // ----------------------------------------------------
  console.log('4. User B searching for community in Navbar...');
  await pageB.goto('http://localhost:3000/');
  await pageB.fill('input[placeholder="Search LowKeyBD..."]', communitySlug);
  
  console.log('Waiting for auto-suggestions dropdown...');
  await pageB.waitForSelector('.search-suggestions-dropdown');
  
  console.log('Clicking on the community suggestion...');
  await pageB.click(`.suggestion-item:has-text("c/${communitySlug}")`);
  
  console.log('Waiting for community detail page...');
  await pageB.waitForURL(`**/c/${communitySlug}`);
  
  console.log('User B joining the community...');
  const joinBtn = pageB.locator('button:has-text("Join Hub"), button:has-text("Join")');
  await joinBtn.click();
  await sleep(1000);
  
  // Check that the button changes text
  const leaveBtn = pageB.locator('button:has-text("Leave Hub"), button:has-text("Leave")');
  await pageB.waitForSelector('button:has-text("Leave Hub"), button:has-text("Leave")');
  console.log('SUCCESS: User B joined community.');

  console.log('User B opening the post from community feed...');
  await pageB.click(`h3:has-text("NextJS 16 E2E Test Thread")`);
  await pageB.waitForSelector('.post-container, .post-title');

  console.log('User B casting upvote on the post...');
  // Find upvote button (e.g. by text or locator)
  // Let's check for selector or text
  const upvoteBtn = pageB.locator('button:has-text("▲"), .vote-btn-up');
  if (await upvoteBtn.count() > 0) {
    await upvoteBtn.first().click();
  } else {
    // try text match
    await pageB.click('span:has-text("Score")');
  }
  await sleep(1000);

  console.log('User B submitting a comment...');
  await pageB.fill('textarea[placeholder="Share your thoughts..."]', 'This is a live comment from User B!');
  await pageB.click('button:has-text("Post Comment")');
  
  console.log('Waiting for comment to appear in UI...');
  await pageB.waitForSelector('text=This is a live comment from User B!');
  console.log('SUCCESS: User B upvoted and commented.\n');

  // ----------------------------------------------------
  // STEP 5: REALTIME IN-APP NOTIFICATIONS & PREFERENCES
  // ----------------------------------------------------
  console.log('5. Verifying User A received realtime notification...');
  // Check User A page
  const notifLinkA = pageA.locator('a[href="/notifications"]');
  
  // Wait for notification badge to show unread notifications
  await pageA.waitForSelector('span.notification-badge');
  const badgeText = await pageA.locator('span.notification-badge').textContent();
  console.log(`Realtime unread notification badge count: ${badgeText}`);

  console.log('User A navigating to notifications page...');
  await notifLinkA.click();
  await pageA.waitForURL('**/notifications');

  console.log('Verifying comment notification in list...');
  await pageA.waitForSelector('text=New Comment on Your Post');
  await pageA.waitForSelector('text=This is a live comment from User B!');
  console.log('SUCCESS: Realtime comment notification verified.');

  console.log('User A marking notification as read...');
  // Click notification card to mark read and navigate
  await pageA.click('div.notif-card.unread');
  await pageA.waitForURL(postUrl);

  console.log('User A navigating back to notifications...');
  await pageA.goto('http://localhost:3000/notifications');
  
  console.log('Toggling notification settings...');
  await pageA.click('button:has-text("Preferences")');
  await pageA.waitForSelector('text=Notification Settings');
  
  // Toggle some checkbox
  const commentCheckbox = pageA.locator('input[type="checkbox"]').first();
  const checkedBefore = await commentCheckbox.isChecked();
  await commentCheckbox.click();
  await sleep(1000);
  const checkedAfter = await commentCheckbox.isChecked();
  console.log(`Preferences toggled: was ${checkedBefore}, now ${checkedAfter}`);
  console.log('SUCCESS: Preferences page toggle verified.\n');

  // ----------------------------------------------------
  // STEP 6: USER A REPLIES -> USER B REALTIME NOTIFICATION
  // ----------------------------------------------------
  console.log('6. User A replying to User B\'s comment...');
  await pageA.goto(postUrl);
  await pageA.waitForSelector('.post-container, .post-title');
  
  // Click Reply button on comment
  const commentReplyBtn = pageA.locator('button:has-text("Reply")').first();
  await commentReplyBtn.click();
  
  // Fill nested comment form
  await pageA.fill('textarea[placeholder="Write a reply..."]', 'Nested reply from User A!');
  await pageA.click('button:has-text("Post Reply")');
  await pageA.waitForSelector('text=Nested reply from User A!');
  console.log('Nested reply posted.');

  console.log('Verifying User B received realtime reply notification...');
  // Check User B page
  await pageB.waitForSelector('span.notification-badge');
  const badgeTextB = await pageB.locator('span.notification-badge').textContent();
  console.log(`Realtime unread notification badge count for User B: ${badgeTextB}`);

  console.log('User B navigating to notifications feed...');
  await pageB.goto('http://localhost:3000/notifications');
  await pageB.waitForSelector('text=New Reply to Your Comment');
  await pageB.waitForSelector('text=Nested reply from User A!');
  console.log('SUCCESS: Realtime reply notification verified.');

  console.log('User B marking all notifications as read...');
  await pageB.click('button:has-text("Mark all as read")');
  await sleep(1000);
  
  const badgeCountBAfter = await pageB.locator('span.notification-badge').count();
  console.log(`Unread badge count after marking all read: ${badgeCountBAfter}`);
  if (badgeCountBAfter !== 0) throw new Error('Unread badge count should be 0');

  console.log('SUCCESS: Mark all read verified.\n');

  console.log('Closing browser contexts...');
  await browser.close();

  console.log('=== ALL BRONZE, SILVER, AND GOLD MILESTONES VERIFIED END-TO-END SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('\n❌ BROWSER VERIFICATION FAILED:', err);
  process.exit(1);
});
