import puppeteer from 'puppeteer';

const scrapeGitHubProfile = async (username) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(`https://github.com/${username}`, { waitUntil: 'networkidle2' });

    const profileData = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.innerText.trim() || null;

      const parseNumber = (text) =>
        text ? parseInt(text.replace(/,/g, '').trim()) : 0;

      return {
        name: getText('span.p-name.vcard-fullname'),
        username: getText('span.p-nickname.vcard-username'),
        bio: getText('div.p-note.user-profile-bio'),
        repositories: parseNumber(getText('a[href$="?tab=repositories"] span.Counter')),
        followers: parseNumber(getText('a[href$="?tab=followers"] span.Counter')),
        following: parseNumber(getText('a[href$="?tab=following"] span.Counter'))
      };
    });

    // Navigate to Repositories tab
    await Promise.all([
      page.click('a[href$="?tab=repositories"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Scrape top 3 public repos by stars
    const topRepos = await page.evaluate(() => {
      const repos = Array.from(document.querySelectorAll('li source')).length > 0
        ? document.querySelectorAll('li.source') 
        : document.querySelectorAll('li.public');

      return Array.from(repos).slice(0, 10).map(repo => {
        const name = repo.querySelector('a[itemprop="name codeRepository"]')?.innerText.trim();
        const stars = repo.querySelector('a[href$="/stargazers"]')?.innerText.trim();
        return {
          name,
          stars: parseInt(stars?.replace(',', '') || '0')
        };
      }).filter(r => r.name).sort((a, b) => b.stars - a.stars).slice(0, 3);
    });

    await browser.close();

    return {
      ...profileData,
      top_repositories: topRepos
    };
  } catch (error) {
    await browser.close();
    throw new Error('Error scraping GitHub: ' + error.message);
  }
};

export default scrapeGitHubProfile;
