import { PointCloud } from './clouds.mjs';

const controller = new AbortController();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const query = new URLSearchParams(location.search);
const hashParts = location.hash.slice(1).split('?');
const saved = new URLSearchParams(hashParts[1] ?? '');
const state = {
  view: query.get('view') === 'particles' ? 'particles' : 'workshop',
  station: ['build','teach','automate'].includes(saved.get('station')) ? saved.get('station') : 'build',
  interest: ['ride','lift','coffee'].includes(saved.get('interest')) ? saved.get('interest') : 'ride',
  theme: saved.get('theme') === 'light' ? 'light' : 'dark',
  motion: saved.get('motion') !== 'off', section: hashParts[0] || 'home',
  project: saved.get('project'), step: Math.max(0,Math.min(3,Number(saved.get('step'))||0)),
};
const captions = {
  build: 'Open the tool drawer. Context, skills, and checks, ready for the next task.',
  teach: 'Take a seat. A useful question becomes a demo, a discussion, and something to share.',
  automate: 'Follow the publishing desk. Stories become a ranked, AI-assisted digest.',
};
const interests = {
  ride: ['KTM DUKE 390','KTM Duke 390. My way to get away from the screen.'],
  lift: ['A POWERLIFTING BACKGROUND','I used to do powerlifting. A different kind of practice, patience, and progress.'],
  coffee: ['BLACK COFFEE','My coffee preference is simple: black.'],
};
const projects = {
  toolkit: {
    title:'Context becomes action.', intro:'An illustrative example of how reusable agent workflows can support a small code change.', source:'https://github.com/prudhvi1709/agents-toolkit',
    steps:[
      ['Context','Start from relevant decisions and the current files. Earlier notes provide context; the actual implementation still needs checking.','Example task: add an export option\nRelevant context: existing output format and user preferences'],
      ['Plan','Choose a focused change and the checks that would demonstrate the intended behavior.','Plan: reuse the existing formatter\nBoundary: empty input\nCheck: exported output opens correctly'],
      ['Build','Use the project conventions and the relevant skill. Keep the implementation small enough to inspect.','Change: add the export action\nReuse: current data and formatting functions\nAvoid: an unrelated rewrite'],
      ['Verify','Inspect the actual result, then hand over the change and its limits.','Evidence: output checked against the source data\nReview: focused diff and relevant checks\nHandoff: what changed, what was checked'],
    ],
  },
  dailynews: {
    title:'A story becomes a digest.',intro:'A sample walkthrough of the public news workflow. These example inputs are illustrative; the live archive is linked below.',source:'https://prudhvi1709.github.io/dailynews/',
    steps:[
      ['Collect','Gather candidate stories from RSS feeds. Preserve source links so readers can open the original article.','Example inputs:\n- An article about model evaluation\n- A developer tooling update\n- A news item outside the selected scope'],
      ['Rank','Prioritize relevant items and reduce duplication before generating a digest.','Keep: relevant evaluation and developer-tool stories\nDown-rank: out-of-scope items\nNo fabricated relevance scores'],
      ['Summarize','Use LLM assistance to turn the selected material into a readable digest, with links to the sources.','Digest outline:\n1. What changed\n2. Why it matters\n3. Read the original source'],
      ['Deliver','The scheduled workflow distributes the digest by email and publishes an archive visitors can browse.','Public output: the digest archive\nAutomation: GitHub Actions\nExplore the actual archive below'],
    ],
  },
  talks: {
    title:'Good enough for what?',intro:'A small illustrative exercise in framing an AI evaluation. The intended use changes what you should measure.',source:'https://prudhvi1709.github.io/talks/',
    steps:[
      ['Question','Define the job before choosing a metric. A drafting assistant and an automated decision system have different consequences.','Example use: draft a news summary\nReader: a person who can inspect the sources\nQuestion: what would make this useful?'],
      ['Demo','Make the task concrete enough to inspect. Look at an example input and the resulting output.','Input: a linked article\nOutput: a concise summary\nInspect: unsupported claims, missing facts, source fidelity'],
      ['Discuss','Test the assumptions. Which failure matters, and who notices it before the output is used?','Tradeoffs to discuss:\n- Correctness and coverage\n- Time to review\n- Clarity and useful source links'],
      ['Share','Make the ideas reusable through slides, examples, and recordings, so others can investigate them in their own setting.','Take away:\nA clearer task definition\nA failure you know to look for\nAn example you can reproduce'],
    ],
  },
};
let sceneDocument = null;
const heroCloud = new PointCloud(document.querySelector('#hero-cloud'),state.station);
const personalCloud = new PointCloud(document.querySelector('#personal-cloud'),state.interest);
const dialog = document.querySelector('#project-dialog');
const motionButton = document.querySelector('#motion-toggle');
const themeButton = document.querySelector('#theme-toggle');

function persist() {
  const url=new URL(location.href);
  url.searchParams.set('view',state.view);
  const params=new URLSearchParams({station:state.station,interest:state.interest,theme:state.theme,motion:state.motion?'on':'off'});
  if(state.project && projects[state.project]){params.set('project',state.project);params.set('step',String(state.step));}
  url.hash=`${state.section}?${params}`;
  history.replaceState(null,'',url);
}
function sceneState() {
  if(!sceneDocument?.documentElement)return;
  sceneDocument.documentElement.dataset.theme=state.theme;
  for(const group of sceneDocument.querySelectorAll('.station-art')) group.toggleAttribute('data-active',group.dataset.zone===state.station);
  sceneDocument.documentElement.toggleAttribute('data-calm',!state.motion||reduced.matches);
}
function applyMotion() {
  const paused=!state.motion||reduced.matches;
  document.body.dataset.motion=paused?'paused':'playing';
  motionButton.textContent=reduced.matches?'Reduced motion':state.motion?'Pause motion':'Resume motion';
  motionButton.setAttribute('aria-pressed',String(paused));
  motionButton.disabled=reduced.matches;
  heroCloud.setMotion(!state.motion,reduced.matches);personalCloud.setMotion(!state.motion,reduced.matches);sceneState();
}
function applyTheme() {
  document.documentElement.dataset.theme=state.theme;
  themeButton.textContent=state.theme==='dark'?'Light theme':'Dark theme';
  themeButton.setAttribute('aria-label',`Switch to ${state.theme==='dark'?'light':'dark'} theme`);
  heroCloud.setTheme();personalCloud.setTheme();sceneState();
}
function setStation(station,remember=true) {
  if(!Object.hasOwn(captions,station))return;
  state.station=station;document.body.dataset.station=station;
  for(const button of document.querySelectorAll('button[data-station]'))button.setAttribute('aria-pressed',String(button.dataset.station===station));
  document.querySelector('#station-caption').textContent=captions[station];
  document.querySelector('.cloud-caption').textContent={build:'Reusable parts: context, skills, and verification.',teach:'An auditorium: questions become demos and shared ideas.',automate:'Publishing sheets: sources become a daily digest.'}[station];
  heroCloud.setShape(station);sceneState();if(remember)persist();
}
function setInterest(interest,remember=true) {
  if(!Object.hasOwn(interests,interest))return;
  state.interest=interest;
  for(const button of document.querySelectorAll('button[data-interest]'))button.setAttribute('aria-pressed',String(button.dataset.interest===interest));
  document.querySelector('#interest-caption').textContent=interests[interest][1];
  document.querySelector('#personal-label').textContent=interests[interest][0];
  personalCloud.setShape(interest);if(remember)persist();
}
function setView(view,remember=true) {
  state.view=view==='particles'?'particles':'workshop';document.body.dataset.view=state.view;
  document.querySelector('.workshop-stage').hidden=state.view!=='workshop';
  document.querySelector('.particle-stage').hidden=state.view!=='particles';
  for(const link of document.querySelectorAll('a[data-view]')){if(link.dataset.view===state.view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  heroCloud.setEnabled(state.view==='particles');if(remember)persist();
}
function renderStep(index) {
  const project=projects[state.project];if(!project)return;
  state.step=Math.min(project.steps.length-1,Math.max(0,index));
  const step=project.steps[state.step];
  document.querySelector('#step-number').textContent=`${String(state.step+1).padStart(2,'0')} / ${project.steps.length}`;
  document.querySelector('#step-title').textContent=step[0];document.querySelector('#step-body').textContent=step[1];document.querySelector('#step-example').textContent=step[2];
  for(const button of document.querySelectorAll('.step-tabs button'))button.setAttribute('aria-pressed',String(Number(button.dataset.step)===state.step));
  persist();
}
function openProject(key) {
  if(!Object.hasOwn(projects,key))return;
  state.project=key;const project=projects[key];
  document.querySelector('#dialog-title').textContent=project.title;document.querySelector('#dialog-intro').textContent=project.intro;document.querySelector('#dialog-source').href=project.source;
  const tabs=document.querySelector('.step-tabs');tabs.replaceChildren();
  project.steps.forEach((step,index)=>{const button=document.createElement('button');button.type='button';button.dataset.step=String(index);button.textContent=`${index+1}. ${step[0]}`;button.setAttribute('aria-pressed','false');tabs.append(button);});
  renderStep(state.step);if(!dialog.open)dialog.showModal();
}

document.addEventListener('click',event=>{
  if(!(event.target instanceof Element))return;
  const station=event.target.closest('button[data-station]');if(station){setStation(station.dataset.station);return;}
  const interest=event.target.closest('button[data-interest]');if(interest){setInterest(interest.dataset.interest);return;}
  const direction=event.target.closest('a[data-view]');if(direction){event.preventDefault();setView(direction.dataset.view);document.querySelector('#home').scrollIntoView({behavior:reduced.matches||!state.motion?'instant':'smooth'});return;}
  const opener=event.target.closest('[data-open]');if(opener){state.step=0;openProject(opener.dataset.open);return;}
  const step=event.target.closest('[data-step]');if(step){renderStep(Number(step.dataset.step));return;}
  const anchor=event.target.closest('a[href^="#"]');if(anchor){const section=anchor.getAttribute('href').slice(1);const target=document.getElementById(section);if(target){event.preventDefault();state.section=section;persist();target.scrollIntoView({behavior:reduced.matches||!state.motion?'instant':'smooth'});}}
},{signal:controller.signal});
motionButton.addEventListener('click',()=>{state.motion=!state.motion;applyMotion();persist();},{signal:controller.signal});
themeButton.addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyTheme();persist();},{signal:controller.signal});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close(),{signal:controller.signal});
dialog.addEventListener('close',()=>{state.project=null;state.step=0;persist();},{signal:controller.signal});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}},{signal:controller.signal});
reduced.addEventListener('change',applyMotion,{signal:controller.signal});
const object=document.querySelector('#workshop-object');
function connectScene() {
  const doc=object.contentDocument;if(!doc?.documentElement||sceneDocument===doc)return;sceneDocument=doc;
  doc.addEventListener('click',event=>{const zone=event.target.closest('[data-zone]');if(zone)setStation(zone.dataset.zone);},{signal:controller.signal});
  sceneState();
}
object.addEventListener('load',connectScene,{signal:controller.signal});
applyTheme();setView(state.view,false);setStation(state.station,false);setInterest(state.interest,false);applyMotion();connectScene();
if(state.project && projects[state.project])openProject(state.project);
persist();
if(state.section!=='home')requestAnimationFrame(()=>document.getElementById(state.section)?.scrollIntoView({behavior:'instant'}));
window.addEventListener('pagehide',()=>{controller.abort();heroCloud.destroy();personalCloud.destroy();},{once:true});
