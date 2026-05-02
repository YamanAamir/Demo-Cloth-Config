import { useEffect } from "react";
import { TRANSLATE_MAP } from "./Default/translateMap";

export default function AutoTranslate() {
  useEffect(() => {
    const translateTextNodes = (node) => {
      if (!node) return;

      // TEXT NODES only — never modify element structure
      if (node.nodeType === 3) {
        const text = node.nodeValue?.trim();
        if (text && TRANSLATE_MAP[text]) {
          node.nodeValue = TRANSLATE_MAP[text];
        }
        return;
      }

      // ELEMENT NODES — translate placeholder, recurse children
      if (node.nodeType === 1) {
        if (node.placeholder && TRANSLATE_MAP[node.placeholder]) {
          node.placeholder = TRANSLATE_MAP[node.placeholder];
        }

        // Use Array.from to avoid live NodeList issues during iteration
        Array.from(node.childNodes).forEach(translateTextNodes);
      }
    };

    // Debounce to avoid conflicting with React's reconciliation
    let timer = null;
    const debouncedTranslate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        translateTextNodes(document.body);
      }, 50);
    };

    const observer = new MutationObserver((mutations) => {
      // Only react to childList changes (text additions), not attribute changes
      const hasRelevantChange = mutations.some(m => m.type === 'childList');
      if (hasRelevantChange) {
        debouncedTranslate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      // attributes: false — removed to prevent React DOM conflicts
    });

    // Initial run
    translateTextNodes(document.body);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
