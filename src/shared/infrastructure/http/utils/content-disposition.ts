type DispositionType = 'inline' | 'attachment';

function stripControlChars(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .join('');
}

/**
 * Construye un header `Content-Disposition` seguro (RFC 6266 / RFC 5987).
 *
 * - `filename` queda restringido a ASCII imprimible (fallback para clientes viejos).
 * - `filename*` transporta el nombre original en UTF-8, por lo que nombres con
 *   acentos o caracteres fuera de Latin-1 no hacen fallar a Node con
 *   `ERR_INVALID_CHAR`.
 */
export function buildContentDisposition(
  type: DispositionType,
  filename: string,
): string {
  const cleaned =
    stripControlChars(filename)
      .replace(/["\\/]/g, '_')
      .trim() || 'file';

  const asciiFallback = cleaned
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/%/g, '_');
  const encoded = encodeURIComponent(cleaned).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
