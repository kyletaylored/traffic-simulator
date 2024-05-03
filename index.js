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

const randomArrayItem = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const getPosts = async () => {
  const sitemap = new Sitemapper();
  const sites = await sitemap.fetch(sitemapUrl);
  return sites.sites;
};

const visitPage = async (page, path) => {
  await page.goto(path, { waitUntil: "networkidle2" }).catch((err) => {
    console.log("err: ", err);
  });
  console.log(await page.title());
  await page.close();
};

const crawlPage = async (posts) => {
  const browser = await puppeteer.launch();

  try {
    const promises = posts.map(async (post) => {
      const page = await browser.newPage();
      await assignRandomAgent(page);
      return visitPage(page, post);
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
};

const assignRandomAgent = async (page) => {
  const now = Date.now();
  let agent = randomArrayItem(userAgents).data.userAgent;

  console.log("user agent: ", agent);

  const userAgentData = randomArrayItem(userAgents).data;
  await page.setUserAgent(userAgentData.userAgent, {
    platform: userAgentData.platform,
    mobile: userAgentData.deviceCategory === "mobile",
  });

  await page.setViewport({
    width: userAgentData.viewportWidth,
    height: userAgentData.viewportHeight,
    isMobile: userAgentData.deviceCategory === "mobile",
    isLandscape: userAgentData.screenHeight < userAgentData.screenWidth,
  });
};

(async () => {
  const posts = await getPosts();
  let crawlCount = 0;
  setInterval(() => {
    console.log("Crawl Count: ", crawlCount);
    crawlCount++;
    crawlPage(posts);
  }, 5000);
})();
