const $=id=>document.getElementById(id);
const icons={Leki:'💊',Nawodnienie:'💧',Dom:'🏠',Wizyta:'🧑‍⚕️',Urodziny:'🎂',Inne:'⚙️'};
let category='Leki', editingIndex=null, activeReminder=null, audioCtx=null, deferredPrompt=null;
let reminders=JSON.parse(localStorage.getItem('reminders')||'null')||[
{name:'Weź pigułkę',category:'Leki',priority:'critical',time:'08:00 / 20:00',repeat:'Codziennie',voice:'Weź pigułkę, weź pigułkę',enabled:true},
{name:'Wypij wodę',category:'Nawodnienie',priority:'normal',time:'10:00 / 14:00 / 18:00',repeat:'Codziennie',voice:'Wypij wodę, wypij wodę',enabled:true}
];
let history=JSON.parse(localStorage.getItem('history')||'[]');
function persist(){localStorage.setItem('reminders',JSON.stringify(reminders))}
document.querySelectorAll('#categories button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#categories button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');category=b.dataset.cat});
function newReminder(){editingIndex=null;$('formTitle').innerHTML='← &nbsp; Dodaj przypomnienie';$('saveLabel').textContent='Zapisz przypomnienie';$('name').value='';$('time').value='20:00';$('repeat').value='Codziennie';$('voice').value='';$('priority').value='normal';category='Leki';document.querySelectorAll('#categories button').forEach(b=>b.classList.toggle('selected',b.dataset.cat==='Leki'));show('form')}
function editReminder(i){const r=reminders[i];editingIndex=i;$('formTitle').innerHTML='← &nbsp; Edytuj przypomnienie';$('saveLabel').textContent='Zapisz zmiany';$('name').value=r.name||'';$('time').value=(String(r.time).match(/\d{2}:\d{2}/)||['20:00'])[0];$('repeat').value=['Codziennie','Jednorazowo','Wybrane dni tygodnia'].includes(r.repeat)?r.repeat:'Jednorazowo';$('voice').value=r.voice||r.name||'';$('priority').value=r.priority||'normal';category=r.category||'Inne';document.querySelectorAll('#categories button').forEach(b=>b.classList.toggle('selected',b.dataset.cat===category));show('form')}
function save(){const old=editingIndex!==null?reminders[editingIndex]:{};const r={...old,name:$('name').value.trim()||'Przypomnienie',category,priority:$('priority').value,time:$('time').value,repeat:$('repeat').value,voice:$('voice').value.trim()||$('name').value.trim()||'Przypomnienie',enabled:old.enabled!==false};if(editingIndex!==null){reminders[editingIndex]=r}else{reminders.unshift(r)}persist();editingIndex=null;show('list')}
function deleteReminder(i){if(confirm('Usunąć przypomnienie „'+reminders[i].name+'”?')){reminders.splice(i,1);persist();render()}}
function show(id){['list','form','history','settings','alarm'].forEach(x=>$(x).hidden=x!==id);if(id==='list')render();if(id==='history')renderHistory()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){$('cards').innerHTML='';reminders.forEach((r,i)=>{const d=document.createElement('div');d.className='card '+(r.priority||'normal');d.innerHTML=`<div class="ico">${icons[r.category]||'🔔'}</div><b>${esc(r.name)}</b><div class="toggle">●</div><div class="meta">⌄ ${esc(r.repeat)}</div><div></div><div class="time">🔊 ${esc(r.time)}</div><div></div><div class="card-actions"><button class="edit-btn" onclick="editReminder(${i})">✏️ Edytuj</button><button class="delete-btn" onclick="deleteReminder(${i})">🗑 Usuń</button></div>`;$('cards').appendChild(d)})}
function polishVoice(){const vs=speechSynthesis.getVoices();return vs.find(v=>/^pl[-_]/i.test(v.lang))||vs.find(v=>/pol/i.test(v.name))||null}
function speak(text){return new Promise((res,rej)=>{if(!('speechSynthesis'in window))return rej();speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text),v=polishVoice();if(v)u.voice=v;u.lang='pl-PL';u.rate=.9;u.volume=1;u.onend=res;u.onerror=rej;speechSynthesis.speak(u)})}
function beep(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const n=audioCtx.currentTime;[0,.3,.6].forEach(t=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=880;g.gain.setValueAtTime(.001,n+t);g.gain.exponentialRampToValueAtTime(.35,n+t+.02);g.gain.exponentialRampToValueAtTime(.001,n+t+.22);o.connect(g);g.connect(audioCtx.destination);o.start(n+t);o.stop(n+t+.24)});return new Promise(r=>setTimeout(r,1000))}catch(e){return Promise.resolve()}}
function fillAlarm(r){activeReminder=r;$('alarm').className='alarm '+(r.priority||'normal');$('alarmIcon').textContent=icons[r.category]||'🔔';$('alarmName').textContent=(r.name||'Przypomnienie').toUpperCase();$('alarmTime').textContent=r.time;$('alarmRepeat').textContent=r.repeat;$('alarmVoice').textContent='🔊 „'+(r.voice||r.name)+'”'}
function done(){if('speechSynthesis'in window)speechSynthesis.cancel();history.unshift({text:activeReminder?.name||$('alarmName').textContent,time:new Date().toLocaleString('pl-PL'),status:'Wykonane'});localStorage.setItem('history',JSON.stringify(history));show('list')}
function snooze(){if('speechSynthesis'in window)speechSynthesis.cancel();if(activeReminder){activeReminder.snoozeUntil=Date.now()+10*60*1000;persist()}show('list')}
function renderHistory(){$('hist').innerHTML=history.length?history.map(x=>`<p>✅ <b>${esc(x.text)}</b><br>${esc(x.time)} — ${esc(x.status||'Wykonane')}</p>`).join(''):'Brak wykonanych przypomnień.'}
function dueNow(r,now){if(r.enabled===false)return false;if(r.snoozeUntil&&now.getTime()>=r.snoozeUntil){r.snoozeUntil=0;return true}const hh=String(now.getHours()).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0'),key=now.toLocaleDateString('sv-SE')+' '+hh+':'+mm;if(r.lastFired===key)return false;const times=(String(r.time).match(/\d{2}:\d{2}/g)||[]);return times.includes(hh+':'+mm)}
async function checkReminders(){if(!$('alarm').hidden)return;const now=new Date(),r=reminders.find(x=>dueNow(x,now));if(!r)return;r.lastFired=now.toLocaleDateString('sv-SE')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');persist();fillAlarm(r);show('alarm');if(navigator.vibrate)navigator.vibrate([500,250,500,250,800]);await beep();try{await speak(r.voice||r.name)}catch(e){}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});
async function installApp(){if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true}else alert('Użyj menu przeglądarki i wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.')}
if('serviceWorker'in navigator){
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js?v=1006',{updateViaCache:'none'});
      await reg.update();
      let refreshing=false;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(refreshing)return; refreshing=true; location.reload();
      });
      if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
      reg.addEventListener('updatefound',()=>{
        const w=reg.installing; if(!w)return;
        w.addEventListener('statechange',()=>{
          if(w.state==='installed'&&navigator.serviceWorker.controller) w.postMessage({type:'SKIP_WAITING'});
        });
      });
    }catch(e){console.warn('Aktualizacja PWA:',e)}
  });
}
if('speechSynthesis'in window){speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices()}
render();setInterval(checkReminders,5000);checkReminders();
