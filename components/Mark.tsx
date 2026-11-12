/** Marca da Nova (cérebro em circuito), recortada do logotipo com fundo transparente. */
export function Mark({ size = 28 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.webp" width={size} height={size} alt="Nova" style={{ display: "block", objectFit: "contain" }} />;
}

/** Assinatura da marca: "NOVA" em serifada dourada e "AI · SOLUTIONS" espaçado embaixo. */
export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`brandlock ${size}`} aria-label="Nova AI Solutions">
      <b>NOVA</b>
      <i>AI · SOLUTIONS</i>
    </span>
  );
}
