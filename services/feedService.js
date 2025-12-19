
const PROXY_URL = './proxy.php?url=';
const HEISE_FEED = 'https://www.heise.de/security/Alerts/feed.xml';

export async function fetchHeiseAlerts() {
  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(HEISE_FEED)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const entries = Array.from(xmlDoc.getElementsByTagName('entry'));
    
    return entries.map(entry => {
      const id = entry.getElementsByTagName('id')[0]?.textContent;
      const title = entry.getElementsByTagName('title')[0]?.textContent;
      const summary = entry.getElementsByTagName('summary')[0]?.textContent;
      const link = entry.getElementsByTagName('link')[0]?.getAttribute('href');
      const updated = entry.getElementsByTagName('updated')[0]?.textContent;
      
      return {
        id,
        title,
        summary,
        link,
        date: new Date(updated),
        source: 'Heise Security'
      };
    });
  } catch (error) {
    console.error('Error fetching Heise alerts:', error);
    throw error;
  }
}
