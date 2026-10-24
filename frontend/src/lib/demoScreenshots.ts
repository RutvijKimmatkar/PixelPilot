const createSvgDataUrl = (w: number, h: number, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#121212"/>${body}</svg>`
  )}`;

export const DESKTOP_SHOT = createSvgDataUrl(
  1280,
  800,
  `<rect width="1280" height="72" fill="#171615" stroke="#2C2A26"/>
   <rect x="36" y="22" width="28" height="28" rx="6" fill="#FAF7F0"/>
   <text x="76" y="42" font-family="sans-serif" font-size="20" font-weight="700" fill="#FAF8F5">Acme Shop</text>
   <text x="820" y="42" font-family="sans-serif" font-size="14" fill="#B8B2A7">Home    Catalog    Categories    Sale    Contact</text>
   <rect x="36" y="104" width="1208" height="340" rx="10" fill="#1C1B19" stroke="#2C2A26"/>
   <text x="76" y="260" font-family="sans-serif" font-size="44" font-weight="700" fill="#FAF8F5">New Season Arrivals</text>
   <text x="76" y="300" font-family="sans-serif" font-size="16" fill="#B8B2A7">Designed for modern developers and designers</text>
   <rect x="76" y="330" width="140" height="42" rx="6" fill="#FAF7F0" stroke="#E7DCB9"/>
   <text x="110" y="356" font-family="sans-serif" font-size="14" font-weight="700" fill="#141414">Shop now</text>
   <rect x="36" y="476" width="280" height="280" rx="8" fill="#171615" stroke="#2C2A26"/>
   <rect x="344" y="476" width="280" height="280" rx="8" fill="#171615" stroke="#2C2A26"/>
   <rect x="652" y="476" width="280" height="280" rx="8" fill="#171615" stroke="#2C2A26"/>
   <rect x="960" y="476" width="284" height="280" rx="8" fill="#171615" stroke="#2C2A26"/>`
);

export const MOBILE_SHOT = createSvgDataUrl(
  375,
  812,
  `<rect width="612" height="60" fill="#171615" stroke="#2C2A26"/>
   <text x="16" y="36" font-family="sans-serif" font-size="16" font-weight="700" fill="#FAF8F5">Acme</text>
   <text x="80" y="36" font-family="sans-serif" font-size="14" fill="#B8B2A7">Home   Catalog   Categories   Sale   Contact</text>
   <!-- Red overflow boundary indicator -->
   <rect x="0" y="0" width="375" height="60" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-dasharray="6,4"/>
   <text x="12" y="78" font-family="monospace" font-size="10" fill="#EF4444">▲ 612px navbar overflows 375px viewport</text>
   <rect x="16" y="96" width="480" height="220" rx="8" fill="#1C1B19" stroke="#2C2A26"/>
   <!-- Amber hero overflow indicator -->
   <rect x="16" y="96" width="343" height="220" fill="none" stroke="#F5A524" stroke-width="2.5" stroke-dasharray="6,4"/>
   <text x="16" y="332" font-family="monospace" font-size="10" fill="#F5A524">● 480px image in 343px container</text>
   <text x="32" y="200" font-family="sans-serif" font-size="24" font-weight="700" fill="#FAF8F5">New Season</text>
   <rect x="16" y="356" width="343" height="180" rx="8" fill="#171615" stroke="#2C2A26"/>`
);
