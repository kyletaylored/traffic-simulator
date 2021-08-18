# Traffic Simulator

A simple NodeJS script to simulate web traffic on a site from a browser and not just pinging the pages. Utilizes the sitemap.xml of a site as a source for pages to crawl.

## How it works

1. Provide the script a sitemap.xml path.
1. The script will then extract the list of pages to be used as a dictionary to choose from.
1. Up to 6 random pages will be selected.
1. A Puppeteer instance is generated, and a random assignment of user agents will be generated.
1. The script will then crawl through the random pages assigned to a user agent and move on.
1. It will keep running until you kill the script.

## Installation

```bash
git clone https://github.com/kyletaylored/traffic-simulator
cd traffic-simulator
npm i
node index.js https://example.com/sitemap.xml
```
