/** Marca do Nova Prospec: uma estrela nova (4 pontas) dentro do arco de um radar. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Nova Prospec" role="img">
      <path d="M16 3.5a12.5 12.5 0 1 1-11.6 7.8" stroke="#d6b25e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 9.5a6.5 6.5 0 1 1-6 4" stroke="#d6b25e" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 11.2l1.15 3.65L20.8 16l-3.65 1.15L16 20.8l-1.15-3.65L11.2 16l3.65-1.15L16 11.2z" fill="#f4f4f5" />
      <circle cx="5.2" cy="8.4" r="1.6" fill="#d6b25e" />
    </svg>
  );
}
