import { isTrakteerActionUrl } from '@/lib/domain';

export async function triggerTrakteerAction(url: string) {
  if (!isTrakteerActionUrl(url)) throw new Error('URL Aksi Trakteer tidak valid.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!response.ok) throw new Error(`Trakteer merespons ${response.status}.`);
  } finally {
    clearTimeout(timeout);
  }
}
