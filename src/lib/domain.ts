export type ThemePreference = 'system' | 'light' | 'dark';
export const chatFontSizes = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30] as const;
export type ChatFontSize = (typeof chatFontSizes)[number];
export type PanelId = 'chat' | 'obs' | 'trakteer';

export type ChatRoleColors = {
  nonMember: string;
  member: string;
  moderator: string;
  owner: string;
};

export function getChatRoleColors(colorScheme: 'light' | 'dark'): ChatRoleColors {
  return {
    nonMember: colorScheme === 'dark' ? '#FFFFFF' : '#0F0F0F',
    member: colorScheme === 'dark' ? '#2BA640' : '#107516',
    moderator: '#5E84F1',
    owner: '#FFD600',
  };
}

export type ObsConfig = {
  host: string;
  port: string;
  password: string;
  secure: boolean;
};

export function parseObsQrCode(value: string): ObsConfig | null {
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== 'obsws:' && url.protocol !== 'obswss:') ||
      !url.hostname || url.username || url.password || url.search || url.hash) return null;

    const port = url.port || '4455';
    if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) return null;

    return {
      host: url.hostname,
      port,
      password: decodeURIComponent(url.pathname.slice(1)),
      secure: url.protocol === 'obswss:',
    };
  } catch {
    return null;
  }
}

export type TrakteerConfig = {
  previous: string;
  play: string;
  pause: string;
  next: string;
  censorText: string;
  censorMedia: string;
  gachaSpin: string;
  gachaHide: string;
  gachaShow: string;
  testNotification: string;
  testYouTube: string;
  testTikTok: string;
  testInstagram: string;
};

export type AppSettings = {
  streamLink: string;
  obs: ObsConfig;
  trakteer: TrakteerConfig;
  chatFontSize: ChatFontSize;
  theme: ThemePreference;
  keepAwake: boolean;
};

export const defaultTrakteerConfig: TrakteerConfig = {
  previous: '',
  play: '',
  pause: '',
  next: '',
  censorText: '',
  censorMedia: '',
  gachaSpin: '',
  gachaHide: '',
  gachaShow: '',
  testNotification: '',
  testYouTube: '',
  testTikTok: '',
  testInstagram: '',
};

export const defaultSettings: AppSettings = {
  streamLink: '',
  obs: { host: '', port: '4455', password: '', secure: false },
  trakteer: defaultTrakteerConfig,
  chatFontSize: 16,
  theme: 'system',
  keepAwake: true,
};

export function toYouTubeChatUrl(value: string) {
  let input = value.trim();
  if (!input) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return `https://www.youtube.com/live_chat?is_popout=1&v=${input}`;
  }

  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host !== 'youtube.com' && host !== 'youtu.be') return null;

    if (url.pathname === '/live_chat' || url.pathname === '/live_chat_replay') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`;
      const continuation = url.searchParams.get('continuation');
      if (continuation) return `https://www.youtube.com/live_chat?is_popout=1&continuation=${encodeURIComponent(continuation)}`;
      return null;
    }

    const videoId =
      host === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v') ??
          url.pathname.match(/^\/(?:live|embed|shorts)\/([^/?]+)/)?.[1];

    return videoId ? `https://www.youtube.com/live_chat?is_popout=1&v=${videoId}` : null;
  } catch {
    return null;
  }
}

export function isTrakteerActionUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' &&
      (url.hostname === 'trakteer.id' || url.hostname.endsWith('.trakteer.id'));
  } catch {
    return false;
  }
}

export function normalizeVersion(value: string) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  return match ? match.slice(1).map(Number).join('.') : null;
}

export function isNewerVersion(candidate: string, current: string) {
  const next = normalizeVersion(candidate)?.split('.').map(Number);
  const installed = normalizeVersion(current)?.split('.').map(Number);
  if (!next || !installed) return false;

  for (let index = 0; index < next.length; index += 1) {
    if (next[index] !== installed[index]) return next[index] > installed[index];
  }
  return false;
}
