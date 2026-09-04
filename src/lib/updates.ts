import Constants from 'expo-constants';

import { isNewerVersion, normalizeVersion } from '@/lib/domain';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/meyyy-git/stream-pilot/releases/latest';

export const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

export type UpdateState =
  | { status: 'checking'; currentVersion: string }
  | { status: 'current'; currentVersion: string; latestVersion: string }
  | {
      status: 'available';
      currentVersion: string;
      latestVersion: string;
      releaseUrl: string;
      downloadUrl?: string;
    }
  | { status: 'error'; currentVersion: string };

type GitHubRelease = {
  tag_name?: string;
  html_url?: string;
  assets?: { name?: string; browser_download_url?: string }[];
};

export async function fetchLatestUpdate(): Promise<UpdateState> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Release check failed');

    const release = await response.json() as GitHubRelease;
    const latestVersion = normalizeVersion(release.tag_name ?? '');
    if (!latestVersion || !release.html_url) throw new Error('Invalid release');

    if (!isNewerVersion(latestVersion, currentVersion)) {
      return { status: 'current', currentVersion, latestVersion };
    }

    const apk = release.assets?.find((asset) => asset.name?.toLowerCase().endsWith('.apk'));
    return {
      status: 'available',
      currentVersion,
      latestVersion,
      releaseUrl: release.html_url,
      downloadUrl: apk?.browser_download_url,
    };
  } finally {
    clearTimeout(timeout);
  }
}
