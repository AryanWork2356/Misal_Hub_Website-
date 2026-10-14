/**
 * Wrap every word of an element in <span class="sw"><span class="swi">word</span></span> so it can be animated
 * word by word. Nested markup (<em>, <span class="gold">) and <br/> are preserved; whitespace is left as plain
 * text so line-breaking is unchanged. `revert()` restores the original HTML.
 */
export function splitWords(root: HTMLElement) {
  const original = root.innerHTML;
  const words: HTMLElement[] = [];

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (child.textContent || '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const outer = document.createElement('span');
          outer.className = 'sw';
          outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.className = 'swi';
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
          words.push(inner);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    });
  };

  root.setAttribute('aria-label', root.textContent?.replace(/\s+/g, ' ').trim() || '');
  walk(root);

  return {
    words,
    revert: () => { root.innerHTML = original; root.removeAttribute('aria-label'); },
  };
}
