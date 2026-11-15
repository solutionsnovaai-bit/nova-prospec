"use client";
import { useState } from "react";
import { productIdeas, outreachDraft, safePreviewUrl } from "@/lib/opportunities";
import type { FoundPlace } from "@/lib/types";
import { api } from "@/lib/client";

export function ProductPreview({ place }: { place: FoundPlace }) {
  const ideas = productIdeas(place);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState("");
  const [notice, setNotice] = useState("");
  const idea = ideas[selected];
  const thumb = safePreviewUrl(place.thumbnail);
  const source = safePreviewUrl(place.mapsUrl) || safePreviewUrl(place.website);
  const download = (href: string, suffix: string) => {
    const a = document.createElement("a"); a.href = href; a.download = `nova-${place.name.replace(/[^a-z0-9]+/gi, "-").slice(0,60)}-${suffix}`; a.click();
  };
  const png = () => {
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#101b2c"; ctx.fillRect(0,0,1080,1350);
    ctx.fillStyle = "#e7c680"; ctx.fillRect(64,72,70,6);
    const line = (text: string, y: number, size: number, color: string, maxLines = 3) => {
      ctx.fillStyle = color; ctx.font = `${size >= 40 ? 600 : 400} ${size}px sans-serif`;
      const words = text.split(/\s+/); let current = ""; let rows = 0;
      for (let index = 0; index < words.length; index++) {
        const word = words[index];
        const next = current ? `${current} ${word}` : word;
        if (ctx.measureText(next).width > 940 && current) {
          ctx.fillText(current,70,y,940); y += size * 1.35; current = word;
          if (++rows >= maxLines - 1) { current = [word, ...words.slice(index+1)].join(" "); break; }
        } else current = next;
      }
      ctx.fillText(current,70,y,940); return y + size * 1.5;
    };
    line("NOVA AI SOLUTIONS",130,26,"#e7c680");
    line(place.name,235,52,"#ffffff",2);
    line(idea.tipo,410,70,"#e7c680",2);
    line(idea.titulo,580,34,"#ffffff",2);
    idea.itens.forEach((item,i) => {
      ctx.strokeStyle = "#33435b"; ctx.strokeRect(64,700+i*92,952,72);
      line(`${String(i+1).padStart(2,"0")}   ${item}`,746+i*92,27,"#e8edf5",1);
    });
    line("Uma ideia para conversar sobre o seu negócio.",1165,28,"#e7c680",2);
    line("CONCEITO ILUSTRATIVO • ESCOPO A CONFIRMAR",1260,22,"#b9c3d4",1);
    download(canvas.toDataURL("image/png"),"conceito.png");
  };
  const generate = async () => {
    setBusy(true); setNotice("");
    try {
      const r = await api<{image:string}>("/api/ai/image", {method:"POST", json:{name:place.name,product:idea.tipo,title:idea.titulo}});
      setImage(r.image); setNotice("Conceito gerado por IA. Revise o texto antes de enviar; não é foto real da empresa.");
    } catch(e) { setNotice(e instanceof Error ? e.message : "Imagem indisponível. A prévia PNG continua funcionando."); }
    finally { setBusy(false); }
  };
  return <details onClick={e=>e.stopPropagation()} style={{marginTop:10,whiteSpace:"normal"}}>
    <summary style={{cursor:"pointer",fontSize:13,color:"var(--gold)"}}>Produtos e prévia</summary>
    <div style={{display:"grid",gap:12,paddingTop:12,overflowWrap:"anywhere"}}>
      {thumb && <figure style={{margin:0}}><img src={thumb} alt={`Imagem de ${place.name} fornecida pela busca`} width={240} height={140} loading="lazy" referrerPolicy="no-referrer" style={{objectFit:"cover",borderRadius:8,maxWidth:"100%"}} onError={e=>{e.currentTarget.style.display="none";}}/><figcaption className="muted" style={{fontSize:11}}>Imagem da fonte de busca{source && <> · <a href={source} target="_blank" rel="noreferrer">Abrir perfil</a></>}</figcaption></figure>}
      <label style={{fontSize:12}}>Produto para explorar<select value={selected} onChange={e=>{setSelected(Number(e.target.value));setImage("");setNotice("");}} style={{width:"100%",marginTop:5}} disabled={busy}>{ideas.map((p,i)=><option key={p.tipo} value={i}>{p.tipo}</option>)}</select></label>
      <strong style={{fontSize:14}}>{idea.titulo}</strong>
      <span className="muted" style={{fontSize:12}}>{idea.motivo}</span>
      <p style={{fontSize:13,margin:0}}>{outreachDraft(place.name,idea)}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        <button className="btn sm" onClick={async()=>{try{await navigator.clipboard.writeText(outreachDraft(place.name,idea));setNotice("Mensagem copiada.");}catch{setNotice("Não foi possível copiar. Selecione o texto acima.");}}}>Copiar mensagem</button>
        <button className="btn sm" onClick={png}>Baixar prévia PNG</button>
        <button className="btn sm" disabled={busy || !!image} onClick={generate}>{busy?"Gerando imagem…":"Tentar imagem IA grátis"}</button>
      </div>
      <span className="muted" style={{fontSize:11}}>PNG sem uso de IA. A opção IA depende da cota gratuita; nunca troca por modelo pago. Nada é enviado ao lead.</span>
      {image && <><img src={image} alt={`Conceito ilustrativo de ${idea.tipo} para ${place.name}`} width={360} height={360} style={{width:"100%",height:"auto",borderRadius:8}}/><button className="btn sm" onClick={()=>download(image, image.startsWith("data:image/jpeg") ? "ia.jpg" : image.startsWith("data:image/webp") ? "ia.webp" : "ia.png")}>Baixar conceito IA</button></>}
      <span role="status" style={{fontSize:12}}>{notice}</span>
    </div>
  </details>;
}
