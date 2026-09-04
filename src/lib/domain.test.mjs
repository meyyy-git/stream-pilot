import assert from 'node:assert/strict';
import test from 'node:test';

import { getChatRoleColors, isNewerVersion, isTrakteerActionUrl, normalizeVersion, parseObsQrCode, toYouTubeChatUrl } from './domain.ts';

test('normalizes supported YouTube links without an API', () => {
  const expected = 'https://www.youtube.com/live_chat?is_popout=1&v=abc12345678';
  assert.equal(toYouTubeChatUrl('https://youtu.be/abc12345678'), expected);
  assert.equal(toYouTubeChatUrl('https://youtube.com/watch?v=abc12345678'), expected);
  assert.equal(toYouTubeChatUrl('https://youtube.com/live/abc12345678'), expected);
  assert.equal(toYouTubeChatUrl('youtube.com/watch?v=abc12345678'), expected);
  assert.equal(toYouTubeChatUrl('abc12345678'), expected);
  assert.equal(toYouTubeChatUrl('https://youtube.com/live_chat?v=abc12345678&is_popout=1'), expected);
  assert.equal(
    toYouTubeChatUrl('https://www.youtube.com/live_chat?continuation=token123'),
    'https://www.youtube.com/live_chat?is_popout=1&continuation=token123'
  );
  assert.equal(toYouTubeChatUrl('https://example.com/watch?v=abc12345678'), null);
});

test('provides YouTube native role colors and high contrast non-member by theme', () => {
  const dark = getChatRoleColors('dark');
  assert.equal(dark.owner, '#FFD600');
  assert.equal(dark.moderator, '#5E84F1');
  assert.equal(dark.member, '#2BA640');
  assert.equal(dark.nonMember, '#FFFFFF');

  const light = getChatRoleColors('light');
  assert.equal(light.owner, '#FFD600');
  assert.equal(light.moderator, '#5E84F1');
  assert.equal(light.member, '#107516');
  assert.equal(light.nonMember, '#0F0F0F');
});

test('accepts only secure Trakteer hosts', () => {
  assert.equal(isTrakteerActionUrl('https://ws.trakteer.id/action/token'), true);
  assert.equal(isTrakteerActionUrl('http://ws.trakteer.id/action/token'), false);
  assert.equal(isTrakteerActionUrl('https://trakteer.id.example.com/action'), false);
});

test('parses only official OBS WebSocket QR URLs', () => {
  assert.deepEqual(parseObsQrCode('obsws://192.168.1.10:4455/secret'), {
    host: '192.168.1.10',
    port: '4455',
    password: 'secret',
    secure: false,
  });
  assert.deepEqual(parseObsQrCode('obswss://obs.local/p%40ssword'), {
    host: 'obs.local',
    port: '4455',
    password: 'p@ssword',
    secure: true,
  });
  assert.equal(parseObsQrCode('https://obs.local:4455/secret'), null);
  assert.equal(parseObsQrCode('obsws://obs.local:99999/secret'), null);
});

test('compares strict release versions', () => {
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3');
  assert.equal(normalizeVersion('release-1.2.3'), null);
  assert.equal(isNewerVersion('v1.1.0', '1.0.9'), true);
  assert.equal(isNewerVersion('v1.0.0', '1.0.0'), false);
  assert.equal(isNewerVersion('v0.9.9', '1.0.0'), false);
});
