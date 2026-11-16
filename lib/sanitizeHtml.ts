import DOMPurify from 'dompurify';

const ALLOWED_CSS_PROPS = new Set([
  'width',
  'float',
  'margin',
  'margin-left',
  'margin-right',
  'margin-top',
  'margin-bottom',
  'text-align',
  'opacity',
  'transition',
]);

/**
 * Sanitizes diary HTML using DOMPurify with strict attribute, style, and tag allowlists.
 * Enforces anti-reverse-tabnabbing on links and restricts CSS styles.
 * 
 * @param dirtyHtml The input HTML string to sanitize.
 * @param isEditor Whether the sanitization is for editor mode (allowing contenteditable for figure/blot controls).
 * @returns Clean, sanitized HTML string.
 */
export function sanitizeDiaryHtml(dirtyHtml: string, isEditor = false): string {
  if (!dirtyHtml) return '';

  const allowedAttrs = [
    'style',
    'class',
    'alt',
    'data-secure-metadata',
    'href',
    'target',
    'rel',
  ];

  if (isEditor) {
    allowedAttrs.push('contenteditable');
  }

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node instanceof Element && node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const sanitizedStyle = style
        .split(';')
        .map(rule => rule.trim())
        .filter(rule => {
          if (!rule.includes(':')) return false;
          const colonIdx = rule.indexOf(':');
          const propName = rule.slice(0, colonIdx).trim().toLowerCase();
          return propName && ALLOWED_CSS_PROPS.has(propName);
        })
        .join('; ');

      if (sanitizedStyle) {
        node.setAttribute('style', sanitizedStyle);
      } else {
        node.removeAttribute('style');
      }
    }

    // Security enhancement: Prevent reverse tabnabbing on user-generated links
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  try {
    return DOMPurify.sanitize(dirtyHtml, {
      ADD_TAGS: ['figure', 'figcaption', 'img', 'a'],
      ADD_ATTR: allowedAttrs,
    }) as string;
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}
