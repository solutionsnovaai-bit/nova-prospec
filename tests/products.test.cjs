const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
const original = Module._load;
Module._load = function(id, ...args) { if(id==='server-only') return {}; return original.call(this,id,...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
require.cache[require.resolve('../lib/settings.ts')]={exports:{getKey:async()=> 'test-key'}};
const {productIdeas,safePreviewUrl}=require('../lib/opportunities.ts');
const {suggestProject}=require('../lib/score.ts');
const {generateFreeConcept,zeroCostEndpoint,FREE_IMAGE_MODEL}=require('../lib/image-generation.ts');
const endpoint={provider_tag:'recraft',pricing:[{billable:'output_image',cost_usd:0}]};
test('existing healthy sites still produce operational product ideas',()=>{
 const lead={name:'Clínica Exemplo',niche:'clinica',websiteKind:'proprio',audit:{ok:true}};
 assert.equal(productIdeas(lead)[0].tipo,'Agenda online');
 assert.equal(suggestProject(lead).tipo,'Agenda online');
 assert.match(productIdeas(lead)[0].motivo,/confirmar/);
 assert.ok(productIdeas(lead)[0].pergunta.endsWith('?'));
});
test('catalog and order dashboard are available without inferring missing systems',()=>{
 assert.equal(productIdeas({name:'Loja',niche:'roupas'})[0].tipo,'Catálogo digital');
 assert.equal(productIdeas({name:'Pizza',niche:'pizzaria'})[1].tipo,'Painel de pedidos');
});
test('untrusted preview schemes and embedded credentials are rejected',()=>{
 for(const url of ['javascript:alert(1)','data:image/svg+xml,bad','http://x.com','https://u:p@example.com'])assert.equal(safePreviewUrl(url),undefined);
 assert.equal(safePreviewUrl('https://example.com/a.jpg'),'https://example.com/a.jpg');
});
test('image pricing fails closed for missing unknown or positive prices',()=>{
 assert.ok(zeroCostEndpoint(endpoint));
 for(const p of [null,undefined,'',false,0.001,'unknown'])assert.equal(zeroCostEndpoint({...endpoint,pricing:[{billable:'output_image',cost_usd:p}]}),false);
 assert.equal(zeroCostEndpoint({provider_tag:'recraft',pricing:[]}),false);
});
test('paid image endpoint never reaches generation request',async()=>{
 let calls=0;global.fetch=async()=>{calls++;return Response.json({endpoints:[{...endpoint,pricing:[{billable:'output_image',cost_usd:0.01}]}]});};
 await assert.rejects(generateFreeConcept('Loja','Catálogo','Vitrine'),/Nenhum modelo pago/);assert.equal(calls,1);
});
test('free generation pins provider, one image, no fallback, strips raw upstream errors',async()=>{
 const calls=[];global.fetch=async(url,opts)=>{calls.push({url,opts});return calls.length===1?Response.json({endpoints:[endpoint]}):new Response('secret-from-provider',{status:429});};
 await assert.rejects(generateFreeConcept('Loja','Catálogo','Vitrine'),/Cota gratuita/);
 const body=JSON.parse(calls[1].opts.body);assert.equal(body.model,FREE_IMAGE_MODEL);assert.equal(body.n,1);assert.deepEqual(body.provider,{only:['recraft'],allow_fallbacks:false});assert.equal(calls.length,2);
});
test('valid raster returned and SVG rejected',async()=>{
 for(const mime of ['image/png','image/svg+xml']){
 global.fetch=async url=>url.endsWith('/endpoints')?Response.json({endpoints:[endpoint]}):Response.json({data:[{media_type:mime,b64_json:'aGVsbG8='}]});
 if(mime==='image/png')assert.match(await generateFreeConcept('Loja','Catálogo','Vitrine'),/^data:image\/png/);
 else await assert.rejects(generateFreeConcept('Loja','Catálogo','Vitrine'),/imagem válida/);
 }
});
