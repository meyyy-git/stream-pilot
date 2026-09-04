import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { PanelStatus } from '@/components/console-section';
import { PanelEmptyState } from '@/components/control-ui';
import { getChatRoleColors, toYouTubeChatUrl } from '@/lib/domain';
import { useApp } from '@/providers/app-provider';

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function makeCleanChatCss(
  theme: ReturnType<typeof useApp>['colors'],
  colorScheme: 'light' | 'dark',
  fontSize: number
) {
  const roles = getChatRoleColors(colorScheme);

  return `
    :root {
      color-scheme: ${colorScheme};
      --yt-live-chat-background-color: ${theme.backgroundElement};
      --yt-live-chat-secondary-background-color: ${theme.backgroundSelected};
      --yt-live-chat-disabled-icon-button-color: ${theme.textSecondary};
      --yt-live-chat-picker-button-color: ${theme.textSecondary};
      --yt-live-chat-picker-button-active-color: ${theme.text};
      --yt-spec-base-background: ${theme.backgroundElement};
      --yt-spec-general-background-a: ${theme.backgroundElement};
      --yt-spec-raised-background: ${theme.backgroundSelected};
      --yt-live-chat-primary-text-color: ${theme.text};
      --yt-live-chat-secondary-text-color: ${theme.textSecondary};
      --yt-live-chat-author-name-color: ${roles.nonMember};
      --yt-live-chat-moderator-color: ${roles.moderator};
      --yt-live-chat-sponsor-color: ${roles.member};
      --yt-live-chat-owner-color: ${roles.owner};
    }
    html,
    body,
    yt-live-chat-app,
    yt-live-chat-renderer,
    #chat.yt-live-chat-renderer,
    #chat-messages.yt-live-chat-renderer,
    #item-list.yt-live-chat-renderer,
    yt-live-chat-item-list-renderer,
    yt-live-chat-item-list-renderer #item-scroller,
    yt-live-chat-item-list-renderer #items,
    yt-live-chat-item-list-renderer #contents {
      background: ${theme.backgroundElement} !important;
    }

    /* Hilangkan backdrop opacity tipis bawaan YouTube Polymer */
    tp-yt-iron-overlay-backdrop,
    iron-overlay-backdrop,
    #gradient.yt-live-chat-renderer,
    #item-list::before,
    #item-list::after,
    #item-scroller::before,
    #item-scroller::after {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      background: none !important;
    }

    /* Sembunyikan elemen input dan banner yang tidak diperlukan */
    yt-live-chat-header-renderer,
    yt-live-chat-message-input-renderer,
    #input-panel.yt-live-chat-renderer,
    yt-live-chat-viewer-engagement-message-renderer,
    yt-live-chat-banner-manager,
    #ticker.yt-live-chat-renderer,
    yt-live-chat-ticker-renderer,
    yt-live-chat-restricted-participation-renderer,
    #sign-in-button { display: none !important; }

    yt-live-chat-renderer { padding-top: 0 !important; }
    yt-live-chat-item-list-renderer #items { padding-top: 8px !important; }
    yt-live-chat-text-message-renderer {
      background: transparent !important;
      padding: 6px 12px !important;
    }
    yt-live-chat-text-message-renderer #author-photo {
      width: 24px !important;
      height: 24px !important;
      margin-right: 8px !important;
    }

    /* Non-member: kontras tinggi terhadap tema */
    yt-live-chat-text-message-renderer #author-name,
    yt-live-chat-membership-item-renderer #author-name,
    yt-live-chat-paid-message-renderer #author-name,
    yt-live-chat-author-chip #author-name {
      color: ${roles.nonMember} !important;
      font-size: ${fontSize}px !important;
      font-weight: 600 !important;
      opacity: 1 !important;
    }

    /* Moderator: warna bawaan YouTube (#5e84f1) */
    yt-live-chat-text-message-renderer[author-type="moderator"] #author-name,
    yt-live-chat-text-message-renderer #author-name.moderator,
    yt-live-chat-author-chip[author-type="moderator"] #author-name,
    yt-live-chat-author-chip.moderator #author-name,
    yt-live-chat-author-chip[is-moderator] #author-name {
      color: ${roles.moderator} !important;
      background-color: transparent !important;
      font-weight: 600 !important;
    }
    yt-live-chat-author-chip[author-type="moderator"] #chat-badges yt-live-chat-author-badge-renderer svg,
    yt-live-chat-author-chip[is-moderator] #chat-badges yt-live-chat-author-badge-renderer svg {
      fill: ${roles.moderator} !important;
    }

    /* Member / Sponsor: warna bawaan YouTube */
    yt-live-chat-text-message-renderer[author-type="member"] #author-name,
    yt-live-chat-author-chip[author-type="member"] #author-name,
    yt-live-chat-author-chip.member #author-name,
    yt-live-chat-text-message-renderer #author-name.member {
      color: ${roles.member} !important;
      background-color: transparent !important;
      font-weight: 600 !important;
    }

    /* Owner / Broadcaster: warna bawaan YouTube (#ffd600) */
    yt-live-chat-text-message-renderer[author-type="owner"] #author-name,
    yt-live-chat-author-chip[author-type="owner"] #author-name,
    yt-live-chat-author-chip.owner #author-name,
    yt-live-chat-text-message-renderer #author-name.owner {
      color: ${roles.owner} !important;
      font-weight: 700 !important;
    }
    yt-live-chat-text-message-renderer[author-type="owner"] yt-live-chat-author-chip[is-highlighted],
    yt-live-chat-author-chip[is-highlighted] {
      background-color: ${roles.owner} !important;
      padding: 1px 6px !important;
      border-radius: 4px !important;
    }
    yt-live-chat-text-message-renderer[author-type="owner"] yt-live-chat-author-chip[is-highlighted] #author-name,
    yt-live-chat-author-chip[is-highlighted] #author-name {
      color: #0f0f0f !important;
      background: transparent !important;
      font-weight: 700 !important;
    }

    /* Pesan Chat */
    yt-live-chat-text-message-renderer #message,
    yt-live-chat-membership-item-renderer #message,
    yt-live-chat-paid-message-renderer #message,
    ytd-sponsorships-live-chat-gift-redemption-announcement-renderer #message,
    yt-gift-message-view-model #message,
    yt-gift-message-view-model #message-v2 {
      color: ${theme.text} !important;
      font-size: ${fontSize}px !important;
      font-weight: 500 !important;
      line-height: 1.45 !important;
      opacity: 1 !important;
    }
    yt-live-chat-text-message-renderer #timestamp {
      color: ${theme.textSecondary} !important;
      font-size: ${Math.max(11, fontSize - 2)}px !important;
      opacity: 1 !important;
    }
    yt-live-chat-text-message-renderer #deleted-state { color: ${theme.textSecondary} !important; }
    yt-live-chat-app ::-webkit-scrollbar { width: 8px; }
    yt-live-chat-app ::-webkit-scrollbar-track { background: ${theme.backgroundElement}; }
    yt-live-chat-app ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 8px; }
  `;
}

function makeCleanChatScript(
  theme: ReturnType<typeof useApp>['colors'],
  colorScheme: 'light' | 'dark',
  fontSize: number
) {
  const css = makeCleanChatCss(theme, colorScheme, fontSize);

  return `
(() => {
  const ensureStyle = () => {
    let style = document.getElementById('stream-pilot-clean-chat');
    if (!style) {
      style = document.createElement('style');
      style.id = 'stream-pilot-clean-chat';
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = ${JSON.stringify(css)};
    document.querySelectorAll('tp-yt-iron-overlay-backdrop, iron-overlay-backdrop').forEach((el) => {
      el.style.display = 'none';
      el.remove();
    });
  };
  ensureStyle();

  let checkCount = 0;
  const selectLiveChat = () => {
    if (window.__streamPilotLiveChatChosen || checkCount++ > 25) return;
    const trigger = document.querySelector('yt-live-chat-header-renderer #trigger');
    if (trigger) {
      if (/top chat/i.test(trigger.textContent || '')) {
        trigger.click();
        setTimeout(() => {
          const option = [...document.querySelectorAll('tp-yt-paper-item, ytd-menu-service-item-renderer')]
            .find((item) => /^live chat/i.test((item.textContent || '').trim()));
          if (option) {
            option.click();
            window.__streamPilotLiveChatChosen = true;
            setTimeout(ensureStyle, 100);
          }
        }, 80);
      } else if (/live chat/i.test(trigger.textContent || '')) {
        window.__streamPilotLiveChatChosen = true;
      }
    }
  };

  try {
    Object.defineProperty(document, 'hidden', { get: () => false });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
  } catch (e) {}

  selectLiveChat();

  const keepAliveTimer = setInterval(() => {
    ensureStyle();
    selectLiveChat();

    // Auto-resume jika YouTube men-pause autoscroll
    const showMore = document.querySelector('yt-live-chat-item-list-renderer #show-more, #show-more');
    if (showMore && showMore.offsetParent !== null) {
      showMore.click();
    }
  }, 500);

  true;
})();`;
}

export function LiveChat({
  streamLink,
  onStatusChange,
  refreshToken,
}: {
  streamLink: string;
  onStatusChange?: (status: PanelStatus) => void;
  refreshToken?: number;
}) {
  const { colors: theme, resolvedTheme, settings } = useApp();
  const uri = toYouTubeChatUrl(streamLink);
  const webviewRef = useRef<WebView>(null);
  const [webViewState, setWebViewState] = useState<{
    uri: string | null;
    loading: boolean;
    status: PanelStatus;
  }>({ uri, loading: Boolean(uri), status: 'connecting' });
  const status: PanelStatus = !streamLink.trim()
    ? 'unconfigured'
    : !uri
      ? 'error'
      : webViewState.uri === uri
        ? webViewState.status
        : 'connecting';
  const loading = Boolean(uri) && (webViewState.uri !== uri || webViewState.loading);
  const cleanChatScript = makeCleanChatScript(theme, resolvedTheme, settings.chatFontSize);

  useEffect(() => {
    const css = makeCleanChatCss(theme, resolvedTheme, settings.chatFontSize);
    const updateScript = `
      (() => {
        let style = document.getElementById('stream-pilot-clean-chat');
        if (!style) {
          style = document.createElement('style');
          style.id = 'stream-pilot-clean-chat';
          (document.head || document.documentElement).appendChild(style);
        }
        style.textContent = ${JSON.stringify(css)};
      })();
      true;
    `;
    webviewRef.current?.injectJavaScript(updateScript);
  }, [theme, resolvedTheme, settings.chatFontSize]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    if (!refreshToken || !uri) return;
    webviewRef.current?.reload();
  }, [refreshToken, uri]);

  if (!uri) {
    return (
      <PanelEmptyState
        icon={{ ios: streamLink.trim() ? 'link.badge.plus' : 'rectangle.stack.badge.play', android: streamLink.trim() ? 'link_off' : 'video_chat' }}
        title={streamLink.trim() ? 'Link YouTube belum valid' : 'Hubungkan live chat'}
        description={streamLink.trim()
          ? 'Periksa link video atau siaran langsung yang tersimpan di Pengaturan.'
          : 'Tambahkan link siaran YouTube untuk memantau chat di sini.'}
        actionLabel={streamLink.trim() ? 'Periksa link YouTube' : 'Tambahkan link YouTube'}
        onAction={() => router.push('/settings')}
        tone={streamLink.trim() ? 'danger' : 'textSecondary'}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <WebView
        ref={webviewRef}
        source={{ uri }}
        userAgent={DESKTOP_USER_AGENT}
        style={[styles.webview, { backgroundColor: theme.backgroundElement }]}
        containerStyle={{ backgroundColor: theme.backgroundElement }}
        injectedJavaScriptBeforeContentLoaded={cleanChatScript}
        injectedJavaScript={cleanChatScript}
        onMessage={() => undefined}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        cacheMode="LOAD_DEFAULT"
        androidLayerType="hardware"
        onLoadStart={() => {
          setWebViewState({ uri, loading: true, status: 'connecting' });
        }}
        onLoad={() => setWebViewState({ uri, loading: false, status: 'ready' })}
        onLoadEnd={() => setWebViewState((current) => current.uri === uri ? { ...current, loading: false } : current)}
        onError={() => {
          setWebViewState({ uri, loading: false, status: 'error' });
        }}
        onHttpError={() => setWebViewState({ uri, loading: false, status: 'error' })}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          const target = request.url.toLowerCase();
          if (
            target === uri.toLowerCase() ||
            target.startsWith('about:') ||
            target.startsWith('blob:') ||
            target.startsWith('data:') ||
            target.includes('youtube.com') ||
            target.includes('youtu.be') ||
            target.includes('google.com') ||
            target.includes('googleapis.com') ||
            target.includes('gstatic.com') ||
            target.includes('googlevideo.com')
          ) {
            return true;
          }
          void Linking.openURL(request.url).catch(() => undefined);
          return false;
        }}
        renderError={() => (
          <PanelEmptyState
            icon={{ ios: 'wifi.exclamationmark', android: 'wifi_off' }}
            title="Live chat belum dapat dimuat"
            description="Periksa koneksi internet atau link YouTube, lalu coba lagi."
            actionLabel="Periksa Pengaturan"
            onAction={() => router.push('/settings')}
            tone="danger"
          />
        )}
      />
      {loading ? (
        <View pointerEvents="none" style={[styles.loadingOverlay, { backgroundColor: theme.backgroundElement }]}>
          <ActivityIndicator size="small" color={theme.textSecondary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
