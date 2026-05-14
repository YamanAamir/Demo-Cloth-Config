// utils/postMessage.js
export const postToPreview = (message) => {
    const iframes = ["preview-iframe", "preview-iframe2"];

    iframes.forEach((id) => {
        const iframe = document.getElementById(id);
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(`rotate ${message}`, "*");
        }
    });
};