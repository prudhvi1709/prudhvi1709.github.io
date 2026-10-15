import * as k from './vendor/iso-kit.mjs';
import { writeFileSync } from 'node:fs';
const P=k.fitProjection(k.boxCorners({x:-175,y:-120,w:350,d:240,r:8},-18,190),900,660,{pad:38,azimuth:43,elevation:29});
const at=p=>k.iso(p,P);
const solid=(x,y,w,d,z,h,tone='hi',lit=false)=>k.solidSvg(k.slabOf({x,y,w,d,r:2},z,h,P,5,.7),{tone,lit});
const path=(pts,cls='detail')=>`<path class="${cls}" d="${k.pathOf(pts.map(at),false)}"/>`;
let floor=solid(-175,-120,350,240,-18,18,'mid')+solid(-175,-120,350,240,0,8);
floor+=path([[-150,70,8.3],[-145,90,8.3],[110,90,8.3],[130,30,8.3]],'track');
floor+=path([[-145,-80,8.3],[-145,-96,8.3],[125,-96,8.3],[125,-45,8.3]],'track');
let tools=solid(-145,-30,145,120,8,57,'mid')+solid(-150,-34,155,128,65,7);
for(const [i,z] of [72,94,116].entries()){
 tools+=`<g class="cartridge cartridge-${i}">`+solid(-125,-15,108,66,z,17)+solid(-117,-8,28,51,z+17,1,'hi',true);
 for(let n=0;n<3;n++)tools+=solid(-78,-3+n*13,48,4,z+17,1,'mid');
 tools+='</g>';
}
for(let i=0;i<2;i++) tools+=solid(-130,91,116,2,25+i*20,14,'mid')+solid(-83,93,25,3,31+i*20,3,'hi',true);
let talks=solid(42,-95,109,66,8,12)+solid(89,-72,13,12,20,34,'mid')+solid(39,-83,116,9,54,111);
const screen=[at([46,-73.7,64]),at([147,-73.7,64]),at([147,-73.7,155]),at([46,-73.7,155])];
talks+=`<path fill="#252d2b" stroke="#64736b" d="${k.pathOf(screen,true)}"/>`;
for(let i=0;i<3;i++)talks+=path([[57,-73.2,140-i*20],[130-i*12,-73.2,140-i*20]],'screen-line');
talks+=solid(63,-47,69,35,8,30,'mid')+solid(60,-49,75,39,38,4);
for(let i=0;i<3;i++)talks+=solid(45+i*34,-111,22,8,8,7,'hi',i===1);
let news=solid(36,23,123,71,8,58,'mid')+solid(32,18,131,81,66,6);
for(let i=0;i<5;i++)news+=`<g class="paper paper-${i}">`+solid(50-i*1.5,32+i*1.5,84,52,72+i*2.5,2)+path([[58-i*1.5,43+i*1.5,74+i*2.5],[122-i*1.5,43+i*1.5,74+i*2.5]],'paper-ink')+'</g>';
news+=solid(142,39,10,40,72,15,'hi',true);
let cup=k.solidSvg(k.cylinder(-27,82,9,72,15,P,28,.5),{tone:'hi'});
cup+=`<path d="${k.pathOf(k.circleRing(-27,82,6.9,28).map(([x,y])=>at([x,y,87.2])),true)}" fill="#38291e"/>`;
const scene=`<?xml-stylesheet type="text/css" href="workshop.css"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 660" role="img" aria-labelledby="scene-title"><title id="scene-title">An interactive workshop: agent tool cartridges, a talk stage, and a news publishing desk.</title><g class="iso"><g class="floor">${floor}</g><g class="station-art" data-zone="teach">${talks}</g><g class="station-art" data-zone="build">${tools}</g><g class="station-art" data-zone="automate">${news}</g>${cup}</g></svg>`;
const css=`${k.ISO_CSS}
.iso{--anatomy-paper:#e9e0d0;--anatomy-face:#f5eee2;--anatomy-top:#fffaf1;--anatomy-shade-0:#a69780;--anatomy-shade-1:#c0b39e;--anatomy-shade-2:#d8cbb7;--anatomy-shade-3:#e5dac8;--anatomy-hi:#554b40;--anatomy-mid:#786b59;--anatomy-lo:#8d806e;--anatomy-faint:#c1b49e;--anatomy-lit:#eb8248;--anatomy-lit-top:#ffad70;--anatomy-lit-shade:#b65e2c;--anatomy-weight:.85px}
.detail{fill:none;stroke:#70614e;stroke-width:1.3}.track{fill:none;stroke:#b5683a;stroke-width:2.5;stroke-linejoin:round}.screen-line{fill:none;stroke:#efb477;stroke-width:3;stroke-linecap:round}.paper-ink{fill:none;stroke:#9c7550;stroke-width:1.8}

svg{background:#141510}svg[data-theme="light"]{background:#f4f0e7}
.station-art{transition:filter 450ms}.station-art:not([data-active]){filter:saturate(.65) brightness(.9)}
.cartridge{transition:transform 700ms cubic-bezier(.2,.7,.2,1)}
.station-art[data-active] .cartridge-2{transform:translateY(-24px)}
.station-art[data-active] .cartridge-1{transform:translateY(-12px)}
[data-calm] .station-art,[data-calm] .cartridge{transition:none}
`;
writeFileSync(new URL('./workshop.css',import.meta.url),css);
writeFileSync(new URL('./workshop.svg',import.meta.url),scene);
