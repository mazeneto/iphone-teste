(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const hasG = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

/* ---------- Phone markup (mockup 3D) ---------- */
const slabs = Array.from({length:8},(_,i)=>`<i class="slab" style="--i:${i};--k:${(1-Math.abs(i/7*2-1)).toFixed(2)}"></i>`).join('');
const wallpaper = `<svg class="wallp" viewBox="0 0 100 227" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <path d="M-20 74H46A25 25 0 0 1 46 124H30A25 25 0 0 0 30 174H70A25 25 0 0 1 70 224H-20" fill="none" stroke="#4d93d6" stroke-width="31" stroke-linejoin="round" opacity=".75"/>
  <path d="M-20 74H46A25 25 0 0 1 46 124H30A25 25 0 0 0 30 174H70A25 25 0 0 1 70 224H-20" fill="none" stroke="#f4f8fd" stroke-width="29" stroke-linejoin="round"/>
  <path d="M-20 62H46A37 37 0 0 1 83 99" fill="none" stroke="#fff" stroke-width=".6" opacity=".8"/>
</svg>`;
const lens = (x,y) => `<div class="lens" style="--x:${x};--y:${y}"><i class="lb"></i><i class="lt"></i></div>`;
const phoneHTML = `
  <div class="wall wl"><b class="sb" style="top:10%;height:7%"></b><b class="sb" style="top:22%;height:12%"></b><b class="sb" style="top:37%;height:12%"></b></div>
  <div class="wall wr"><b class="sb" style="top:20%;height:18%"></b><b class="sb cc" style="top:60%;height:10%"></b></div>
  <div class="wall wt"></div><div class="wall wb"></div>
  ${slabs}
  <div class="face front"><div class="screen">${wallpaper}<span class="island"></span><span class="date">sábado, 26 de setembro</span><span class="clock num">9:41</span></div><i class="sheen"></i></div>
  <div class="face back">
    <div class="panel"></div>
    <div class="plateau"><i class="pz" style="--j:0"></i><i class="pz" style="--j:1"></i><i class="pz" style="--j:2"></i>
      <div class="ptop">${lens(.17,.15)}${lens(.43,.3)}${lens(.17,.45)}<i class="flash"></i><i class="mic"></i><i class="lidar"></i></div>
    </div>
    <i class="sheen"></i>
  </div>`;
document.querySelectorAll('[data-phone]').forEach(p => p.innerHTML = phoneHTML);

/* ---------- WebGL helper ---------- */
function glProgram(gl, vs, fs){
  const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p);
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const attr=(name,data)=>{const loc=gl.getAttribLocation(p,name);if(loc<0)return;const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);};
  attr('position',[-1,-1,3,-1,-1,3]);attr('uv',[0,0,2,0,0,2]);
  const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){const info=gl.getActiveUniform(p,i);U[info.name.replace('[0]','')]=gl.getUniformLocation(p,info.name);}
  return {U,draw(){gl.drawArrays(gl.TRIANGLES,0,3);}};
}

/* ---------- Aurora (React Bits) — fundo em azul/ciano ---------- */
(function(){
  const c=document.getElementById('auroraBg');
  const gl=c.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false});
  if(!gl){c.remove();return;}
  const VERT=`#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const FRAG=`#version 300 es
precision highp float;
uniform float uTime;uniform float uAmplitude;uniform vec3 uColorStops[3];uniform vec2 uResolution;uniform float uBlend;
out vec4 fragColor;
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  vec3 rampColor = uv.x<0.5 ? mix(uColorStops[0],uColorStops[1],uv.x/0.5) : mix(uColorStops[1],uColorStops[2],(uv.x-0.5)/0.5);
  float height=snoise(vec2(uv.x*2.0+uTime*0.1,uTime*0.25))*0.5*uAmplitude;
  height=exp(height);
  height=(uv.y*2.0-height+0.2);
  float intensity=0.6*height;
  float midPoint=0.20;
  float auroraAlpha=smoothstep(midPoint-uBlend*0.5,midPoint+uBlend*0.5,intensity);
  vec3 auroraColor=intensity*rampColor;
  fragColor=vec4(auroraColor*auroraAlpha,auroraAlpha);
}`;
  let A; try{A=glProgram(gl,VERT,FRAG);}catch(e){c.remove();return;}
  const stops=['#1E9FD6','#071A55','#2AB3E3'].flatMap(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255));
  gl.uniform3fv(A.U.uColorStops,stops);gl.uniform1f(A.U.uAmplitude,1.0);gl.uniform1f(A.U.uBlend,0.5);
  gl.clearColor(0,0,0,0);
  function size(){const w=innerWidth,h=innerHeight;c.width=w;c.height=h;gl.viewport(0,0,w,h);gl.uniform2f(A.U.uResolution,w,h);if(reduce)frame(0);}
  function frame(t){gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(A.U.uTime,t*0.01*0.5*0.1);A.draw();if(!reduce)requestAnimationFrame(frame);}
  size();addEventListener('resize',size);
  if(!reduce) requestAnimationFrame(frame);
})();

/* ---------- WarpText (React Bits) — título do hero ---------- */
(function(){
  const el=document.getElementById('warpTitle');
  const cfg={text:'iPhone 18 Pro',color:'#f5f5f7',warpStrength:0.08,warpScale:1.7,speed:0.55,pointerInfluence:0.42,pointerStrength:0.38,refraction:0.018,ripple:1,fontWeight:700,letterSpacing:-0.05,lineHeight:0.95};
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:true});
  if(!gl) return;
  const VERT=`#version 300 es
in vec2 position;in vec2 uv;out vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position,0.0,1.0);}`;
  const FRAG=`#version 300 es
precision highp float;
uniform sampler2D uTextTexture;uniform vec2 uResolution;uniform vec2 uPointer;uniform float uPointerActive;uniform float uTime;
uniform float uWarpStrength;uniform float uWarpScale;uniform float uSpeed;uniform float uPointerInfluence;uniform float uPointerStrength;
uniform float uRefraction;uniform float uRipple;uniform float uMotion;
in vec2 vUv;out vec4 fragColor;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);
  float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}
vec4 sampleText(vec2 uv){if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)return vec4(0.0);return texture(uTextTexture,uv);}
void main(){
  vec2 uv=vUv;float aspect=uResolution.x/max(uResolution.y,1.0);float time=uTime*uSpeed;float scale=max(uWarpScale,0.001);
  vec2 drift=vec2(time*0.055,-time*0.045);
  float n1=fbm(uv*scale*3.1+drift);float n2=fbm((uv+19.17)*scale*3.4-drift.yx);
  vec2 ambient=(vec2(n1,n2)-0.5)*uWarpStrength*0.045*uMotion;
  vec2 pd=uv-uPointer;vec2 ad=vec2(pd.x*aspect,pd.y);float dist=length(ad);float radius=max(uPointerInfluence,0.001);
  float t=clamp(dist/radius,0.0,1.0);float lens=smoothstep(radius,0.0,dist)*uPointerActive;
  float bulge=t*(1.0-t)*(1.0-t)*6.75*uPointerActive;
  vec2 dir=dist>0.0001?vec2(ad.x/aspect,ad.y)/dist:vec2(0.0);
  float rw=sin(dist*28.0-time*4.2)*0.5+0.5;float rr=(rw-0.5)*uRipple;
  vec2 pw=-dir*bulge*uPointerStrength*0.045;pw+=dir*rr*bulge*uPointerStrength*0.016;
  vec2 displaced=uv+ambient+pw;vec2 sd=ambient+pw;float sl=length(sd);sd=sl>0.00001?sd/sl:vec2(0.7071,0.7071);
  vec2 split=sd*uRefraction*0.16*(0.35+lens*1.65);
  vec4 base=sampleText(displaced);float r=sampleText(displaced+split).r;float g=base.g;float b=sampleText(displaced-split).b;
  float a=max(max(sampleText(displaced+split).a,base.a),sampleText(displaced-split).a);
  vec3 color=vec3(r,g,b)+lens*base.a*0.055;
  fragColor=vec4(color,a);
}`;
  let W; try{W=glProgram(gl,VERT,FRAG);}catch(e){return;}
  el.querySelector('.warp-fallback').hidden=true;
  el.appendChild(canvas);
  canvas.addEventListener('webglcontextlost',()=>{el.querySelector('.warp-fallback').hidden=false;canvas.hidden=true;});
  const U=W.U;
  gl.uniform1f(U.uWarpStrength,cfg.warpStrength);gl.uniform1f(U.uWarpScale,cfg.warpScale);gl.uniform1f(U.uSpeed,cfg.speed);
  gl.uniform1f(U.uPointerInfluence,cfg.pointerInfluence);gl.uniform1f(U.uPointerStrength,cfg.pointerStrength);
  gl.uniform1f(U.uRefraction,cfg.refraction);gl.uniform1f(U.uRipple,cfg.ripple);gl.uniform1f(U.uMotion,reduce?0:1);
  gl.uniform1i(U.uTextTexture,0);
  const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.clearColor(0,0,0,0);

  function raster(w,h,dpr){
    const tc=document.createElement('canvas');tc.width=Math.max(1,Math.floor(w*dpr));tc.height=Math.max(1,Math.floor(h*dpr));
    const ctx=tc.getContext('2d');
    const fam=getComputedStyle(document.body).fontFamily;
    let fs=Math.min(190,Math.max(64,innerWidth*.14)), ls=fs*cfg.letterSpacing;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.textBaseline='middle';ctx.fillStyle=cfg.color;
    ctx.font=`${cfg.fontWeight} ${fs}px ${fam}`;
    const chars=[...cfg.text];
    const measure=()=>chars.reduce((s,ch)=>s+ctx.measureText(ch).width,0)+(chars.length-1)*ls;
    const fit=Math.min(1,(w*.94)/measure(),(h*.82)/(fs*cfg.lineHeight));
    if(fit<1){fs*=fit;ls*=fit;ctx.font=`${cfg.fontWeight} ${fs}px ${fam}`;}
    let x=w/2-measure()/2;
    chars.forEach((ch,i)=>{ctx.fillText(ch,x,h/2);x+=ctx.measureText(ch).width+(i===chars.length-1?0:ls);});
    return tc;
  }
  async function resize(){
    const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.floor(r.width*dpr);canvas.height=Math.floor(r.height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(U.uResolution,canvas.width,canvas.height);
    try{await document.fonts.ready;}catch(e){}
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,raster(r.width,r.height,dpr));
    render();
  }
  const ptr={x:.5,y:.5,tx:.5,ty:.5,active:0,target:0};
  addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    const r=canvas.getBoundingClientRect();
    const inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    if(inside){ptr.tx=(e.clientX-r.left)/r.width;ptr.ty=1-(e.clientY-r.top)/r.height;}
    ptr.target=inside?1:0;
  },{passive:true});
  function render(){gl.clear(gl.COLOR_BUFFER_BIT);W.draw();}
  const start=performance.now();let raf=0,visible=true;
  function loop(now){
    const t=(now-start)*.001;
    const ix=.5+Math.sin(t*.33)*.12, iy=.5+Math.cos(t*.27)*.1;
    const tx=ptr.target?ptr.tx:ix, ty=ptr.target?ptr.ty:iy, damp=ptr.target?.12:.035;
    ptr.x+=(tx-ptr.x)*damp;ptr.y+=(ty-ptr.y)*damp;
    ptr.active+=((ptr.target?1:.18)-ptr.active)*.06;
    gl.uniform2f(U.uPointer,ptr.x,ptr.y);gl.uniform1f(U.uPointerActive,reduce?ptr.active*.35:ptr.active);gl.uniform1f(U.uTime,reduce?0:t);
    render();raf=visible?requestAnimationFrame(loop):0;
  }
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(([en])=>{visible=en.isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(loop);}).observe(el);
  resize();raf=requestAnimationFrame(loop);
})();

/* ---------- Split text ---------- */
document.querySelectorAll('[data-split]').forEach(el => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${[...w].map(c=>`<span class="ch">${c}</span>`).join('')}</span>`).join(' ');
});

/* ---------- Scroll-reveal words ---------- */
const rt = document.getElementById('revealText');
(function splitWords(node){
  [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/\s+/).filter(Boolean).forEach(w => { const s=document.createElement('span'); s.className='rw'; s.textContent=w; frag.appendChild(s); });
      node.replaceChild(frag, n);
    } else if (n.nodeType === 1) {
      const words = n.textContent.split(/\s+/).filter(Boolean);
      const em = n; em.innerHTML = words.map(w=>`<span class="rw">${w}</span>`).join('');
      em.style.display='contents';
    }
  });
})(rt);

/* ---------- Chip grid ---------- */
const cg = document.getElementById('chipGrid');
for (let i=0;i<64;i++){ cg.appendChild(document.createElement('i')); }
const cells=[...cg.children];
if(!reduce) setInterval(()=>{ cells.forEach(c=> c.classList.toggle('on', Math.random()<.22)); }, 700);

/* ---------- Marquee ---------- */
const words1 = ['A20 Pro','<i>•</i>','48 MP','<i>•</i>','8x óptico','<i>•</i>','Alumínio','<i>•</i>','2 nm','<i>•</i>'];
const words2 = ['Abertura variável','•','Wi‑Fi 7','•','39 h de vídeo','•','Face ID sob a tela','•'];
function fill(el, arr){ const s = arr.map(w=>`<span>${w}</span>`).join(''); el.innerHTML = s+s+s; }
fill(document.getElementById('m1'), words1); fill(document.getElementById('m2'), words2);
const rows=[{el:document.getElementById('m1'),x:0,dir:-1},{el:document.getElementById('m2'),x:0,dir:1}];
let lastY=scrollY, vel=0;
function marquee(){
  const dy = scrollY-lastY; lastY=scrollY;
  vel += (dy - vel)*.12;
  rows.forEach(r=>{
    const third = r.el.scrollWidth/3;
    const speed = (reduce?0:.6) + Math.abs(vel)*.35;
    const d = vel<-0.5 ? -r.dir : r.dir;
    r.x += speed*d;
    if (r.x <= -third) r.x += third;
    if (r.x > 0) r.x -= third;
    r.el.style.transform = `translate3d(${r.x}px,0,0) skewX(${Math.max(-8,Math.min(8,-vel*.25))}deg)`;
  });
  requestAnimationFrame(marquee);
}
rows[1].x = -200;
requestAnimationFrame(marquee);

/* ---------- Hero particles ---------- */
const pc = document.getElementById('particles'), px = pc.getContext('2d');
let pts=[], mouse={x:-999,y:-999}, dpr=Math.min(devicePixelRatio||1,2);
function sizeP(){ const r=pc.getBoundingClientRect(); pc.width=r.width*dpr; pc.height=r.height*dpr; pts = Array.from({length: Math.round(r.width*r.height/9000)}, ()=>({x:Math.random()*r.width,y:Math.random()*r.height,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2,r:Math.random()*1.4+.3,a:Math.random()*.6+.2})); }
sizeP(); addEventListener('resize', sizeP);
document.getElementById('hero').addEventListener('pointermove', e=>{ const r=pc.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; });
function drawP(){
  const w=pc.width/dpr,h=pc.height/dpr; px.setTransform(dpr,0,0,dpr,0,0); px.clearRect(0,0,w,h);
  for(const p of pts){
    const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.hypot(dx,dy);
    if(d<120){ p.vx+=dx/d*.08; p.vy+=dy/d*.08; }
    p.vx*=.97; p.vy*=.97; p.x+=p.vx+.05; p.y+=p.vy-.08;
    if(p.y<0)p.y=h; if(p.x>w)p.x=0; if(p.x<0)p.x=w;
    px.beginPath(); px.arc(p.x,p.y,p.r,0,7); px.fillStyle=`rgba(255,255,255,${p.a})`; px.fill();
  }
  if(!reduce) requestAnimationFrame(drawP);
}
drawP();

/* ---------- Hero mouse parallax ---------- */
const heroPhones = document.getElementById('heroPhones');
if (fine && !reduce){
  let tx=0,ty=0,cx=0,cy=0;
  addEventListener('pointermove', e=>{ tx=(e.clientX/innerWidth-.5); ty=(e.clientY/innerHeight-.5); });
  (function loop(){ cx+=(tx-cx)*.06; cy+=(ty-cy)*.06; heroPhones.style.transform=`rotateY(${cx*22}deg) rotateX(${-cy*12}deg)`; requestAnimationFrame(loop); })();
}

/* ---------- Spotlight + tilt cards ---------- */
document.querySelectorAll('.card').forEach(c=>{
  c.addEventListener('pointermove', e=>{
    const r=c.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
    c.style.setProperty('--mx', x+'px'); c.style.setProperty('--my', y+'px');
    if(fine && !reduce){ const rx=(y/r.height-.5)*-6, ry=(x/r.width-.5)*6; c.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`; }
  });
  c.addEventListener('pointerleave', ()=>{ c.style.transform=''; });
});

/* ---------- Magnet buttons ---------- */
if (fine && !reduce){
  document.querySelectorAll('.magnet').forEach(b=>{
    b.addEventListener('pointermove', e=>{ const r=b.getBoundingClientRect(); const x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2; b.style.transition='transform .15s'; b.style.transform=`translate(${x*.3}px,${y*.4}px)`; });
    b.addEventListener('pointerleave', ()=>{ b.style.transition='transform .6s cubic-bezier(.22,1.6,.36,1)'; b.style.transform=''; });
  });
}

/* ---------- Aperture control ---------- */
const apR=document.getElementById('apRange'), apBg=document.getElementById('apBg'), apVal=document.getElementById('apVal'), apIris=document.getElementById('apIris');
function ap(){ const v=apR.value/10; const t=(apR.value-14)/26; apVal.textContent='f/'+v.toFixed(1); apBg.style.filter=`blur(${((1-t)*5).toFixed(1)}px)`; apBg.style.opacity=Math.min(1,(1-t)*2.2).toFixed(2); const s=Math.round(14-t*10); apIris.style.width=s+'px'; apIris.style.height=s+'px'; }
apR.addEventListener('input', ap); ap();

/* ---------- Zoom control (slider + roda do mouse) ---------- */
(function(){
  const scene=document.getElementById('zoomScene'), inner=document.getElementById('zoomInner'), label=document.getElementById('zoomLabel'), range=document.getElementById('zoomRange');
  let target=1, cur=1, raf=0;
  const draw=()=>{ inner.style.transform=`scale(${Math.pow(cur,.56).toFixed(4)})`; label.textContent=(Math.round(cur*10)/10).toFixed(1).replace('.0','')+'x'; };
  const step=()=>{ cur+=(target-cur)*(reduce?1:.18); if(Math.abs(target-cur)<.004){cur=target;raf=0;draw();return;} draw(); raf=requestAnimationFrame(step); };
  const set=v=>{ target=Math.min(8,Math.max(1,v)); range.value=target; if(!raf) raf=requestAnimationFrame(step); };
  range.addEventListener('input',()=>set(+range.value));
  scene.addEventListener('wheel',e=>{
    e.preventDefault();
    const r=scene.getBoundingClientRect();
    if(target<=1.01) inner.style.transformOrigin=`${((e.clientX-r.left)/r.width*100).toFixed(1)}% ${((e.clientY-r.top)/r.height*100).toFixed(1)}%`;
    set(target*Math.exp(-e.deltaY*0.0022));
  },{passive:false});
  draw();
})();

/* ---------- Colors ---------- */
const root=document.documentElement, colorPhone=document.getElementById('colorPhone');
let spins=0;
document.querySelectorAll('.sw').forEach(b=>b.addEventListener('click', ()=>{
  document.querySelectorAll('.sw').forEach(x=>x.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true');
  root.style.setProperty('--finish', b.dataset.f); root.style.setProperty('--finish-light', b.dataset.l); root.style.setProperty('--finish-glow', b.dataset.g);
  document.getElementById('colorName').textContent=b.dataset.name;
  spins++;
  if(hasG && !reduce) gsap.to(colorPhone,{rotationY:180+spins*360,duration:1.4,ease:'expo.out'});
  else colorPhone.style.transform='rotateY(180deg)';
}));
colorPhone.style.transform='rotateY(180deg)';

/* ---------- Click spark ---------- */
const sc=document.getElementById('spark'), sx=sc.getContext('2d'); let sparks=[];
function sizeS(){ sc.width=innerWidth*dpr; sc.height=innerHeight*dpr; } sizeS(); addEventListener('resize',sizeS);
addEventListener('click', e=>{ if(reduce) return; const t=performance.now(); for(let i=0;i<10;i++) sparks.push({x:e.clientX,y:e.clientY,a:i/10*Math.PI*2,t}); if(sparks.length===10) requestAnimationFrame(drawS); });
function drawS(now){
  sx.setTransform(dpr,0,0,dpr,0,0); sx.clearRect(0,0,innerWidth,innerHeight);
  sparks = sparks.filter(s=>now-s.t<450);
  const col = getComputedStyle(root).getPropertyValue('--finish-light').trim()||'#fff';
  for(const s of sparks){ const p=(now-s.t)/450, e=1-Math.pow(1-p,3), d=e*34, len=12*(1-e);
    sx.strokeStyle=col; sx.lineWidth=2; sx.lineCap='round'; sx.beginPath();
    sx.moveTo(s.x+Math.cos(s.a)*d, s.y+Math.sin(s.a)*d); sx.lineTo(s.x+Math.cos(s.a)*(d+len), s.y+Math.sin(s.a)*(d+len)); sx.stroke(); }
  if(sparks.length) requestAnimationFrame(drawS); else sx.clearRect(0,0,innerWidth,innerHeight);
}

/* ---------- Nav hide on scroll ---------- */
const nav=document.getElementById('nav'); let ly=scrollY;
addEventListener('scroll', ()=>{ const y=scrollY; nav.classList.toggle('hide', y>ly && y>300); ly=y;
  document.getElementById('progress').style.transform=`scaleX(${y/(document.documentElement.scrollHeight-innerHeight)})`; }, {passive:true});

/* ---------- Count up helper ---------- */
function countUp(el){ const to=+el.dataset.to, pre=el.dataset.prefix||''; const o={v:0};
  if(!hasG||reduce){ el.textContent=pre+to; return; }
  gsap.to(o,{v:to,duration:1.8,ease:'expo.out',onUpdate:()=>el.textContent=pre+Math.round(o.v)}); }

/* ---------- Decrypt text ---------- */
function decrypt(el){ const final=el.dataset.text, chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*'; let f=0; const total=final.length;
  const id=setInterval(()=>{ el.textContent=[...final].map((c,i)=> c===' '?' ': i<f? c : chars[Math.floor(Math.random()*chars.length)]).join(''); f+=.6; if(f>total){clearInterval(id); el.textContent=final;} }, 30); }

if(!hasG || reduce){
  document.querySelectorAll('.count').forEach(countUp);
  document.getElementById('batFill').style.width='92%'; document.getElementById('batNum').textContent='92%';
  document.getElementById('designPhone').style.transform='rotateY(-20deg)';
  return;
}

/* ================= GSAP ================= */
gsap.registerPlugin(ScrollTrigger);

let lenis;
if (typeof Lenis !== 'undefined' && fine){
  lenis = new Lenis({duration:1.15, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{ const t=document.querySelector(a.getAttribute('href')); if(t){e.preventDefault(); lenis.scrollTo(t,{offset:a.getAttribute('href')==='#top'?-200:0});} }));
}

/* Hero intro */
const intro=gsap.timeline({defaults:{ease:'expo.out'}});
intro.from('.hero .eyebrow',{y:20,opacity:0,duration:1})
  .from('#warpTitle',{y:50,scale:.94,opacity:0,filter:'blur(16px)',duration:1.6},'-=.8')
  .from('.hero .sub',{y:24,opacity:0,filter:'blur(8px)',duration:1.2},'-=1')
  .from('.hero .btn',{y:20,opacity:0,duration:1,stagger:.1},'-=.9')
  .from('#heroStage',{y:160,opacity:0,rotationX:30,duration:2},'-=1.1');

/* Hero parallax on scroll */
gsap.to('#heroStage',{yPercent:-18,scale:.92,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});
gsap.to('.hero .wrap',{yPercent:60,opacity:0,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'60% top',scrub:true}});

/* Design pinned rotation */
const dp=document.getElementById('designPhone');
gsap.set('.cap',{opacity:0,y:40});
const dtl=gsap.timeline({scrollTrigger:{trigger:'#design',start:'top top',end:'+=2600',pin:true,scrub:1}});
dtl.fromTo(dp,{rotationY:-35,rotationX:10,scale:.8},{rotationY:0,rotationX:0,scale:1,duration:1})
   .to('.cap.c1',{opacity:1,y:0,duration:.5},'<.3')
   .to('.cap.c1',{opacity:0,y:-40,duration:.4},'+=.6')
   .to(dp,{scale:1.18,rotationY:12,duration:1},'<')
   .to('.cap.c2',{opacity:1,y:0,duration:.5},'<.4')
   .to('.cap.c2',{opacity:0,y:-40,duration:.4},'+=.6')
   .to(dp,{rotationY:180,scale:1.05,duration:1.4,ease:'power2.inOut'},'<')
   .to('.cap.c3',{opacity:1,y:0,duration:.5},'-=.4')
   .to(dp,{rotationY:200,rotationX:-8,duration:.8},'+=.2');

/* Scroll reveal words */
gsap.fromTo('#revealText .rw',{opacity:.12,filter:'blur(4px)'},{opacity:1,filter:'blur(0px)',stagger:.05,ease:'none',scrollTrigger:{trigger:'#revealText',start:'top 80%',end:'bottom 45%',scrub:true}});

/* Section heads rise */
gsap.utils.toArray('.head').forEach(h=>gsap.from(h.children,{y:50,opacity:0,filter:'blur(8px)',duration:1.2,ease:'expo.out',stagger:.1,scrollTrigger:{trigger:h,start:'top 85%'}}));

/* Decrypt */
document.querySelectorAll('.decrypt').forEach(el=>ScrollTrigger.create({trigger:el,start:'top 85%',once:true,onEnter:()=>decrypt(el)}));

/* Chip */
gsap.from('.chip',{scale:.6,rotation:-12,opacity:0,duration:1.6,ease:'expo.out',scrollTrigger:{trigger:'.chip-wrap',start:'top 80%'}});
gsap.to('.chip',{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.chip-sec',start:'top bottom',end:'bottom top',scrub:true}});

/* Counts */
document.querySelectorAll('.count').forEach(el=>ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>countUp(el)}));

/* Bento cards */
gsap.from('.bento .card',{y:80,opacity:0,duration:1.2,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:'.bento',start:'top 82%'}});


/* Colors */
gsap.from('#colorPhone',{y:120,opacity:0,duration:1.6,ease:'expo.out',scrollTrigger:{trigger:'.color-stage',start:'top 80%'}});
gsap.to('#colorPhone',{rotationY:'+=25',ease:'none',scrollTrigger:{trigger:'#cores',start:'top bottom',end:'bottom top',scrub:true}});

/* Stack cards scale as they pile */
const scards=gsap.utils.toArray('.scard');
scards.forEach((c,i)=>{
  if(i===scards.length-1) return;
  gsap.to(c,{scale:.92-(scards.length-i)*.01,filter:'brightness(.55)',ease:'none',scrollTrigger:{trigger:scards[i+1],start:'top bottom',end:'top '+(96+(i+1)*18)+'px',scrub:true}});
});
ScrollTrigger.create({trigger:'#batFill',start:'top 85%',once:true,onEnter:()=>{
  const o={v:0}; gsap.to(o,{v:92,duration:2.2,ease:'power3.out',onUpdate:()=>{document.getElementById('batFill').style.width=o.v+'%';document.getElementById('batNum').textContent=Math.round(o.v)+'%';}});
}});

/* Final */
gsap.from('.final h2',{y:40,opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:'.final',start:'top 75%'}});

addEventListener('load',()=>ScrollTrigger.refresh());
})();
