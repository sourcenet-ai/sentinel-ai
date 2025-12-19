
const PROXY_ENDPOINT = './proxy.php?url=';

const FEED_SOURCES = [
  { name: 'Heise Security', url: 'https://www.heise.de/security/Alerts/feed.xml', format: 'atom', category: 'intel' },
  { name: 'CERT-EU', url: 'https://cert.europa.eu/publications/security-advisories-rss', format: 'rss', category: 'intel' },
  { name: 'CIS Security', url: 'https://www.cisecurity.org/feed/advisories', format: 'rss', category: 'intel' },
  { name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed_full.xml', format: 'rss', category: 'intel' },
  { name: 'CISA ICS', url: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', format: 'atom', category: 'intel' },
  { name: 'Ransomware.live', url: 'https://api.ransomware.live/victims/recent', format: 'json', category: 'ransomware' }
];

async function fetchRaw(url) {
  // Use our local PHP proxy to bypass CORS
  const target = `${PROXY_ENDPOINT}${encodeURIComponent(url)}`;
  const response = await fetch(target);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return await response.text();
}

export async function fetchAllAdvisories() {
  const errors = [];
  const results = await Promise.all(FEED_SOURCES.map(async (source) => {
    try {
      const content = await fetchRaw(source.url);
      
      if (source.format === 'json') {
        const data = JSON.parse(content);
        return data.map(v => ({
          id: v.id || v.post_title,
          title: v.post_title || v.victim_name,
          link: v.website || '#',
          summary: `Group: ${v.group_name}. Discovered: ${v.discovered || v.date}.`,
          content: v.description || '',
          published: new Date(v.discovered || v.date || Date.now()),
          source: v.group_name || 'Ransomware Group',
          author: 'Intelligence Feed',
          category: source.category
        }));
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      if (source.format === 'atom') {
        return parseAtom(xmlDoc, source);
      } else {
        return parseRSS(xmlDoc, source);
      }
    } catch (e) {
      errors.push({ source: source.name, message: e.message });
      return [];
    }
  }));

  const flattened = results.flat();
  return { 
    advisories: flattened.sort((a, b) => b.published - a.published), 
    errors 
  };
}

function getSafeText(parent, tagName) {
  const el = parent.getElementsByTagName(tagName)[0];
  return el ? el.textContent.trim() : '';
}

function parseAtom(xmlDoc, source) {
  const entries = Array.from(xmlDoc.getElementsByTagName('entry'));
  return entries.map(entry => {
    const linkEl = entry.getElementsByTagName('link')[0];
    const link = linkEl ? linkEl.getAttribute('href') : '#';
    return {
      id: getSafeText(entry, 'id') || Math.random().toString(),
      title: getSafeText(entry, 'title'),
      link,
      summary: getSafeText(entry, 'summary') || getSafeText(entry, 'content'),
      content: getSafeText(entry, 'content'),
      published: new Date(getSafeText(entry, 'published') || getSafeText(entry, 'updated')),
      source: source.name,
      author: source.name,
      category: source.category
    };
  });
}

function parseRSS(xmlDoc, source) {
  const items = Array.from(xmlDoc.getElementsByTagName('item'));
  return items.map(item => ({
    id: getSafeText(item, 'guid') || getSafeText(item, 'link'),
    title: getSafeText(item, 'title'),
    link: getSafeText(item, 'link'),
    summary: getSafeText(item, 'description'),
    content: getSafeText(item, 'description'),
    published: new Date(getSafeText(item, 'pubDate')),
    source: source.name,
    author: source.name,
    category: source.category
  }));
}
