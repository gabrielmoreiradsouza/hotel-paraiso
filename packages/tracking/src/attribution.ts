const STORAGE_KEY = 'hp_origem';
const TTL_DAYS = 30;

const AD_GROUP_NAMES: Record<string, string> = {
  '199126263066': 'Hospedagem Geral',
  '208047700468': 'Hotel Ponte Nova',
  '199126096026': 'Serviços Específicos',
  '199807306019': 'Serviços + Região',
};

export interface Attribution {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  gclid?: string;
  fbclid?: string;
  landing_page: string;
  first_seen: string;
}

function readStore(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Attribution & { expires_at?: number };
    if (data.expires_at && Date.now() > data.expires_at) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeStore(attr: Attribution): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...attr, expires_at: Date.now() + TTL_DAYS * 86400000 })
    );
  } catch {
    // storage full or unavailable
  }
}

function classifyReferrer(referrer: string): { source: string; medium: string } {
  if (!referrer) return { source: '(direct)', medium: '(none)' };
  try {
    const host = new URL(referrer).hostname;
    if (/google\.\w+/.test(host)) return { source: 'google', medium: 'organic' };
    if (host.includes('instagram.com')) return { source: 'instagram', medium: 'social' };
    if (host.includes('facebook.com') || host.includes('l.facebook.com'))
      return { source: 'facebook', medium: 'social' };
    return { source: host, medium: 'referral' };
  } catch {
    return { source: '(direct)', medium: '(none)' };
  }
}

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmContent = params.get('utm_content');
  const utmTerm = params.get('utm_term');
  const gclid = params.get('gclid');
  const fbclid = params.get('fbclid');

  const hasUtm = utmSource || utmMedium || utmCampaign || gclid || fbclid;

  if (hasUtm) {
    const attr: Attribution = {
      source: utmSource || (gclid ? 'google' : '(direct)'),
      medium: utmMedium || (gclid ? 'cpc' : '(none)'),
      landing_page: window.location.pathname,
      first_seen: new Date().toISOString(),
    };
    if (utmCampaign) attr.campaign = utmCampaign;
    if (utmContent) attr.content = utmContent;
    if (utmTerm) attr.term = utmTerm;
    if (gclid) attr.gclid = gclid;
    if (fbclid) attr.fbclid = fbclid;
    writeStore(attr);
    return;
  }

  // No UTMs — only classify by referrer if there's no existing attribution
  const existing = readStore();
  if (existing) return;

  const { source, medium } = classifyReferrer(document.referrer);
  writeStore({
    source,
    medium,
    landing_page: window.location.pathname,
    first_seen: new Date().toISOString(),
  });
}

export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  return readStore();
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function getGA4Ids(): { client_id: string | null; session_id: string | null } {
  const gaCookie = getCookie('_ga');
  let clientId: string | null = null;
  if (gaCookie) {
    // Format: GA1.1.1234567890.1791047542 → "1234567890.1791047542"
    const parts = gaCookie.split('.');
    if (parts.length >= 4) {
      clientId = parts.slice(2).join('.');
    }
  }

  const sessionCookie = getCookie('_ga_VW178YY861');
  let sessionId: string | null = null;
  if (sessionCookie) {
    // New format: GS2.1.s1791047542$o3$g1$t... → "1791047542"
    const newMatch = sessionCookie.match(/\.s(\d+)\$/);
    if (newMatch?.[1]) {
      sessionId = newMatch[1];
    } else {
      // Old format: GS1.1.1791047542.3.1... → "1791047542"
      const parts = sessionCookie.split('.');
      if (parts.length >= 3) {
        sessionId = parts[2] ?? null;
      }
    }
  }

  return { client_id: clientId, session_id: sessionId };
}

export function formatAttributionLabel(attr: Attribution): string {
  const { source, medium, campaign, content, term } = attr;

  if (medium === 'cpc' && source === 'google') {
    const parts = ['Google Ads'];
    if (campaign === 'hrp_local') parts.push('Local');
    else if (campaign === 'hrp_regional') parts.push('Regional');
    else if (campaign) parts.push(campaign);
    if (content && AD_GROUP_NAMES[content]) parts.push(AD_GROUP_NAMES[content]);
    if (term) parts.push(`"${term}"`);
    return parts.join(' — ');
  }
  if (source === 'google' && medium === 'organic') return 'Google (busca orgânica)';
  if (source === 'instagram') return 'Instagram';
  if (source === 'facebook') return 'Facebook';
  if (source === '(direct)') return 'Acesso direto';
  return `${source} / ${medium}`;
}
