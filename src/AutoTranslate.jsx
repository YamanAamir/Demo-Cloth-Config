import { useEffect } from "react";
import { TRANSLATE_MAP } from "./Default/translateMap";

// export default function AutoTranslate() {
//   useEffect(() => {
//     const translateNode = (node) => {
//       if (node.nodeType === 3) {
//         const text = node.nodeValue.trim();
//         if (TRANSLATE_MAP[text]) {
//           node.nodeValue = TRANSLATE_MAP[text];
//         }
//       } else if (node.childNodes.length > 0) {
//         node.childNodes.forEach(translateNode);
//       }
//     };

//     const observer = new MutationObserver(() => {
//       translateNode(document.body);
//     });

//     observer.observe(document.body, {
//       childList: true,
//       subtree: true,
//     });

//     // Initial translation
//     translateNode(document.body);

//     return () => observer.disconnect();
//   }, []);

//   return null;
// }

export default function AutoTranslate() {
  useEffect(() => {
    const translateTextNodes = (node) => {
      // TEXT NODES
      if (node.nodeType === 3) {
        const text = node.nodeValue.trim();
        if (TRANSLATE_MAP[text]) {
          node.nodeValue = TRANSLATE_MAP[text];
        }
      }

      // ELEMENT NODES
      if (node.nodeType === 1) {
        // PLACEHOLDER TRANSLATION
        if (node.placeholder && TRANSLATE_MAP[node.placeholder]) {
          node.placeholder = TRANSLATE_MAP[node.placeholder];
        }

        node.childNodes.forEach(translateTextNodes);
      }
    };

    const observer = new MutationObserver(() => {
      translateTextNodes(document.body);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Initial run
    translateTextNodes(document.body);

    return () => observer.disconnect();
  }, []);

  return null;
}











