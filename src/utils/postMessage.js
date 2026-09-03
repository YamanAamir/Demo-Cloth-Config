// utils/postMessage.js

// Both preview iframes stay mounted at once (one for the desktop layout, one
// for mobile), just CSS-hidden depending on viewport — so broadcasting to both
// makes every PlayCanvas instance receive and log the same message, even the
// one the user can't currently see. Route messages to only the visible one.
export const getActivePreviewIframeId = () => {
    if (typeof window === 'undefined') return 'preview-iframe';
    return window.matchMedia('(min-width: 768px)').matches ? 'preview-iframe' : 'preview-iframe2';
};

export const postToActivePreview = (msg) => {
    const iframe = document.getElementById(getActivePreviewIframeId());
    if (iframe?.contentWindow) iframe.contentWindow.postMessage(msg, "*");
};

export const postToPreview = (message) => {
    postToActivePreview(`rotate ${message}`);
};

export const isPlayCanvasLoadedMessage = (data) => {
    if (!data) return false;
    if (typeof data === 'string') {
        const lower = data.trim().toLowerCase();
        return (
            lower === 'loaded' ||
            lower === 'app:ready' ||
            lower === 'app:loaded' ||
            lower === 'ready' ||
            lower.includes('loaded')
        );
    }
    if (typeof data === 'object') {
        const type = (data.type || data.event || data.status || data.msg || '').toString().toLowerCase();
        return type === 'loaded' || type === 'app:ready' || type === 'ready' || type.includes('loaded');
    }
    return false;
};

