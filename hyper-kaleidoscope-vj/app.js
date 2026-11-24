(() => {
  'use strict';
  const canvas = document.querySelector('#vj-canvas');
  const errorBox = document.querySelector('#error');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const lowPower = matchMedia('(max-width: 680px)').matches;
  const state = { slices: 12, speed: 1, morph: 1.25, chroma: 1.1, palette: 0, gain: 1.6,
    x: 0, y: 0, tx: 0, ty: 0, travel: 0, bass: 0, mid: 0, high: 0, kick: 0, prevBass: 0 };
  const vertex = 'attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.0,1.0);}';
  const fragment = `
precision highp float;
uniform vec2 u_res; uniform float u_time,u_travel,u_slices,u_morph,u_chroma,u_palette;
uniform vec2 u_mouse; uniform float u_bass,u_mid,u_high,u_kick,u_quality;
#define PI 3.14159265359
#define TAU 6.28318530718
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 kaleido(vec2 p,float n){float a=atan(p.y,p.x),r=length(p),s=TAU/n;a=abs(mod(a,s)-s*0.5);return vec2(cos(a),sin(a))*r;}
float mapScene(vec3 p){
  p.x+=sin(p.z*0.18+u_time*0.6)*(0.3+u_bass*0.28);
  p.y+=cos(p.z*0.15-u_time*0.5)*(0.3+u_bass*0.28);
  p.xy=rot(p.z*0.14+u_time*0.21+u_mid*0.4)*p.xy;
  p.xy=kaleido(p.xy,max(4.0,u_slices));
  float rep=2.7-u_kick*0.28;
  vec3 q=p; q.z=mod(q.z+rep*0.5,rep)-rep*0.5;
  float scale=1.0;
  for(int j=0;j<3;j++){
    q=abs(q)-vec3(0.43+u_bass*0.12,0.38+u_mid*0.12,0.38);
    q.xy=rot(0.46+u_mid*0.22)*q.xy;
    q.yz=rot(0.31+u_high*0.18)*q.yz;
    float k=clamp((u_morph+u_mid*0.4)/max(dot(q,q),0.22),0.8,2.0);
    q*=k; scale*=k;
  }
  float petal=(length(q.xy)-(0.37+u_bass*0.16))/scale;
  float rib=(max(abs(q.x),abs(q.z))-0.27)/scale;
  float opening=0.35-length(p.xy);
  return max(min(petal,rib),opening*0.7);
}
vec3 palette(float t,float id){
  t=fract(t);
  if(id<0.5){vec3 a=vec3(.14,.09,.98),b=vec3(.96,.11,.68),c=vec3(.05,.88,.42),d=vec3(.98,.86,.16);
    if(t<.33)return mix(a,b,t/.33);if(t<.66)return mix(b,c,(t-.33)/.33);return mix(c,d,(t-.66)/.34);}
  if(id<1.5)return .5+.5*cos(TAU*(t+vec3(.65,.85,.15)));
  if(id<2.5)return .5+.5*cos(TAU*(t+vec3(.0,.12,.35)));
  return .5+.5*cos(TAU*(t+vec3(.35,.05,.55)));
}
vec3 renderScene(vec2 uv){
  vec3 ro=vec3(u_mouse*0.34,u_travel);
  vec3 rd=normalize(vec3(uv*(1.2+u_bass*.22+u_kick*.16),1.0));
  rd.xy=rot(u_time*.09+u_mid*.17)*rd.xy;
  float t=.04,glow=0.0;vec3 color=vec3(.007,.005,.024);
  for(int i=0;i<40;i++){
    vec3 p=ro+rd*t;float d=mapScene(p);
    glow+=exp(-abs(d)*(8.0-u_high*2.0))*(.035+u_high*.025);
    if(d<.004){float v=p.z*.16+length(p.xy)*.4-u_time*.14+u_mid*.2;
      color=palette(v,u_palette)*(1.0-float(i)/55.0)*(1.0+u_bass*.38+u_kick*.38);break;}
    t+=max(d*.72,.018);if(t>19.0)break;
  }
  float r=length(uv);color+=palette(r*.6-u_travel*.08+u_bass*.2,u_palette)*glow*(.72+u_high*.42);
  float edge=.2+.04*cos(atan(uv.y,uv.x)*u_slices*.5+u_time*2.0)+u_bass*.06+u_kick*.04;
  color=mix(color,vec3(.14,.07,.72)*(1.0+u_kick*.25),smoothstep(edge+.12,edge-.02,r)*.7);
  return color;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-u_res*.5)/min(u_res.x,u_res.y);
  float split=(.008+length(uv)*.02)*u_chroma*(.6+u_bass*.5+u_high*.5+u_kick*.3);
  vec3 color=renderScene(uv);
  if(u_quality>.5 && u_chroma>.01){
    vec3 a=renderScene(uv*(1.0-split));vec3 b=renderScene(uv*(1.0+split));
    color=vec3(a.r,color.g,b.b);
  } else {
    color+=vec3(.13,-.02,.18)*split*(.3+length(uv));
  }
  color=pow(max(color,0.0),vec3(.94));
  color*=max(.42,1.0-.19*dot(uv,uv));
  gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
  let gl, program, locations, buffer, resolutionScale = lowPower ? .78 : 1;
  let raf = 0, lastTime = performance.now(), elapsed = 0, slowFrames = 0, activeMode = 'none';
  function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const info = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(info); }
    return shader;
  }
  function initGL() {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL is unavailable on this device. Try a browser with hardware acceleration enabled.');
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, precision && precision.precision > 0 ? fragment : fragment.replace('precision highp float;', 'precision mediump float;'));
    program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_pos'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    locations = Object.fromEntries(['res','time','travel','slices','morph','chroma','palette','mouse','bass','mid','high','kick','quality'].map(k => [k,gl.getUniformLocation(program,'u_'+k)]));
    resize(); errorBox.hidden = true;
  }
  function resize() {
    if (!gl) return;
    const dpr = Math.min(devicePixelRatio || 1, lowPower ? 1.3 : 1.5) * resolutionScale;
    const pixelBudget = lowPower ? 800000 : 1800000;
    const budgetScale = Math.min(1, Math.sqrt(pixelBudget / (innerWidth * innerHeight * dpr * dpr)));
    const w = Math.max(1,Math.round(innerWidth*dpr*budgetScale)), h = Math.max(1,Math.round(innerHeight*dpr*budgetScale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h); }
  }
  addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(raf); showError('Graphics context paused. Waiting for the browser to restore it.'); });
  canvas.addEventListener('webglcontextrestored', () => { try { initGL(); lastTime=performance.now(); raf=requestAnimationFrame(render); } catch (error) { showError('Graphics could not restart: '+error.message); } });
  const panel = document.querySelector('#hud-panel'), toggle = document.querySelector('#hud-toggle');
  function setPanel(open) { panel.classList.toggle('open',open); panel.inert=!open; toggle.setAttribute('aria-expanded',String(open)); if (open) document.querySelector('#hud-close').focus(); else toggle.focus(); }
  toggle.addEventListener('click', () => setPanel(!panel.classList.contains('open')));
  document.querySelector('#hud-close').addEventListener('click', () => setPanel(false));
  addEventListener('keydown', event => { if (event.key==='Escape' && panel.classList.contains('open')) setPanel(false); if (event.code==='Space' && !['INPUT','BUTTON','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); triggerDrop(); } });
  const suffix = {gain:'×',slices:'',speed:'',morph:'',chroma:''};
  for (const key of Object.keys(suffix)) {
    const input=document.querySelector('#ctrl-'+key), output=document.querySelector('#val-'+key);
    input.addEventListener('input', () => { state[key]=Number(input.value); output.textContent=(key==='slices'?String(state[key]):key==='gain'?state[key].toFixed(1):state[key].toFixed(2))+suffix[key]; });
  }
  document.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click', () => {
    state.palette=Number(button.dataset.palette);
    document.querySelectorAll('[data-palette]').forEach(b => { const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected)); });
  }));
  function triggerDrop() { state.kick=1.0;state.bass=Math.max(state.bass,.78);state.high=Math.max(state.high,.55); }
  document.querySelector('#btn-drop').addEventListener('click',triggerDrop);
  canvas.addEventListener('dblclick',triggerDrop);
  let dragging=false;
  canvas.addEventListener('pointerdown',event=>{dragging=true;canvas.setPointerCapture(event.pointerId);steer(event);});
  canvas.addEventListener('pointermove',event=>{if(dragging || event.pointerType==='mouse')steer(event);});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  function steer(event){state.tx=event.clientX/innerWidth*2-1;state.ty=1-event.clientY/innerHeight*2;}
  let audioCtx=null, analyser=null, freqData=null, activeStream=null, sourceNode=null, synthTimer=null, synthNodes=[], nextStep=0, step=0, sourceGeneration=0;
  const status=document.querySelector('#audio-status');
  function setStatus(label,mode='none') { status.textContent=label;activeMode=mode;document.querySelectorAll('.source-btn').forEach(b=>b.classList.toggle('active',b.id==='src-'+mode)); }
  function stopAudio() {
    sourceGeneration++;
    if(synthTimer){clearInterval(synthTimer);synthTimer=null;}
    for(const node of synthNodes){try{node.stop();}catch{}} synthNodes=[];
    if(sourceNode){sourceNode.disconnect();sourceNode=null;}
    if(activeStream){activeStream.getTracks().forEach(t=>t.stop());activeStream=null;}
    if(analyser)analyser.disconnect();
    setStatus('VISUAL IDLE');
    state.bass=state.mid=state.high=state.prevBass=0;
  }
  document.querySelector('#src-stop').addEventListener('click',stopAudio);
  async function prepareAudio(){
    if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    await audioCtx.resume();
    analyser=audioCtx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.55;
    freqData=new Uint8Array(analyser.frequencyBinCount);
  }
  function tone(type,freq,duration,volume,when,endFreq,filterFreq){
    const osc=audioCtx.createOscillator(),env=audioCtx.createGain();osc.type=type;
    osc.frequency.setValueAtTime(freq,when);
    if(endFreq)osc.frequency.exponentialRampToValueAtTime(endFreq,when+duration*.58);
    env.gain.setValueAtTime(Math.max(.001,volume),when);env.gain.exponentialRampToValueAtTime(.001,when+duration);
    if(filterFreq){const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(filterFreq,when);filter.frequency.exponentialRampToValueAtTime(180,when+duration*.9);osc.connect(filter);filter.connect(env);}else osc.connect(env);
    env.connect(analyser);osc.start(when);osc.stop(when+duration+.01);synthNodes.push(osc);
    osc.onended=()=>{osc.disconnect();env.disconnect();synthNodes=synthNodes.filter(n=>n!==osc);};
  }
  function scheduleBeat(){
    if(activeMode!=='synth')return;
    const interval=60/128/4;
    while(nextStep<audioCtx.currentTime+.12){
      if(step%4===0)tone('sine',145,.27,.45,nextStep,37);
      if(step%4===2 || step%8===7)tone('sawtooth',[55,65.41,73.42,82.41][Math.floor(step/4)],.17,.11,nextStep,0,850);
      if(step%2===1)tone('triangle',step%4===3?4200:2800,.055,.035,nextStep);
      nextStep+=interval;step=(step+1)%16;
    }
  }
  document.querySelector('#src-synth').addEventListener('click',async()=>{
    stopAudio();try{await prepareAudio();analyser.connect(audioCtx.destination);setStatus('128 BPM · LIVE','synth');step=0;nextStep=audioCtx.currentTime+.03;scheduleBeat();synthTimer=setInterval(scheduleBeat,25);}catch(error){setStatus('AUDIO UNAVAILABLE');console.error(error);}
  });
  document.querySelector('#src-mic').addEventListener('click',async()=>{
    stopAudio();const generation=sourceGeneration;
    try{await prepareAudio();if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone capture unavailable');
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(generation!==sourceGeneration){stream.getTracks().forEach(t=>t.stop());return;}
      activeStream=stream;sourceNode=audioCtx.createMediaStreamSource(stream);sourceNode.connect(analyser);stream.getAudioTracks()[0].onended=stopAudio;setStatus('MIC · LIVE','mic');
    }catch(error){setStatus('MIC UNAVAILABLE');console.warn(error);}
  });
  document.querySelector('#src-tab').addEventListener('click',async()=>{
    stopAudio();const generation=sourceGeneration;
    try{await prepareAudio();if(!navigator.mediaDevices?.getDisplayMedia)throw new Error('Tab capture unavailable');
      const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
      if(generation!==sourceGeneration){stream.getTracks().forEach(t=>t.stop());return;}
      if(!stream.getAudioTracks().length){stream.getTracks().forEach(t=>t.stop());setStatus('NO AUDIO TRACK');return;}
      activeStream=stream;sourceNode=audioCtx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));sourceNode.connect(analyser);
      stream.getTracks().forEach(track=>{track.onended=stopAudio;});setStatus('TAB · LIVE','tab');
    }catch(error){setStatus('TAB UNAVAILABLE');console.warn(error);}
  });
  function energy(from,to){
    const binHz=audioCtx.sampleRate/analyser.fftSize;
    const start=Math.max(1,Math.ceil(from/binHz)),end=Math.min(freqData.length,Math.ceil(to/binHz));
    let sum=0;for(let i=start;i<end;i++)sum+=freqData[i];return sum/(Math.max(1,end-start)*255);
  }
  function analyze(dt){
    if(activeMode!=='none' && analyser){
      analyser.getByteFrequencyData(freqData);
      const bands=[['bass',energy(20,160),1.4],['mid',energy(160,2000),1.3],['high',energy(2000,12000),1.2]];
      for(const [key,value,power] of bands){const target=Math.min(1.5,Math.pow(value,power)*state.gain);const alpha=target>state[key]?.55:1-Math.exp(-dt*5);state[key]+=(target-state[key])*alpha;}
      const delta=state.bass-state.prevBass;if(delta>.12 && state.bass>.28)state.kick=Math.min(1,state.kick+delta*1.4);
      state.prevBass=state.bass;
    }else{const t=elapsed*.7;state.bass+=((.11+.04*Math.sin(t))-state.bass)*Math.min(1,dt*3);state.mid=.09+.025*Math.cos(t*.7);state.high=.08+.025*Math.sin(t*1.3);}
    state.kick*=Math.exp(-dt*5);
    for(const key of ['bass','mid','high'])document.querySelector('#meter-'+key).style.width=Math.min(100,state[key]*75).toFixed(0)+'%';
  }
  function render(now){
    raf=requestAnimationFrame(render);
    if(document.hidden)return;
    const dt=Math.min(.08,Math.max(0,(now-lastTime)/1000));lastTime=now;
    if(dt>.036){slowFrames++;if(slowFrames>90 && resolutionScale>.55){resolutionScale=Math.max(.55,resolutionScale-.15);resize();slowFrames=0;document.querySelector('#quality-label').textContent='PERFORMANCE MODE';}}else slowFrames=Math.max(0,slowFrames-1);
    if(!reducedMotion.matches){elapsed+=dt;state.travel+=dt*state.speed*(.65+state.bass+state.kick*1.1)*1.4;}
    analyze(dt);state.x+=(state.tx-state.x)*Math.min(1,dt*8);state.y+=(state.ty-state.y)*Math.min(1,dt*8);
    gl.useProgram(program);gl.uniform2f(locations.res,canvas.width,canvas.height);
    for(const key of ['time','travel','slices','morph','chroma','palette','bass','mid','high','kick'])gl.uniform1f(locations[key],key==='time'?elapsed:state[key]);
    gl.uniform2f(locations.mouse,state.x,state.y);gl.uniform1f(locations.quality,lowPower?0:1);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  try{initGL();raf=requestAnimationFrame(render);}catch(error){showError('The visual engine could not start: '+error.message);console.error(error);}
})();
