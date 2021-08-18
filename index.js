const puppeteer = require("puppeteer");
const UserAgent = require("user-agents");
const Sitemapper = require("sitemapper");
const args = process.argv.slice(2);

// If no site, bail.
if (args.length === 0 || !args[0].endsWith(".xml")) {
  console.log("No sitemap.xml URL provided");
  process.exit();
}

// Assign sitemap.
const sitemapUrl = args[0];

// Generate user agents
const userAgent = new UserAgent();
const userAgents = Array(500)
  .fill()
  .map(() => userAgent());
// Get random user agent
let assignRandomAgent = async (page) => {
  const now = Date.now();

  // Use either native Puppeteer device, or random UA. 50/50 chance.
  if (now % 2 == 0) {
    const agent = randomArrayItem(Object.keys(puppeteer.devices));
    console.log("user agent: ", agent);
    const device = puppeteer.devices[agent];
    await page.emulate(device);
  } else {
    const agent = randomArrayItem(userAgents);
    console.log("user agent: ", agent.data.userAgent);
    await page.setUserAgent(agent.data.userAgent, {
      platform: agent.data.platform,
      mobile: agent.data.deviceCategory === "mobile",
    });

    await page.setViewport({
      width: agent.data.viewportWidth,
      height: agent.data.viewportHeight,
      isMobile: agent.data.deviceCategory === "mobile",
      isLandscape: agent.data.screenHeight < agent.data.screenWidth,
    });
  }
};

/**
 * Return random array item.
 * @param {Array} arr
 * @returns
 */
const randomArrayItem = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Get a list of pages from the sitemap.
 * @returns array
 */
const getPosts = async () => {
  const sitemap = new Sitemapper();
  return await sitemap.fetch(sitemapUrl).then((sites) => {
    return sites;
  });
};

/**
 * Clear the Puppeteer browser (cookies, etc).
 * @param {object} page
 */
const clearBrowser = async (page) => {
  // clear cookies
  const client = await page.target().createCDPSession();
  await await client.send("Network.clearBrowserCookies");
};

/**
 * Visit the pages in random order.
 * @param {object} browser
 * @param {array} paths
 */
const visitPage = async (browser, paths) => {
  const page = await browser.newPage();
  await assignRandomAgent(page);
  // Go to paths
  for (let path in paths) {
    await page.goto(paths[path], { waitUntil: "networkidle2" }).catch((err) => {
      console.log("err: ", err);
    });
    console.log(await page.title());
  }
  // Clear cookies
  clearBrowser(page);
  // await page.screenshot({
  //     path: 'full.png',
  //     fullPage: true
  // });
};

/**
 * Generate random subset of posts.
 * @param {array} postList
 * @returns
 */
const getRandomPosts = (postList) => {
  let posts = [];
  // Grab up to 6 pages to crawl.
  const limit = Math.floor(Math.random() * 6) + 1;
  for (let i = 0; i < limit; i++) {
    let post = randomArrayItem(postList);
    posts.push(post);
  }
  return posts;
};

/**
 * Crawl pages
 * @param object browser
 * @param array posts
 * @param array postPromises
 */
const crawlPage = (browser, posts, postPromises) => {
  postPromises.push(visitPage(browser, getRandomPosts(posts)));
};

// Main
(async () => {
  const postsSitemap = await getPosts();
  const posts = postsSitemap.sites;
  const browser = await puppeteer.launch();
  let postPromises = [];
  let crawlCount = 0;
  setInterval(() => {
    console.log("Crawl Count: ", crawlCount);
    crawlCount++;
    crawlPage(browser, posts, postPromises);
  }, 5000);

  // await browser.close();
})();
