const COUNT = 1100;
const TAU = Math.PI * 2;
function pathSamples(lines) {
  const segments = [];
  let length = 0;
  for (const line of lines) for (let i=1;i<line.length;i++) {
    const a=line[i-1], b=line[i];
    const size=Math.hypot(b[0]-a[0],b[1]-a[1]);
    segments.push({a,b,size,start:length}); length+=size;
  }
  return Array.from({length:COUNT},(_,i)=>{
    const distance=((i*613)%COUNT)/COUNT*length;
    const s=segments.find(segment=>segment.start+segment.size>=distance);
    const t=(distance-s.start)/s.size;
    return [s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t,Math.sin(i*2.4)*2];
  });
}
function arc(x,y,rx,ry,from=0,to=TAU) {
  return Array.from({length:65},(_,i)=>[x+Math.cos(from+(to-from)*i/64)*rx,y+Math.sin(from+(to-from)*i/64)*ry]);
}
function personal(kind) {
  if(kind==='ride') return pathSamples([
    arc(-93,45,42,42),arc(90,45,42,42),
    [[-93,45],[-49,-17],[29,-17],[90,45],[-93,45]],
    [[90,45],[63,-48],[55,-68],[35,-72],[27,-68]],
    [[-44,-35],[-20,-47],[0,-50],[45,-32],[12,-8],[-35,-18],[-44,-35]],
    [[-100,-44],[-65,-45],[-36,-33],[-33,-25],[-72,-30],[-100,-44]],
    [[-60,-15],[37,-12],[20,29],[-12,33],[-60,-15]],
    [[-26,-10],[12,-5],[27,23],[-12,33],[-29,8],[-26,-10]],
    [[-38,40],[27,59],[62,59]],[[65,-52],[82,-44],[70,-30],[59,-31],[65,-52]]
  ]);
  if(kind==='lift') {
    const lines=[[[-135,0],[135,0]]];
    for(const side of [-1,1]) for(const [x,h] of [[85,65],[57,49]]) lines.push([[side*x-10,-h],[side*x+10,-h],[side*x+10,h],[side*x-10,h],[side*x-10,-h]]);
    return pathSamples(lines);
  }
  const lines=[ [[-63,-31],[60,-31],[60,40],[43,57],[-43,57],[-63,38],[-63,-31]],arc(60,7,32,34,-Math.PI/2,Math.PI/2),[[-85,75],[84,75]] ];
  for(const x of [-34,0,34])lines.push(Array.from({length:33},(_,i)=>[x+8*Math.sin(i/32*TAU),-57-i*2]));
  return pathSamples(lines);
}
function shape(kind) {
  if(['ride','lift','coffee'].includes(kind)) return personal(kind);
  const points=[];
  for(let i=0;i<COUNT;i++) {
    const u=((i*317)%COUNT)/(COUNT-1), v=((i*691)%COUNT)/(COUNT-1);
    if(kind==='build') {
      const face=i%6, a=(u-.5)*205,b=(v-.5)*205;
      points.push(face<2?[face?103:-103,a,b]:face<4?[a,face===2?-103:103,b]:[a,b,face===4?-103:103]);
    } else if(kind==='teach') {
      if(i%4===0)points.push([(u-.5)*210,-85,(v-.5)*15-40]);
      else {const row=i%3,angle=u*Math.PI;points.push([Math.cos(angle)*(90+row*27),45-row*27,Math.sin(angle)*(70+row*26)-55]);}
    } else {
      const layer=i%4;
      points.push([(u-.5)*245,layer*26-42,(v-.5)*145]);
    }
  }
  return points;
}

export class PointCloud {
  #canvas; #ctx; #positions; #target; #frame=0; #last=0; #width=0; #height=0;
  #visible=false; #enabled=true; #paused=false; #reduced=false; #personal=false;
  #tiltX=0; #tiltY=0; #targetX=0; #targetY=0; #accent='#f1a16b'; #ink='#b4c8ad';
  #resize; #visibility; #controller=new AbortController();
  constructor(canvas,kind) {
    this.#canvas=canvas; this.#ctx=canvas.getContext('2d');
    this.#personal=['ride','lift','coffee'].includes(kind);
    this.#positions=new Float32Array(COUNT*3);
    for(let i=0;i<COUNT;i++) {
      const z=1-2*(i+.5)/COUNT,a=i*2.399963,r=Math.sqrt(1-z*z);
      this.#positions.set([Math.cos(a)*r*150,z*120,Math.sin(a)*r*150],i*3);
    }
    this.setShape(kind);
    this.#resize=new ResizeObserver(()=>this.#size());this.#resize.observe(canvas);
    this.#visibility=new IntersectionObserver(entries=>{
      this.#visible=entries.at(-1).isIntersecting;
      if(this.#visible)this.#run();else this.#stop();
    });this.#visibility.observe(canvas);
    canvas.addEventListener('pointermove',event=>{
      const rect=canvas.getBoundingClientRect();
      this.#targetX=(event.clientY-rect.top)/rect.height-.5;
      this.#targetY=(event.clientX-rect.left)/rect.width-.5;
      this.#run();
    },{signal:this.#controller.signal,passive:true});
    canvas.addEventListener('pointerleave',()=>{this.#targetX=0;this.#targetY=0;this.#run();},{signal:this.#controller.signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.#stop();else this.#run();},{signal:this.#controller.signal});
    this.setTheme();
  }
  #size(){const r=this.#canvas.getBoundingClientRect();this.#width=r.width;this.#height=r.height;const d=Math.min(devicePixelRatio||1,1.5);this.#canvas.width=Math.round(r.width*d);this.#canvas.height=Math.round(r.height*d);this.#ctx.setTransform(d,0,0,d,0,0);this.#run();}
  setShape(kind){this.#target=new Float32Array(shape(kind).flat());this.#run();}
  setTheme(){const css=getComputedStyle(document.documentElement);this.#accent=css.getPropertyValue('--accent').trim();this.#ink=css.getPropertyValue('--sage').trim();this.#run();}
  setEnabled(value){this.#enabled=value;if(value){this.#size();this.#run();}else this.#stop();}
  setMotion(paused,reduced){this.#paused=paused;this.#reduced=reduced;if(paused||reduced){this.#positions.set(this.#target);this.#tiltX=0;this.#tiltY=0;this.#stop();this.#draw();}else this.#run();}
  #run(){if(!this.#frame && this.#visible && this.#enabled && !document.hidden){this.#last=0;this.#frame=requestAnimationFrame(t=>this.#tick(t));}}
  #stop(){if(this.#frame)cancelAnimationFrame(this.#frame);this.#frame=0;this.#last=0;}
  #tick(time){this.#frame=0;const dt=this.#last?Math.min((time-this.#last)/1000,.033):.016;this.#last=time;const calm=this.#paused||this.#reduced;const alpha=calm?1:1-Math.exp(-dt*5.5);let error=0;
    for(let i=0;i<this.#positions.length;i++){const delta=this.#target[i]-this.#positions[i];this.#positions[i]+=delta*alpha;error=Math.max(error,Math.abs(delta));}
    const dx=(calm?0:this.#targetX)-this.#tiltX,dy=(calm?0:this.#targetY)-this.#tiltY;this.#tiltX+=dx*alpha;this.#tiltY+=dy*alpha;
    this.#draw();if(!calm && (error>.03||Math.abs(dx)+Math.abs(dy)>.002))this.#frame=requestAnimationFrame(t=>this.#tick(t));
  }
  #draw(){const ctx=this.#ctx,w=this.#width,h=this.#height;if(!w||!h)return;ctx.clearRect(0,0,w,h);const scale=Math.min(w/420,h/260);const ry=this.#personal?this.#tiltY*.23:.68+this.#tiltY*.65,rx=this.#personal?this.#tiltX*.12:-.35+this.#tiltX*.45;const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx);
    for(let i=0;i<COUNT;i++){const j=i*3,x=this.#positions[j],y=this.#positions[j+1],z=this.#positions[j+2];const ax=x*cy+z*sy,az=-x*sy+z*cy,ay=y*cx-az*sx,depth=y*sx+az*cx,p=600/(600+depth);ctx.globalAlpha=this.#personal?.8:Math.max(.2,Math.min(.9,.65-depth/350));ctx.fillStyle=i%13===0?this.#accent:this.#ink;ctx.beginPath();ctx.arc(w/2+ax*scale*p,h/2+ay*scale*p,Math.max(.65,(this.#personal?.85:1.1)*p),0,TAU);ctx.fill();}ctx.globalAlpha=1;
  }
  destroy(){this.#stop();this.#controller.abort();this.#resize.disconnect();this.#visibility.disconnect();}
}
