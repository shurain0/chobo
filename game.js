/* ===== 財表クエスト ===== */
const $=s=>document.querySelector(s);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const strip=s=>String(s).replace(/<[^>]+>/g,"");
const byIdG=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const STAGEMAP={
"引当金":["liab1","liab2","t7","t40","t41","t53"],"収益認識":["rev1","rev2","rev3","rev4","t28","t29"],"包括利益・CF計算書":["pl2","pl5","pl3","t25","t26","t27","t51"],
"金融商品（有価証券）":["fin1","fin2","t5","t6","t47"],"リース":["asset6","t46"],"減損":["asset1","asset3","t1","t2","t3"],"資産除去債務":["liab3","t8","t9"],
"退職給付":["emp1","emp2","t13","t14"],"ストック・オプション":["emp4","emp5","t10","t11","t12"],"税効果会計":["tax1","t37","t38","t39"],
"外貨換算":["fx1","t22","t23","t24","t52"],"企業結合":["ma1","ma2","t19","t20","t21","t50"],"連結":["cons1","cons5","t15","t16","t17","t18","t33","t34","t35","t36","t48","t49"]};
const ENEMY=[
["引当金","見積もりの影",260],["収益認識","五段ステップの番兵",30],["包括利益・CF計算書","キャッシュの渦",190],["金融商品（有価証券）","時価のカメレオン",140],
["リース","借り物の甲冑",25],["減損","簿価ゴーレム",20],["資産除去債務","除去の番人",280],["退職給付","後払いの賢者",260],["ストック・オプション","オプションの奇術師",320],
["税効果会計","一時差異の双子",170],["外貨換算","為替の風見鶏",45],["企業結合","のれん竜",0],["連結","グループ大王",350]];
const LV=()=>1+Math.floor(G.xp/100);
/* --- 問題づくり --- */
const ALLWHY=Object.entries(WHY).flatMap(([n,qs])=>qs.map(([q,rs])=>({n,q,rs})));
function stageQs(n){
  const qs=[];
  (STAGEMAP[n]||[]).map(id=>byIdG[id]).filter(i=>i&&i.type==="tf").forEach(i=>qs.push({ty:"tf",q:strip(i.q),ans:i.tf,why:strip(i.why)}));
  (WHY[n]||[]).forEach(([q,rs])=>{const c=pick(rs);const others=shuffle(ALLWHY.filter(w=>w.q!==q).flatMap(w=>w.rs)).filter(r=>!rs.includes(r)).slice(0,3);
    qs.push({ty:"mc",label:"理由",q:q+"？",opts:shuffle([c,...others]),ans:c,why:rs.length>1?"理由は"+rs.length+"つ："+rs.map((r,i)=>"①②③④"[i]+r).join(" "):c});});
  const x=SETS.find(s=>s.n===n);
  if(x){const od=shuffle(SETS.filter(s=>s.n!==n)).slice(0,3);
    qs.push({ty:"mc",label:"定義",q:"「"+n+"」の定義はどれ？",opts:shuffle([x.d,...od.map(s=>s.d)]),ans:x.d,why:x.d});
    qs.push({ty:"mc",label:"IFRS",q:"「"+n+"」の日本基準とIFRSの違いはどれ？",opts:shuffle([x.i,...shuffle(SETS.filter(s=>s.n!==n)).slice(0,3).map(s=>s.i)]),ans:x.i,why:x.i});}
  const terms=Object.keys(GLOSS).filter(k=>(STORY[n]||"").includes(k)).slice(0,4);
  terms.forEach(k=>{const od=shuffle(Object.keys(GLOSS).filter(t=>t!==k)).slice(0,3);qs.push({ty:"mc",label:"用語",q:"「"+k+"」の意味は？",opts:shuffle([GLOSS[k],...od.map(t=>GLOSS[t])]),ans:GLOSS[k],why:k+"："+GLOSS[k]});});
  return shuffle(qs).slice(0,n==="連結"?12:8);
}
function speedPool(){
  const p=[];
  ITEMS.filter(i=>i.type==="tf").forEach(i=>p.push({q:strip(i.q),ans:i.tf,why:strip(i.why)}));
  ALLWHY.forEach(w=>{const r=pick(w.rs);p.push({q:w.q+"？ → "+r,ans:true,why:r});const wr=pick(ALLWHY.filter(x=>x.q!==w.q)).rs[0];if(!w.rs.includes(wr))p.push({q:w.q+"？ → "+wr,ans:false,why:"正しくは："+w.rs.join(" ／ ")});});
  Object.keys(GLOSS).forEach(k=>{p.push({q:"「"+k+"」＝"+GLOSS[k],ans:true,why:GLOSS[k]});const o=pick(Object.keys(GLOSS).filter(t=>t!==k));p.push({q:"「"+k+"」＝"+GLOSS[o],ans:false,why:"正しくは："+GLOSS[k]});});
  return shuffle(p);
}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ===== ちょぼを育てる ===== */
const PKEY=(typeof window!=="undefined"&&window.CHOBO_PKEY)||"zaihyo-pet-v1";
const ORDER=["連結","税効果会計","減損","引当金","退職給付","ストック・オプション","資産除去債務","収益認識","金融商品（有価証券）","リース","企業結合","外貨換算","包括利益・CF計算書"];
let P=null;
function fresh(){return {name:"ちょぼ",born:Date.now(),t:Date.now(),tf:Date.now(),tm:Date.now(),hist:{},stat:{},food:3,mood:3,sick:false,exp:{},act:{eat:0,play:0,study:0},best:0,miss:[],log:{},hungryAt:null};}
try{const r=localStorage.getItem(PKEY);P=r?JSON.parse(r):fresh();}catch(e){P=fresh();}
/* データの形の版。今後データの形を変えるときは、ここに変換を足していく（古いデータを消さずに新しい形へ） */
const DATA_V=1;
function migrateP(o){if(!o||typeof o!=="object")return fresh();o.v=o.v||1;
  /* 例：if(o.v<2){ ...古い形を新しい形に直す... ; o.v=2; } */
  const f=fresh();for(const k of Object.keys(f))if(o[k]===undefined)o[k]=f[k];return o;}
P=migrateP(P);
function record(q,ok,std,mode){const k=q.id||q.q;const h=P.hist[k]||{q:{id:q.id,ty:q.ty,q:q.q,ans:q.ans,why:q.why,opts:q.opts,label:q.label,ref:q.ref,point:q.point},std:std||"その他",ok:0,ng:0,streak:0};
  if(ok){h.ok++;h.streak++;if(h.ng>0&&h.streak===2)P.overcome=(P.overcome||0)+1;}else{h.ng++;h.streak=0;}h.lastOk=ok;h.t=Date.now();h.mode=mode;P.hist[k]=h;
  const st=P.stat[h.std]=P.stat[h.std]||{ok:0,ng:0};ok?st.ok++:st.ng++;
  const w=wk();if(!P.week||P.week.k!==w)P.week={k:w,ok:0};if(ok)P.week.ok++;}
function wk(){const d=new Date();const m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7));return m.getFullYear()+"-"+(m.getMonth()+1)+"-"+m.getDate();}
const missList=()=>Object.values(P.hist).filter(h=>h.ng>0&&h.streak<2&&h.q.ty!=="rev").sort((a,b)=>b.t-a.t);
const psave=()=>{P.upd=Date.now();try{localStorage.setItem(PKEY,JSON.stringify(P));}catch(e){}if(typeof gsyncPush==="function")gsyncPush();};
const H=3600e3;
P.tf=P.tf||P.t;P.tm=P.tm||P.t;P.hist=P.hist||{};P.stat=P.stat||{};
function decay(){const now=Date.now();
  const f=Math.floor((now-P.tf)/(4*H)),m=Math.floor((now-P.tm)/(6*H));
  if(f>0){P.food=Math.max(0,P.food-f);P.tf+=f*4*H;}if(m>0){P.mood=Math.max(0,P.mood-m);P.tm+=m*6*H;}P.t=now;
  if(P.food===0){P.hungryAt=P.hungryAt||now;if(now-P.hungryAt>12*H)P.sick=true;}else P.hungryAt=null;psave();}
const total=()=>Object.values(P.exp).reduce((a,b)=>a+b,0);
const STAGES=[[0,"たね"],[30,"ふたば"],[100,"こちょぼ"],[250,"ちょぼ"],[500,"おとなちょぼ"]];
function stage(){let s=0;STAGES.forEach(([t],i)=>{if(total()>=t)s=i;});return s;}
const THEME_T={"連結":"グループちょぼ","税効果会計":"ぜいこうかちょぼ","減損":"げんそんちょぼ","退職給付":"ちょうろうちょぼ","ストック・オプション":"きじゅつしちょぼ","外貨換算":"せかいちょぼ","企業結合":"がったいちょぼ","金融商品（有価証券）":"マーケットちょぼ"};
const ADULTS=[
["パーフェクトちょぼ","虹の輪","正解率90%以上でおとなになる","special"],
["しょうぶちょぼ","チャンピオンベルト","たいせんで5勝以上してからおとなになる","special"],
["グループちょぼ","王冠","連結の正解数が全体の4分の1以上","theme"],
["ぜいこうかちょぼ","税のコイン","税効果会計の正解数が全体の4分の1以上","theme"],
["げんそんちょぼ","ばんそうこう","減損の正解数が全体の4分の1以上","theme"],
["ちょうろうちょぼ","白いおひげ","退職給付の正解数が全体の4分の1以上","theme"],
["きじゅつしちょぼ","星のぼうし","ストック・オプションの正解数が全体の4分の1以上","theme"],
["せかいちょぼ","地球のふうせん","外貨換算の正解数が全体の4分の1以上","theme"],
["がったいちょぼ","パズルのバッジ","企業結合の正解数が全体の4分の1以上","theme"],
["マーケットちょぼ","グラフのバッジ","金融商品の正解数が全体の4分の1以上","theme"],
["ふくしゅうちょぼ","チェックのノート","ふくしゅうでまちがいを30問克服","special"],
["だいすきちょぼ","ハートのアンテナ","「今日のお世話」を7日達成","special"],
["ものしりちょぼ","めがね","べんきょう中心に育てる","act"],
["はやわざちょぼ","スピード線","あそぶ（60秒〇×）中心に育てる","act"],
["ねばりちょぼ","はちまき","ごはん中心にこつこつ育てる","act"]];
function accRate(){const h=Object.values(P.hist||{});const ok=h.reduce((a,x)=>a+x.ok,0),n=h.reduce((a,x)=>a+x.ok+x.ng,0);return n?ok/n:0;}
function careDays(){return Object.values(P.log||{}).filter(l=>l.eat>=2&&l.play>=1&&l.study>=1).length;}
function decideType(){const tot=total()||1;
  if(accRate()>=0.9)return "パーフェクトちょぼ";
  if(((P.vs||{}).w||0)>=5)return "しょうぶちょぼ";
  const st=P.stat||{},allOk=Object.values(st).reduce((x,y)=>x+y.ok,0)||1;const top=Object.keys(THEME_T).map(n=>[n,(st[n]||{}).ok||0]).sort((x,y)=>y[1]-x[1])[0];
  if(top&&top[1]>=allOk*0.25&&top[1]>=20)return THEME_T[top[0]];
  if((P.overcome||0)>=30)return "ふくしゅうちょぼ";
  if(careDays()>=7)return "だいすきちょぼ";
  const a=P.act;if(a.study>=a.eat&&a.study>=a.play)return "ものしりちょぼ";if(a.play>a.eat)return "はやわざちょぼ";return "ねばりちょぼ";}
function adultType(){if(!P.adult&&stage()===4){P.adult=decideType();P.dex=P.dex||{};P.dex[P.adult]=1;psave();}return P.adult||decideType();}
const dayKey=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();};
const todayLog=()=>{P.log[dayKey()]=P.log[dayKey()]||{eat:0,play:0,study:0};return P.log[dayKey()];};
function focusStd(){const sc=ORDER.map((n,i)=>[(P.exp[n]||0)+i*2,n]);sc.sort((a,b)=>a[0]-b[0]);return sc[0][1];}
/* --- ちょぼの絵（オリジナル） --- */
const BODY={"パーフェクトちょぼ":"#FFF4C7","しょうぶちょぼ":"#FFD9C2","グループちょぼ":"#FFE9A8","ぜいこうかちょぼ":"#E6F2D3","げんそんちょぼ":"#F2E1D6","ちょうろうちょぼ":"#EDE6F7","きじゅつしちょぼ":"#E9DDFB","せかいちょぼ":"#D9EEFC","がったいちょぼ":"#FCE0EC","マーケットちょぼ":"#DDF5EA","ふくしゅうちょぼ":"#FDEBD3","だいすきちょぼ":"#FFE0E6"};
function ACC(t,r,cy){const top=cy-r,L=100-r,Rr=100+r;switch(t){
 case "パーフェクトちょぼ":return `<path d="M${L-8} ${top+18} A${r+8} ${r+8} 0 0 1 ${Rr+8} ${top+18}" fill="none" stroke="#FF6B8B" stroke-width="5"/><path d="M${L-2} ${top+20} A${r+2} ${r+2} 0 0 1 ${Rr+2} ${top+20}" fill="none" stroke="#FFB830" stroke-width="5"/><path d="M${L+4} ${top+22} A${r-4} ${r-4} 0 0 1 ${Rr-4} ${top+22}" fill="none" stroke="#4DB6E8" stroke-width="5"/>`;
 case "しょうぶちょぼ":return `<rect x="${L-4}" y="${cy+r*0.15}" width="${2*r+8}" height="12" rx="5" fill="#FFB830" stroke="#C9871A" stroke-width="2"/><circle cx="100" cy="${cy+r*0.15+6}" r="10" fill="#FFD25E" stroke="#C9871A" stroke-width="2"/><path d="M100 ${cy+r*0.15-1} l2.5 5 5.5 .8 -4 3.8 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -3.8 5.5 -.8z" fill="#fff"/>`;
 case "グループちょぼ":return `<path d="M70 ${top+2} L78 ${top-18} L88 ${top-4} L100 ${top-22} L112 ${top-4} L122 ${top-18} L130 ${top+2} Z" fill="#E3B54E" stroke="#B7841A" stroke-width="2"/><circle cx="100" cy="${top-6}" r="4" fill="#FF6B8B"/>`;
 case "ぜいこうかちょぼ":return `<circle cx="${Rr+6}" cy="${cy+8}" r="16" fill="#FFC93C" stroke="#C9971A" stroke-width="3"/><text x="${Rr+6}" y="${cy+14}" text-anchor="middle" font-size="16" font-weight="800" fill="#8A5A00">税</text>`;
 case "げんそんちょぼ":return `<g transform="rotate(-30 ${Rr-14} ${top+18})"><rect x="${Rr-30}" y="${top+12}" width="32" height="12" rx="6" fill="#FBD3B0" stroke="#D9A77D" stroke-width="2"/><circle cx="${Rr-18}" cy="${top+18}" r="1.6" fill="#D9A77D"/><circle cx="${Rr-10}" cy="${top+18}" r="1.6" fill="#D9A77D"/></g><path d="M${L-14} ${cy-6} v16 m-6 -6 l6 7 6 -7" stroke="#4DB6E8" stroke-width="3" fill="none" stroke-linecap="round"/>`;
 case "ちょうろうちょぼ":return `<path d="M${100-r*0.45} ${cy+r*0.2} Q100 ${cy+r*0.95} ${100+r*0.45} ${cy+r*0.2} Q100 ${cy+r*0.45} ${100-r*0.45} ${cy+r*0.2} Z" fill="#FFFFFF" stroke="#D8D2E6" stroke-width="2"/><path d="M${100-r*0.55} ${cy-r*0.38} q8 -6 16 0 M${100+r*0.25} ${cy-r*0.38} q8 -6 16 0" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"/>`;
 case "きじゅつしちょぼ":return `<path d="M${100-r*0.6} ${top+8} L100 ${top-40} L${100+r*0.6} ${top+8} Z" fill="#7B5BE0"/><rect x="${100-r*0.75}" y="${top+4}" width="${r*1.5}" height="8" rx="4" fill="#5A3FC0"/><path d="M100 ${top-24} l3 6 6.5 1 -4.7 4.5 1.1 6.4 -5.9 -3.1 -5.9 3.1 1.1 -6.4 -4.7 -4.5 6.5 -1z" fill="#FFD25E"/>`;
 case "せかいちょぼ":return `<line x1="${Rr-6}" y1="${cy}" x2="${Rr+12}" y2="${top-6}" stroke="#7C6F8E" stroke-width="2"/><circle cx="${Rr+14}" cy="${top-20}" r="16" fill="#6CC8F2" stroke="#3A8FBE" stroke-width="2"/><path d="M${Rr+4} ${top-26} q6 -4 10 2 q4 6 -2 10 q-6 2 -8 -4z M${Rr+18} ${top-14} q6 -2 8 4 q-4 4 -8 0z" fill="#7BD389"/>`;
 case "がったいちょぼ":return `<path d="M${Rr-4} ${cy-6} h10 a5 5 0 1 1 10 0 h10 v10 a5 5 0 1 0 0 10 v10 h-30 z" fill="#FF8FB1" stroke="#D9607F" stroke-width="2"/>`;
 case "マーケットちょぼ":return `<rect x="${Rr-6}" y="${cy-14}" width="34" height="28" rx="6" fill="#FFFFFF" stroke="#33B97A" stroke-width="2"/><path d="M${Rr-1} ${cy+8} l7 -8 6 4 9 -11" stroke="#33B97A" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
 case "ふくしゅうちょぼ":return `<rect x="${L-24}" y="${cy-6}" width="30" height="36" rx="4" fill="#FFFFFF" stroke="#9B7BF0" stroke-width="2"/><path d="M${L-18} ${cy+12} l5 5 9 -11" stroke="#33B97A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${L-18} ${cy+2} h16" stroke="#C3B4D6" stroke-width="2"/>`;
 case "だいすきちょぼ":return `<line x1="${100-r*0.5}" y1="${top+8}" x2="${100-r*0.75}" y2="${top-18}" stroke="#C9A75E" stroke-width="3"/><line x1="${100+r*0.5}" y1="${top+8}" x2="${100+r*0.75}" y2="${top-18}" stroke="#C9A75E" stroke-width="3"/><path d="M${100-r*0.75} ${top-14} c-3 -8 -14 -4 -8 4 l8 8 8 -8 c6 -8 -5 -12 -8 -4z" fill="#FF6B8B"/><path d="M${100+r*0.75} ${top-14} c-3 -8 -14 -4 -8 4 l8 8 8 -8 c6 -8 -5 -12 -8 -4z" fill="#FF6B8B"/>`;
 case "ものしりちょぼ":return `<circle cx="${100-r*.35}" cy="${cy-r*.2}" r="${r*.2}" fill="none" stroke="#3B2E4A" stroke-width="3"/><circle cx="${100+r*.35}" cy="${cy-r*.2}" r="${r*.2}" fill="none" stroke="#3B2E4A" stroke-width="3"/><path d="M${100-r*.15} ${cy-r*.2} H${100+r*.15}" stroke="#3B2E4A" stroke-width="3"/>`;
 case "はやわざちょぼ":return `<path d="M${Rr} ${cy-10} l18 -6 M${Rr} ${cy} l22 0 M${Rr} ${cy+10} l18 6" stroke="#FF6B8B" stroke-width="3" stroke-linecap="round"/>`;
 case "ねばりちょぼ":return `<rect x="${L-6}" y="${cy-r*0.55}" width="${2*r+12}" height="9" rx="4" fill="#FF6B8B"/>`;}
 return "";}
function petSVG(o){const st=o?o.st:stage(),sad=o?false:(P.sick||P.food===0||P.mood===0),happy=o?!!o.happy:(P.mood>=3&&P.food>=3&&!P.sick);const AT=o?()=>o.type:adultType;
  const face=(cx,cy,r)=>`<circle class="eye" cx="${cx-r*0.35}" cy="${cy-r*0.1}" r="${r*0.09}" fill="#1B2238"/><circle class="eye" cx="${cx+r*0.35}" cy="${cy-r*0.1}" r="${r*0.09}" fill="#1B2238"/>`+(sad?`<path d="M${cx-r*.25} ${cy+r*.35} Q${cx} ${cy+r*.15} ${cx+r*.25} ${cy+r*.35}" stroke="#1B2238" stroke-width="3" fill="none" stroke-linecap="round"/>`:`<path d="M${cx-r*.25} ${cy+r*.2} Q${cx} ${cy+(happy?r*.5:r*.35)} ${cx+r*.25} ${cy+r*.2}" stroke="#1B2238" stroke-width="3" fill="none" stroke-linecap="round"/>`)+`<circle cx="${cx-r*.6}" cy="${cy+r*.15}" r="${r*.12}" fill="#F3A1A1" opacity=".7"/><circle cx="${cx+r*.6}" cy="${cy+r*.15}" r="${r*.12}" fill="#F3A1A1" opacity=".7"/>`;
  let body="";
  if(st===0)body=`<ellipse cx="100" cy="150" rx="34" ry="26" fill="#9B6B3D"/><path d="M80 140 Q100 128 120 140" stroke="#6E4A28" stroke-width="3" fill="none"/>`+face(100,150,26);
  else if(st===1)body=`<rect x="96" y="70" width="8" height="60" rx="4" fill="#3E9B5B"/><path d="M100 80 Q70 60 62 78 Q80 92 100 82 Z" fill="#5CBF77"/><path d="M100 76 Q130 54 140 72 Q120 88 100 78 Z" fill="#5CBF77"/><ellipse cx="100" cy="152" rx="40" ry="28" fill="#9B6B3D"/>`+face(100,152,28);
  else{const r=[0,0,40,52,58][st];const cy=150-r*0.2;
    body=`<path d="M100 ${cy-r-14} Q86 ${cy-r-36} 74 ${cy-r-24} Q88 ${cy-r-10} 100 ${cy-r-6} Z" fill="#5CBF77"/><path d="M100 ${cy-r-14} Q116 ${cy-r-40} 130 ${cy-r-26} Q114 ${cy-r-10} 100 ${cy-r-6} Z" fill="#5CBF77"/><rect x="97" y="${cy-r-14}" width="6" height="16" rx="3" fill="#3E9B5B"/>
    <ellipse cx="100" cy="${cy}" rx="${r}" ry="${r*0.92}" fill="${st===4?(BODY[AT()]||"#F7E3B0"):"#F7E3B0"}" stroke="#C9A75E" stroke-width="3"/>
    <rect x="${100-r*0.38}" y="${cy+r*0.42}" width="${r*0.76}" height="${r*0.34}" rx="3" fill="#FFFFFF" stroke="#C9A75E" stroke-width="2"/><path d="M${100-r*0.28} ${cy+r*0.52} H${100+r*0.28} M${100-r*0.28} ${cy+r*0.64} H${100+r*0.15}" stroke="#2F6FD6" stroke-width="2"/>`+face(100,cy-r*0.1,r);
    if(st===4)body+=ACC(AT(),r,cy);}
  if(!o&&P.sick)body+=`<text x="150" y="70" font-size="26">💧</text>`;
  else if(happy)body+=`<text x="148" y="70" font-size="22">♪</text>`;
  return `<svg viewBox="0 0 200 200" class="pet${happy?" bounce":""}" aria-label="ちょぼ">${`<ellipse cx="100" cy="186" rx="56" ry="7" fill="rgba(0,0,0,.15)"/>`}${body}</svg>`;}
const SAY=()=>{if(P.sick)return "ぐったり…。まちがえた問題を見直して、くすりをちょうだい。";if(P.food===0)return "おなかがすいて動けない…。問題を解いてごはんをちょうだい。";if(P.mood<=1)return "ちょっと退屈…。いっしょに60秒あそぼう！";
  const x=pick(SETS);const w=pick(WHY[x.n]||[["",[""]]]);return pick([`知ってた？ ${x.n}の定義は「${x.d}」なんだって。`,`${w[0]}？ 答えは${w[1].length}つあるよ。思い出せる？`,`今日は「${focusStd()}」が気になるなあ。`]);};
const meter=(v,ico)=>`<span class="mt">${[0,1,2,3].map(i=>`<i class="${i<v?"on":""}">${ico}</i>`).join("")}</span>`;
/* --- 画面 --- */
let Q=null,SP=null;
function homeP(){Q=null;SP=null;if(typeof VIEW!=="undefined")VIEW="home";decay();const st=stage(),tl=todayLog();const nx=STAGES[st+1];
  const now=new Date(),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate()),days=Math.round((new Date(2026,11,2)-t0)/864e5);
  $("#app").innerHTML=`<div class="top"><h1 class="px">ちょぼを育てる</h1><span class="lv">${days>0?`試験まで ${days}日`:days===0?"今日が本番！":"試験おつかれさま"}</span></div>
  <div class="room"><div class="bubble">${SAY()}</div>${petSVG()}<div class="nm px">${STAGES[st][1]}${st===4?"（"+adultType()+"）":""}</div></div>
  ${typeof petProgress==="function"?petProgress():""}
  <div class="card stats"><div><span>おなか</span>${meter(P.food,"●")}</div><div><span>ごきげん</span>${meter(P.mood,"♥")}</div>
  <div><span>そだち</span><span class="lv">${total()}${nx?` / 次の姿まで ${nx[0]-total()}`:"（最終形態）"}</span></div><div class="bar"><i style="width:${nx?Math.min(100,(total()-STAGES[st][0])/(nx[0]-STAGES[st][0])*100):100}%"></i></div></div>
  <div class="acts">
  ${P.sick?`<button class="act sick" data-a="med"><b>くすり</b><small>まちがえた問題を3問見直す</small></button>`:""}
  <button class="act" data-a="eat" ${P.sick?"disabled":""}><b>ごはん</b><small>3問解く（${focusStd()}）</small></button>
  <button class="act" data-a="play" ${P.sick?"disabled":""}><b>あそぶ</b><small>60秒〇×</small></button>
  <button class="act" data-a="study" ${P.sick?"disabled":""}><b>べんきょう</b><small>解説を読んで5問</small></button>
  <button class="act" data-a="rv" ${P.sick||!missList().length?"disabled":""}><b>ふくしゅう</b><small>まちがえた問題 ${missList().length}問</small></button></div>
  <div class="card"><b>今日のお世話</b><ul class="todo"><li class="${tl.eat>=2?"done":""}">ごはん 2回（${Math.min(tl.eat,2)}/2）</li><li class="${tl.play>=1?"done":""}">あそぶ 1回（${Math.min(tl.play,1)}/1）</li><li class="${tl.study>=1?"done":""}">べんきょう 1回（${Math.min(tl.study,1)}/1）</li></ul>
  <p class="lv">おなかは4時間、ごきげんは6時間ごとに1つ減ります。おなかが空のまま半日たつと、ぐったりしてしまいます。</p></div>
  <div class="acts net"><button class="act" data-a="plaza"><b>ひろば</b><small>みんなのちょぼ</small></button><button class="act" data-a="vs"><b>たいせん</b><small>〇×で勝負</small></button><button class="act" data-a="rank"><b>ランキング</b><small>ベストと今週</small></button></div>
  <button class="link" data-a="ck">チェック帳${Object.keys(P.checks||{}).length?"（"+Object.keys(P.checks||{}).length+"）":""}</button>　<button class="link" data-a="dex">ずかん（成長のすがた）</button>　<button class="link" data-a="rec">きろく</button>　<button class="link" data-a="info">そだち具合</button>`;}
function recPage(){const all=Object.values(P.hist);const ok=all.reduce((a,h)=>a+h.ok,0),ng=all.reduce((a,h)=>a+h.ng,0);const ms=missList();
  const names=[...ORDER,"用語","その他"].filter(n=>P.stat[n]);
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">きろく</h2>
  <div class="card"><p class="kv"><b>これまで</b>${ok+ng}回答えて、正解${ok}・まちがい${ng}（正解率 ${ok+ng?Math.round(ok/(ok+ng)*100):0}%）</p></div>
  <div class="card"><p class="sec px">テーマごとの正解率</p>${names.length?names.map(n=>{const s=P.stat[n],r=Math.round(s.ok/(s.ok+s.ng)*100);return `<div class="row"><span>${n}</span><span class="bar sm"><i style="width:${r}%;background:${r<60?"var(--hp)":"var(--ok)"}"></i></span><span class="lv">${r}%</span></div>`;}).join(""):`<p class="lv">まだ記録がありません</p>`}
  <p class="lv">赤いバーは正解率60%未満。そのテーマの解説を読んでから、ふくしゅうしよう。</p></div>
  <div class="card"><p class="sec px">まちがいリスト（${ms.length}問）</p>${ms.length?`<ol class="wrong">${ms.slice(0,30).map(h=>`<li><small class="lv">${h.std}・${{eat:"ごはん",study:"べんきょう",play:"あそぶ",rv:"ふくしゅう"}[h.mode]||""}・まちがい${h.ng}回</small><br>${h.q.q}<br><small>答え：${h.q.ty==="tf"?(h.q.ans?"〇":"×"):h.q.ans}${h.q.why&&h.q.why!==h.q.ans?"<br>"+h.q.why:""}</small></li>`).join("")}</ol><button class="btn" data-a="rv">まちがいを復習する</button>`:`<p class="lv">まちがえた問題はありません</p>`}
  <p class="lv">ふくしゅうで2回つづけて正解すると、リストから消えます。</p></div>`;}
function dex(){const st=stage(),t=st===4?adultType():"";const seen=P.dex=P.dex||{};if(st===4)seen[t]=1;psave();
  const F=[[0,"","たね","はじめの姿。そだち0から"],[1,"","ふたば","そだち30で芽が出る"],[2,"","こちょぼ","そだち100で帳簿のからだに"],[3,"","ちょぼ","そだち250でひとまわり大きく"]];
  const A=ADULTS;
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">ずかん</h2><p class="lv">そだち500で「おとなちょぼ」に。育て方で15の姿に分かれます。上にある姿ほど優先されます。</p>
  <div class="dex">${F.map(([s,ty,n,c])=>`<div class="dx${s===st?" now":""}${s>st?" lock":""}">${s===st?`<span class="tag">いまここ</span>`:""}${petSVG({st:s,type:ty})}<b>${s>st?"？？？":n}</b><small>${c}</small></div>`).join("")}
  ${A.map(([n,acc,c])=>{const now=st===4&&t===n,got=seen[n];return `<div class="dx${now?" now":""}${!got&&!now?" lock":""}">${now?`<span class="tag">いまここ</span>`:""}${petSVG({st:4,type:n})}<b>${got||now?n:"？？？"}</b><small>${got||now?acc+"・":""}${c}</small></div>`;}).join("")}</div>
  <p class="lv">まだ会っていない姿はシルエットで表示されます。今のそだち：${total()}　正解率：${Math.round(accRate()*100)}%　たいせん：${(P.vs||{}).w||0}勝　克服：${P.overcome||0}問　お世話達成：${careDays()}日</p>${st===4?`<button class="btn ghost" data-a="reborn">新しいたねから育て直す（ずかんは残る）</button>`:""}<button class="btn ghost" data-ev="preview">試験当日（12/2）の画面を先に見る</button>`;}
function info(){$("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">基準ごとのそだち</h2><div class="card">${ORDER.map(n=>`<div class="row"><span>${n}</span><span class="bar sm"><i style="width:${Math.min(100,(P.exp[n]||0)/40*100)}%"></i></span><span class="lv">${P.exp[n]||0}</span></div>`).join("")}</div>
  <p class="lv">ひとつの基準につき40でいっぱい。連結をたくさん育てると「グループちょぼ」になりやすいよ。</p><button class="btn ghost" data-a="reset">はじめからやり直す</button>`;}
function startQ(kind,n){let qs;if(kind==="rv"){const m=missList().filter(h=>!n||h.std===n).slice(0,5);if(!m.length)return homeP();qs=m.map(h=>Object.assign({},h.q,{std:h.std}));Q={kind,n,qs,k:0,ok:0,answered:false,last:null};return drawQ();}
  if(kind==="med"){const m=shuffle(P.miss).slice(0,3);qs=m.length?m.map(x=>({ty:"rev",q:x.q,ans:x.ans,why:x.why})):stageQs(focusStd()).slice(0,3);}
  else if(kind==="eat"){qs=nextPri(3).map(gameQ).filter(Boolean);if(qs.length<3)qs=qs.concat(stageQs(focusStd()).slice(0,3-qs.length));}
  else{qs=PORDER.filter(id=>stdOfId(id)===n&&!mastered(id)).slice(0,3).map(gameQ).filter(Boolean);qs=qs.concat(stageQs(n).slice(0,5-qs.length));}
  Q={kind,n,qs,k:0,ok:0,answered:false,last:null};drawQ();}
const acc=n=>{const s=P.stat[n];if(!s||!(s.ok+s.ng))return "まだ";return Math.round(s.ok/(s.ok+s.ng)*100)+"%";};
function chooseStd(){$("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">どのテーマをべんきょうする？</h2><div class="acts">${ORDER.map(n=>{const m=missList().filter(h=>h.std===n).length;return `<button class="act" data-std="${n}"><b>${n}</b><small>そだち ${P.exp[n]||0}・正解率 ${acc(n)}${m?"・まちがい "+m:""}</small></button>`;}).join("")}</div>`;}
function stdPage(n){const x=SETS.find(s=>s.n===n),w=WHY[n]||[],m=missList().filter(h=>h.std===n).length;const NUM="①②③④";
  $("#app").innerHTML=`<button class="link" data-a="study">← テーマ一覧</button><h2 class="px">${n}</h2>
  ${typeof STDREF!=="undefined"&&STDREF[n]?`<p class="lv">教科書：${STDREF[n]}</p>`:""}
  <div class="card"><p class="sec px">1　お話で筋をつかむ</p><p class="story">${strip(STORY[n]||"")}</p></div>
  ${x?`<div class="card"><p class="sec px">2　これだけは覚える</p>
  <p class="kv"><b>定義</b>${x.d}</p>
  ${w.map(([q,rs])=>`<p class="kv"><b>${q}？（理由は${rs.length}つ）</b>${rs.map((r,i)=>(rs.length>1?NUM[i]:"")+r).join("<br>")}</p>`).join("")}
  <p class="kv"><b>IFRSとの違い</b>${x.i}</p><p class="kv"><b>計算の型</b>${x.c}</p></div>`:""}
  <div class="card"><p class="sec px">3　ちょうせん</p><p class="lv">そだち ${P.exp[n]||0}／40　正解率 ${acc(n)}</p>
  <button class="btn" data-go5="${n}">5問ちょうせん（そだちが大きく増える）</button>
  ${m?`<button class="btn ghost" data-rvstd="${n}">このテーマのまちがいを復習（${m}問）</button>`:""}</div>`;window.scrollTo(0,0);}
function drawQ(){if(typeof REV!=="undefined")REV=[];const q=Q.qs[Q.k];const lab={eat:"ごはん",study:"べんきょう",med:"くすり",rv:"ふくしゅう",ck:"チェック帳"}[Q.kind];
  $("#app").innerHTML=`<div class="top"><button class="link" data-a="home">← やめる</button><span class="lv px">${lab}　${Q.k+1} / ${Q.qs.length}</span></div>
  <div class="mini">${petSVG()}</div><div class="card"><p class="qtype">${q.ty==="tf"?"正誤":q.ty==="rev"?"見直し":q.label||"問題"}・${q.std||Q.n||""}</p><p class="q">${q.q}</p>
  ${q.ty==="rev"?(Q.answered?"":`<button class="btn" data-rev>答えを見る</button>`)
  :q.ty==="tf"?`<div class="tf2"><button data-tf="1" class="${Q.answered?(q.ans?"opt ok":Q.last===true?"opt ng":""):""}">〇</button><button data-tf="0" class="${Q.answered?(!q.ans?"opt ok":Q.last===false?"opt ng":""):""}">×</button></div>`
  :`<div class="opts">${q.opts.map((o,j)=>`<button class="opt${Q.answered?(o===q.ans?" ok":Q.last===j?" ng":""):""}" data-mc="${j}">${o}</button>`).join("")}</div>`}
  ${Q.answered?`<div class="fb${Q.lastOk?"":" ng"}"><b>${q.ty==="rev"?"答え："+q.ans:Q.lastOk?"もぐもぐ、おいしい！":"うーん、ちがうみたい…"}</b><br>${q.why}${q.point&&q.point!==q.why?`<div class="ptx"><b>要点</b> ${q.point}</div>`:""}${q.ref?`<div class="refx">教科書：${q.ref}</div>`:""}${ckBtn(q)}</div><button class="btn" data-nextq>${Q.k===Q.qs.length-1?"おわる":"次へ"}</button>`:""}</div>`;}
function ansQ(ok,choice){if(Q.answered)return;const q=Q.qs[Q.k];Q.answered=true;Q.last=choice;Q.lastOk=ok;
  const sn=q.std||Q.n||focusStd();if(q.ty!=="rev")record(q,ok,sn,Q.kind);
  if(ok){Q.ok++;const n=Q.n||sn;if(ORDER.includes(n))P.exp[n]=Math.min(40,(P.exp[n]||0)+(Q.kind==="study"?3:Q.kind==="rv"?2:2));}
  else{P.miss=[{q:q.q,why:q.why,ans:q.ty==="tf"?(q.ans?"〇":"×"):q.ans},...P.miss.filter(m=>m.q!==q.q)].slice(0,40);}
  psave();drawQ();}
function endQ(){const tl=todayLog();
  if(Q.kind==="eat"){P.food=Math.min(4,P.food+Q.ok);tl.eat++;P.act.eat++;}
  if(Q.kind==="study"){P.mood=Math.min(4,P.mood+1);P.food=Math.min(4,P.food+1);tl.study++;P.act.study++;}
  if(Q.kind==="rv"||Q.kind==="ck"){P.food=Math.min(4,P.food+Math.ceil(Q.ok/2));P.mood=Math.min(4,P.mood+1);}
  if(Q.kind==="med"){P.sick=false;P.food=Math.max(P.food,2);P.hungryAt=null;}
  P.t=Date.now();psave();syncMe();const before=Q;Q=null;
  $("#app").innerHTML=`<div class="card center">${petSVG()}<p class="px big">${before.kind==="med"?"げんきになった！":before.ok+" / "+before.qs.length}</p><p>${before.kind==="eat"?"おなかが "+before.ok+" ふえた":before.kind==="study"?"かしこくなった！":before.kind==="rv"?"ふくしゅうでおなかとごきげんが上がった！ 2回つづけて正解すると、まちがいリストから消えるよ":"くすりが効いたみたい"}</p>${before.kind==="study"&&before.n?`<button class="btn ghost" data-std="${before.n}">${before.n}の解説にもどる</button>`:""}<button class="btn" data-a="home">もどる</button></div>`;}
/* --- あそぶ（60秒〇×） --- */
const REVMAP={};Object.entries(STAGEMAP).forEach(([n,ids])=>ids.forEach(id=>REVMAP[id]=n));
const TOPN={rev:"収益認識",pl:"包括利益・CF計算書",bs:"その他",asset:"減損",liab:"引当金",fin:"金融商品（有価証券）",emp:"退職給付",cons:"連結",ma:"企業結合",fx:"外貨換算"};
function petPool(){const p=[];
  ITEMS.filter(i=>i.type==="tf").forEach(i=>p.push({ty:"tf",q:strip(i.q),ans:i.tf,why:strip(i.why),std:REVMAP[i.id]||TOPN[i.topic]||"その他"}));
  ALLWHY.forEach(w=>{const r=pick(w.rs);p.push({ty:"tf",q:w.q+"？ → "+r,ans:true,why:r,std:w.n});const wr=pick(ALLWHY.filter(x=>x.q!==w.q)).rs[0];if(!w.rs.includes(wr))p.push({ty:"tf",q:w.q+"？ → "+wr,ans:false,why:"正しくは："+w.rs.join(" ／ "),std:w.n});});
  Object.keys(GLOSS).forEach(k=>{p.push({ty:"tf",q:"「"+k+"」＝"+GLOSS[k],ans:true,why:GLOSS[k],std:"用語"});const o=pick(Object.keys(GLOSS).filter(t=>t!==k));p.push({ty:"tf",q:"「"+k+"」＝"+GLOSS[o],ans:false,why:"正しくは："+GLOSS[k],std:"用語"});});
  return shuffle(p);}
function startPlay(){SP={pool:petPool(),k:0,score:0,combo:0,ok:0,ng:0,wrong:[],log:[],end:Date.now()+60000};drawSP();tickP();}
function tickP(){if(!SP)return;const left=Math.max(0,Math.ceil((SP.end-Date.now())/1000));const t=$("#tleft");if(t)t.textContent=left;if(left<=0)return endPlay();setTimeout(tickP,200);}
function drawSP(){const q=SP.pool[SP.k%SP.pool.length];$("#app").innerHTML=`<div class="top"><button class="link" data-a="home">← やめる</button><span class="lv px">${SP.combo>=3?SP.combo+" COMBO":""}</span></div><div class="timer"><span class="t px" id="tleft">${Math.ceil((SP.end-Date.now())/1000)}</span><span class="sc px">${SP.score}点</span></div><div class="card" id="spcard"><p class="q" style="min-height:120px">${q.q}</p><div class="tf2"><button data-sp="1">〇</button><button data-sp="0">×</button></div></div>`;}
function spA(v){if(!SP)return;const q=SP.pool[SP.k%SP.pool.length];const ok=v===q.ans;SP.log.push({q,mine:v,ok});record(q,ok,q.std,"play");if(ok){SP.combo++;SP.ok++;SP.score+=10*(1+Math.floor(SP.combo/5));}else{SP.combo=0;SP.ng++;SP.wrong.push(q);P.miss=[{q:q.q,why:q.why,ans:q.ans?"〇":"×"},...P.miss].slice(0,40);}SP.k++;drawSP();const c=$("#spcard");if(c)c.classList.add(ok?"flash-ok":"flash-ng");}
function endPlay(){const s=SP;SP=null;const tl=todayLog();P.mood=Math.min(4,P.mood+(s.score>=100?2:1));P.exp[focusStd()]=Math.min(40,(P.exp[focusStd()]||0)+Math.floor(s.ok/3));tl.play++;P.act.play++;const nb=s.score>P.best;if(nb)P.best=s.score;P.t=Date.now();psave();syncMe();
  $("#app").innerHTML=`<div class="card center">${petSVG()}<p class="px big">${s.score}点</p><p>${nb?"自己ベスト更新！":"自己ベスト "+P.best+"点"}　ごきげんが上がった！</p><button class="btn" data-a="home">もどる</button></div>${reviewList(s.log,"60秒チャレンジの問題")}`;}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.disabled)return;
  const a=b.dataset.a;
  if(a==="home"){homeP();window.scrollTo(0,0);return;}if(a==="info"){info();return;}
  if(a==="reset"){if(confirm("ちょぼを はじめから育て直しますか？")){P=fresh();psave();homeP();}return;}
  if(a==="eat"){startQ("eat",focusStd());return;}if(a==="study"){chooseStd();return;}if(a==="med"){startQ("med",null);return;}if(a==="play"){startPlay();return;}
  if(b.dataset.std){stdPage(b.dataset.std);return;}
  if(b.dataset.go5){startQ("study",b.dataset.go5);window.scrollTo(0,0);return;}
  if(b.dataset.rvstd){startQ("rv",b.dataset.rvstd);window.scrollTo(0,0);return;}
  if(a==="rv"){startQ("rv",null);window.scrollTo(0,0);return;}
  if(a==="rec"){recPage();window.scrollTo(0,0);return;}
  if(a==="dex"){dex();window.scrollTo(0,0);return;}
  if(a==="reborn"){if(confirm("今のちょぼとお別れして、新しいたねから育てますか？（ずかん・記録・まちがいリストは残ります）")){const keep={dex:P.dex,hist:P.hist,stat:P.stat,best:P.best,vs:P.vs,miss:P.miss,overcome:P.overcome,log:P.log,week:P.week};P=Object.assign(fresh(),keep);psave();syncMe();homeP();}return;}
  if(a==="plaza"){plaza();window.scrollTo(0,0);return;}
  if(a==="rank"){rank();window.scrollTo(0,0);return;}
  if(a==="vs"){vsLobby();window.scrollTo(0,0);return;}
  if(b.dataset.inv){invite(b.dataset.inv);return;}
  if(b.dataset.acc){acceptInv(b.dataset.acc,+b.dataset.seed);return;}
  if(a==="decl"){NET.room&&NET.room.presence({acc:null});NET.declined=b.dataset.peer;vsLobby();return;}
  if(b.dataset.vsa!==undefined&&BT){vsAnswer(b.dataset.vsa==="1");return;}
  if(a==="vsend"){endBattle(true);return;}
  if(b.dataset.tf&&Q){const v=b.dataset.tf==="1";ansQ(v===Q.qs[Q.k].ans,v);return;}
  if(b.dataset.mc&&Q){const j=+b.dataset.mc;ansQ(Q.qs[Q.k].opts[j]===Q.qs[Q.k].ans,j);return;}
  if(b.hasAttribute("data-rev")&&Q){Q.answered=true;Q.lastOk=true;drawQ();return;}
  if(b.hasAttribute("data-nextq")){if(Q.k===Q.qs.length-1)endQ();else{Q.k++;Q.answered=false;Q.last=null;drawQ();}window.scrollTo(0,0);return;}
  if(b.dataset.sp){spA(b.dataset.sp==="1");return;}
});


/* ===== 優先度つき出題・要点モード・進化条件・アカウント保存 ===== */
const T45X=["cons13","cons6","cons10","cons7","p_t2","ma5","p_t4","ma3","fx3","p_t9","fin1","fin3","p_t5","p_t6","p_t7","liab9","asset10","bs1","rev4","pl2","bs2"];
const T45=[...MUST.filter(id=>byIdG[id]&&byIdG[id].type==="theory"),...T45X];
const PORDER=[...TOP,...MUST2,...T45X.filter(id=>!MUST.includes(id))];
const SO_IDS=["emp3","emp4","emp5","c52-1","cx10","p_t7","t10","t11","t12"],ARO_IDS=["liab3","liab4","liab9","c52-2","p_c10","t8","t9"],LEASE_IDS=["asset6","asset10","cL","t46"],TAX_IDS=["tax1","tax2","tax3","ct1","ct2","p_t2","p_t3","p_c3","t37","t38","t39"];
function stdOfId(id){const i=byIdG[id];if(!i)return "その他";if(SO_IDS.includes(id))return "ストック・オプション";if(ARO_IDS.includes(id))return "資産除去債務";if(LEASE_IDS.includes(id))return "リース";if(TAX_IDS.includes(id))return "税効果会計";
  return {cons:"連結",rev:"収益認識",pl:"包括利益・CF計算書",asset:"減損",liab:"引当金",fin:"金融商品（有価証券）",emp:"退職給付",ma:"企業結合",fx:"外貨換算"}[i.topic]||"その他";}
const mastered=id=>{const h=P.hist[id];return h&&h.lastOk&&h.ok>0;};
function nextPri(n){const t=new Date().toDateString();return PORDER.filter(id=>!mastered(id)).slice(0,n);}
const refOf=id=>(typeof TEXREF!=="undefined"&&TEXREF[id])||"";
function gameQ(id){const i=byIdG[id];if(!i)return null;const std=stdOfId(id),ref=refOf(id),pt=strip(POINT[id]||"");
  if(i.type==="tf")return {id,ty:"tf",q:strip(i.q),ans:i.tf,why:strip(i.why),ref,std};
  if(i.type==="theory"){if(!pt)return null;const same=ITEMS.filter(x=>x.type==="theory"&&x.id!==id&&POINT[x.id]&&KIND[x.id]===KIND[id]).map(x=>strip(POINT[x.id]));const pool=same.length>=3?same:ITEMS.filter(x=>x.type==="theory"&&x.id!==id&&POINT[x.id]).map(x=>strip(POINT[x.id]));
    return {id,ty:"mc",label:"理論・"+(KIND[id]||""),q:"「"+strip(i.q)+"」の答えの要点はどれ？",opts:shuffle([pt,...shuffle(pool).slice(0,3)]),ans:pt,why:pt,ref,std};}
  if(i.type==="calc"){const f=i.fields[0];const u=f.unit||"";let opts;
    if(f.text){const others=ITEMS.filter(x=>x.type==="calc").flatMap(x=>x.fields).filter(g=>g.text&&g.ans!==f.ans).map(g=>g.ans);opts=shuffle([f.ans,...shuffle([...new Set(others)]).slice(0,3)]);}
    else{const a=f.ans;const dec=String(a).includes(".")?1:0;const rd=v=>dec?Math.round(v*10)/10:Math.round(v);const cand=[...i.fields.slice(1).map(g=>g.ans).filter(v=>typeof v==="number"&&v!==a),rd(a*1.25),rd(a*0.8),rd(a*2),rd(a/2),rd(a*1.1)].filter(v=>v!==a&&v>0);opts=shuffle([a,...[...new Set(cand)].slice(0,3)]).map(v=>v.toLocaleString()+u);}
    const ans=f.text?f.ans:f.ans.toLocaleString()+u;return {id,ty:"mc",label:"計算",q:strip(i.q)+"<br><b>「"+f.label+"」はいくら？</b>",opts:f.text?opts:opts,ans,why:strip(i.steps),ref,std};}
  return null;}
function focusStd(){const id=nextPri(1)[0];return id?stdOfId(id):ORDER[0];}
/* --- 進化の条件（勉強の成果と結びつける） --- */
const CONS_SET=[...new Set([...PORDER,...T45])].filter(id=>byIdG[id]&&byIdG[id].topic==="cons");
const allOk=ids=>ids.every(id=>mastered(id));
ADULTS.splice(0,ADULTS.length,
["パーフェクトちょぼ","虹の輪","必須ライン40問をすべて正解","special"],
["グループちょぼ","王冠","連結の必須・理論の問題（"+CONS_SET.length+"問）をすべて正解","special"],
["ものしりちょぼ","めがね","理論45問の要点をすべて言えた（要点モード）","special"],
["しょうぶちょぼ","チャンピオンベルト","たいせんで5勝以上","special"],
["ぜいこうかちょぼ","税のコイン","税効果会計の正解数が全体の4分の1以上","theme"],
["げんそんちょぼ","ばんそうこう","減損の正解数が全体の4分の1以上","theme"],
["ちょうろうちょぼ","白いおひげ","退職給付の正解数が全体の4分の1以上","theme"],
["きじゅつしちょぼ","星のぼうし","ストック・オプションの正解数が全体の4分の1以上","theme"],
["せかいちょぼ","地球のふうせん","外貨換算の正解数が全体の4分の1以上","theme"],
["がったいちょぼ","パズルのバッジ","企業結合の正解数が全体の4分の1以上","theme"],
["マーケットちょぼ","グラフのバッジ","金融商品の正解数が全体の4分の1以上","theme"],
["ふくしゅうちょぼ","チェックのノート","ふくしゅうでまちがいを30問克服","special"],
["だいすきちょぼ","ハートのアンテナ","「今日のお世話」を7日達成","special"],
["まなびちょぼ","えんぴつ","べんきょう中心に育てる","act"],
["はやわざちょぼ","スピード線","あそぶ（60秒〇×）中心に育てる","act"],
["ねばりちょぼ","はちまき","ごはん中心にこつこつ育てる","act"]);
BODY["まなびちょぼ"]="#E8F4FF";BODY["ものしりちょぼ"]="#F3EEDC";
const _ACC=ACC;ACC=function(t,r,cy){if(t==="まなびちょぼ")return `<g transform="rotate(35 ${100+r} ${cy})"><rect x="${100+r-4}" y="${cy-30}" width="9" height="40" rx="2" fill="#FFC93C" stroke="#C9971A" stroke-width="2"/><path d="M${100+r-4} ${cy+10} l4.5 10 4.5 -10z" fill="#F4D2B5" stroke="#C9971A" stroke-width="1.5"/><rect x="${100+r-4}" y="${cy-34}" width="9" height="6" rx="2" fill="#FF8FB1"/></g>`;return _ACC(t,r,cy);};
function decideType(){const tot=total()||1;
  if(allOk(MUST))return "パーフェクトちょぼ";
  if(CONS_SET.length&&allOk(CONS_SET))return "グループちょぼ";
  if(T45.every(id=>(P.t45||{})[id]))return "ものしりちょぼ";
  if(((P.vs||{}).w||0)>=5)return "しょうぶちょぼ";
  const st=P.stat||{},aok=Object.values(st).reduce((x,y)=>x+y.ok,0)||1;const tp=Object.keys(THEME_T).filter(n=>n!=="連結").map(n=>[n,(st[n]||{}).ok||0]).sort((x,y)=>y[1]-x[1])[0];
  if(tp&&tp[1]>=aok*0.25&&tp[1]>=20)return THEME_T[tp[0]];
  if((P.overcome||0)>=30)return "ふくしゅうちょぼ";
  if(careDays()>=7)return "だいすきちょぼ";
  const a=P.act;if(a.study>=a.eat&&a.study>=a.play)return "まなびちょぼ";if(a.play>a.eat)return "はやわざちょぼ";return "ねばりちょぼ";}
/* --- 理論の要点モード --- */
let TQ=null;
function startT45(ids,title){ids=ids.filter(id=>byIdG[id]);if(!ids.length)return homeP();TQ={ids,k:0,open:false,got:[],title};drawT45();window.scrollTo(0,0);}
function drawT45(){const id=TQ.ids[TQ.k],i=byIdG[id];const kw=i.kw||[];
  $("#app").innerHTML=`<div class="top"><button class="link" data-a="home">← やめる</button><span class="lv px">${TQ.title}　${TQ.k+1} / ${TQ.ids.length}</span></div>
  <div class="mini">${petSVG()}</div><div class="card"><p class="qtype">理論・${KIND[id]||""}・${stdOfId(id)}${(P.t45||{})[id]?"　✓言えた":""}</p><p class="q">${strip(i.q)}</p>
  ${TQ.open?`<div class="fb"><b>要点</b>　${strip(POINT[id]||"")}<div class="refx">教科書：${refOf(id)}</div></div>
  <details class="full"><summary>模範解答の全文</summary><p>${i.a}</p></details>
  <p class="lv" style="margin-top:10px">言えたキーワードをタップ（${TQ.got.length}/${kw.length}）</p><div class="kwr">${kw.map((k,n)=>`<button class="kwb${TQ.got.includes(n)?" on":""}" data-kw45="${n}">${k}</button>`).join("")}</div>
  <button class="btn" data-t45next>${TQ.k===TQ.ids.length-1?"おわる":"次へ"}</button>`
  :`<p class="lv">頭の中か声に出して答えてから開く</p><button class="btn" data-t45open>要点を見る</button>`}</div>`;}
function t45Next(){const id=TQ.ids[TQ.k],kw=(byIdG[id].kw||[]);const r=kw.length?TQ.got.length/kw.length:1;const ok=r>=0.5;
  P.t45=P.t45||{};if(ok)P.t45[id]=1;record({id,ty:"t45",q:strip(byIdG[id].q),ans:strip(POINT[id]||""),why:strip(POINT[id]||""),ref:refOf(id)},ok,stdOfId(id),"study");
  if(ok){const n=stdOfId(id);if(ORDER.includes(n))P.exp[n]=Math.min(40,(P.exp[n]||0)+3);}P.act.study++;psave();
  if(TQ.k===TQ.ids.length-1){const tl=todayLog();tl.study++;P.mood=Math.min(4,P.mood+1);psave();const done=TQ.ids.filter(x=>(P.t45||{})[x]).length;TQ=null;
    $("#app").innerHTML=`<div class="card center">${petSVG()}<p class="px big">${done} / ${T45.length}</p><p>理論45問のうち、要点を言えた問題の数</p><button class="btn" data-a="home">もどる</button></div>`;return;}
  TQ.k++;TQ.open=false;TQ.got=[];drawT45();window.scrollTo(0,0);}
function chooseStd(){const done=T45.filter(id=>(P.t45||{})[id]).length;const nxt=T45.filter(id=>!(P.t45||{})[id]).slice(0,5);
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">べんきょう</h2>
  <button class="act t45" data-t45go><b>理論の要点モード</b><small>理論45問から、まだ言えていない5問。言えた ${done}/${T45.length}</small></button>
  <h3 class="px" style="font-size:16px;margin:14px 0 8px">テーマを選ぶ</h3><div class="acts">${ORDER.map(n=>{const m=missList().filter(h=>h.std===n).length;const pr=PORDER.filter(id=>stdOfId(id)===n);const ok=pr.filter(mastered).length;return `<button class="act" data-std="${n}"><b>${n}</b><small>重要問題 ${ok}/${pr.length}・正解率 ${acc(n)}${m?"・まちがい "+m:""}</small></button>`;}).join("")}</div>`;}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.hasAttribute("data-t45go")){startT45(T45.filter(id=>!(P.t45||{})[id]).slice(0,5),"要点モード");return;}
  if(b.hasAttribute("data-t45open")&&TQ){TQ.open=true;drawT45();return;}
  if(b.dataset.kw45!==undefined&&TQ){const n=+b.dataset.kw45;TQ.got=TQ.got.includes(n)?TQ.got.filter(x=>x!==n):[...TQ.got,n];drawT45();return;}
  if(b.hasAttribute("data-t45next")&&TQ){t45Next();return;}
  if(b.dataset.t45std){startT45(T45.filter(id=>stdOfId(id)===b.dataset.t45std),"要点モード："+b.dataset.t45std);return;}
});
/* --- ホームの進み具合（必須ラインと理論45問） --- */
function petProgress(){const m=MUST.filter(mastered).length,t=T45.filter(id=>(P.t45||{})[id]).length,nx=nextPri(1)[0];
  return `<div class="card pp"><b>試験の準備</b><div class="row"><span>必須ライン</span><span class="bar sm"><i style="width:${m/MUST.length*100}%"></i></span><span class="lv">${m}/${MUST.length}</span></div><div class="row"><span>理論45問</span><span class="bar sm"><i style="width:${t/T45.length*100}%"></i></span><span class="lv">${t}/${T45.length}</span></div>${nx?`<p class="lv">次のごはん：${stdOfId(nx)}（${{theory:"理論",calc:"計算",tf:"正誤"}[byIdG[nx].type]}）</p>`:""}</div>`;}
/* --- アカウントへの保存 --- */
const GS={on:false,doc:null,busy:false,again:false,cloudProg:0,col:null};
/* 最初に決めたニックネームを、クラウドの読み込みが終わったあとにも必ず反映する */
function applyPendingNick(done){const v=typeof window!=="undefined"&&window.CHOBO_PENDING_NICK;if(!v)return;P.nick=String(v).slice(0,12);P.nickSet=true;psave();
  if(typeof NET!=="undefined"){NET.last="";try{syncMe();}catch(e){}}if(done)window.CHOBO_PENDING_NICK=null;}
function gsyncPush(){if(!GS.on||!GS.doc)return;
  /* 守り：アカウントに保存されている進み具合より、大きく少ない状態では上書きしない（読み込みの失敗や不具合から守る） */
  if(!P.allowShrink&&GS.cloudProg>20&&prog(P)<GS.cloudProg*0.5){console.warn("保存を見送りました（進み具合が急に減ったため）");return;}
  if(GS.busy){GS.again=true;return;}clearTimeout(GS.t);GS.t=setTimeout(async()=>{GS.busy=true;try{await GS.doc.set({s:JSON.stringify(P),upd:P.upd||Date.now()});GS.cloudProg=Math.max(GS.cloudProg,prog(P));if(P.allowShrink){delete P.allowShrink;}await dailyBackup();}catch(e){}GS.busy=false;if(GS.again){GS.again=false;gsyncPush();}},5000);}
const prog=x=>x?Object.values(x.exp||{}).reduce((a,b)=>a+b,0)+Object.keys(x.hist||{}).length+((x.act||{}).eat||0)+((x.act||{}).play||0)+((x.act||{}).study||0):0;
async function gsyncInit(){try{if(!window.claude||!window.claude.use)return;const db=await window.claude.use("db"),u=await window.claude.use("user");if(!db||!u)return;const id=await u.id();if(!id)return;
  /* 別のアカウントのデータを読み込まない（端末に別の人のちょぼが残っていたら、まっさらから始める） */
  if(P.owner&&P.owner!==id){P=migrateP(fresh());try{localStorage.setItem(PKEY,JSON.stringify(P));}catch(e){}homeP();}
  P.owner=id;
  GS.col=db.collection("data/users/"+id);GS.doc=GS.col.doc("chobo");const snap=await GS.doc.get();
  let take=false,R=null;if(snap&&snap.exists){const r=snap.data();try{R=JSON.parse(r.s);}catch(e){}
    if(R&&R.owner&&R.owner!==id)R=null;
    if(R){ GS.cloudProg=prog(R); if(!P.syncedAt) take=prog(R)>=prog(P); else take=(r.upd||0)>(P.upd||0); }}
  GS.on=true;
  if(take){P=migrateP(R);P.owner=id;P.syncedAt=Date.now();try{localStorage.setItem(PKEY,JSON.stringify(P));}catch(e){}if(typeof NET!=="undefined"){NET.last="";syncMe();}applyPendingNick(true);if(!Q&&!SP&&!TQ)homeP();return;}
  P.syncedAt=Date.now();psave();applyPendingNick(true);}catch(e){applyPendingNick(false);}}

/* 1日1回、その日の状態を控えとして保存（14日分） */
async function dailyBackup(){try{const d=new Date();const day=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  if(!GS.col||P.bkDay===day)return;await GS.col.doc("bk_"+day).set({s:JSON.stringify(P),upd:Date.now(),day});
  P.bkDay=day;P.bkList=[...(P.bkList||[]).filter(x=>x!==day),day].slice(-14);try{localStorage.setItem(PKEY,JSON.stringify(P));}catch(e){}}catch(e){}}

/* ===== 通信：ひろば・ランキング・たいせん ===== */
const NET={db:null,user:null,room:null,me:null,players:[],peers:[],myPeer:null,names:{},last:"",declined:null};
const curStage=()=>({st:stage(),name:STAGES[stage()][1],type:stage()===4?adultType():""});
async function initNet(){
  if(!window.claude||!window.claude.use)return;
  try{NET.user=await window.claude.use("user");}catch(e){}
  try{NET.db=await window.claude.use("db");}catch(e){}
  if(NET.user){try{NET.me=await NET.user.id();}catch(e){}}
  if(NET.db){try{NET.db.collection("players").onSnapshot(sn=>{NET.players=sn.docs.map(d=>Object.assign({id:d.id},d.data()));if(VIEW==="plaza")plaza();if(VIEW==="rank")rank();},()=>{});}catch(e){}}
  if(NET.db&&NET.me){let real=null,pend={};NET.room={presence:p=>{if(real)real.presence(p);else Object.assign(pend,p);},ensure:()=>{if(!real){real=dbRoom();real.presence(pend);}}};}
  syncMe();
}
async function syncMe(){if(!NET.db||!NET.me)return;const c=curStage();const doc={nick:(P.nick||"").slice(0,12),st:c.st,stage:c.name,type:c.type,total:total(),best:P.best||0,weekKey:(P.week&&P.week.k)||wk(),weekOk:(P.week&&P.week.k===wk())?P.week.ok:0};
  const js=JSON.stringify(doc);if(js===NET.last)return;NET.last=js;try{await NET.db.doc("players/"+NET.me).set(Object.assign(doc,{updatedAt:Date.now()}));}catch(e){NET.last="";}
  if(NET.room){try{NET.room.presence({st:c.st,type:c.type});}catch(e){}}}
const dispName=(p,nm)=>esc((p&&p.nick)||(nm&&nm.name)||"だれか");
async function nameOf(ids){if(!NET.user||!NET.user.profiles)return {};try{return await NET.user.profiles(ids.filter(Boolean));}catch(e){return {};}}
let VIEW="home";
const offline=t=>`<button class="link" data-a="home">← もどる</button><h2 class="px">${t}</h2><div class="card"><p>通信につながっていません。ネットにつながっているか確かめて、ページを開き直してください。</p></div>`;
async function plaza(){VIEW="plaza";if(!NET.db){$("#app").innerHTML=offline("ひろば");return;}
  const ps=[...NET.players].sort((a,b)=>(b.total||0)-(a.total||0));const nm=await nameOf(ps.map(p=>p.id));if(VIEW!=="plaza")return;
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">ひろば</h2><p class="lv">このゲームを開いた仲間のちょぼが集まっています。</p>${nickForm()}
  ${ps.length?`<div class="plaza">${ps.map(p=>`<div class="pc${p.id===NET.me?" me":""}">${petSVG({st:p.st||0,type:p.type||""})}<b>${dispName(p,nm[p.id])}${p.id===NET.me?"（あなた）":""}</b><small>${esc(p.stage||"")}${p.type?"・"+esc(p.type):""}<br>そだち ${p.total||0}</small></div>`).join("")}</div>`:`<div class="card"><p>まだだれもいません。お世話をすると、あなたのちょぼがここに来ます。</p></div>`}`;}
async function rank(){VIEW="rank";if(!NET.db){$("#app").innerHTML=offline("ランキング");return;}
  const w=wk();const best=[...NET.players].filter(p=>p.best).sort((a,b)=>b.best-a.best).slice(0,10);const week=[...NET.players].filter(p=>p.weekKey===w&&p.weekOk).sort((a,b)=>b.weekOk-a.weekOk).slice(0,10);
  const nm=await nameOf([...best,...week].map(p=>p.id));if(VIEW!=="rank")return;
  const li=(arr,f,u)=>arr.length?`<ol class="rk">${arr.map((p,i)=>`<li class="${p.id===NET.me?"me":""}"><span class="rn px">${i+1}</span><span>${dispName(p,nm[p.id])}</span><b class="px">${p[f]}${u}</b></li>`).join("")}</ol>`:`<p class="lv">まだ記録がありません</p>`;
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">ランキング</h2>
  <div class="card"><p class="sec px">60秒チャレンジ　自己ベスト</p>${li(best,"best","点")}</div>
  <div class="card"><p class="sec px">今週の正解数</p>${li(week,"weekOk","問")}<p class="lv">月曜日にリセットされます。</p></div>`;}
/* --- たいせん（同じ時間に開いている人と） --- */
let BT=null;
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function battleQs(seed){const r=rng(seed);const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const p=[];ITEMS.filter(i=>i.type==="tf").forEach(i=>p.push({q:strip(i.q),ans:i.tf,why:strip(i.why)}));
  ALLWHY.forEach((w,k)=>{const other=ALLWHY[(k*7+3)%ALLWHY.length];p.push({q:w.q+"？ → "+w.rs[0],ans:true,why:w.rs[0]});if(!w.rs.includes(other.rs[0]))p.push({q:w.q+"？ → "+other.rs[0],ans:false,why:"正しくは："+w.rs.join(" ／ ")});});
  return sh(p).slice(0,120);}
const lobbyPeers=()=>NET.peers.filter(p=>!p.sameTab&&p.kind==="viewer"&&p.presence&&p.presence.status);
function onPeersChange(){
  if(BT){const op=NET.peers.find(p=>p.peer===BT.opp);if(!op&&!BT.over){BT.oppGone=true;}renderBattle();return;}
  // inviter: accepted?
  if(NET.pendingInv){const ac=NET.peers.find(p=>p.presence&&p.presence.acc&&p.presence.acc.to===NET.myPeer&&p.presence.acc.seed===NET.pendingInv.seed);if(ac){startBattle(NET.pendingInv.seed,ac.peer);return;}}
  if(VIEW==="vs")vsLobby();
  else{const inv=incoming();if(inv&&VIEW==="home"){const el=$("#invbar");if(!el){const d=document.createElement("div");d.id="invbar";d.className="invbar";d.innerHTML=`たいせんの申しこみが来ています　<button class="btn" data-a="vs">見る</button>`;document.body.appendChild(d);}}}
}
function incoming(){return lobbyPeers().find(p=>p.presence.inv&&p.presence.inv.to===NET.myPeer&&Date.now()-(p.presence.inv.at||0)<120000&&p.peer!==NET.declined);}
async function vsLobby(){VIEW="vs";if(NET.room&&NET.room.ensure)NET.room.ensure();const ib=$("#invbar");if(ib)ib.remove();if(!NET.room){$("#app").innerHTML=offline("たいせん");return;}
  const ps=lobbyPeers();const ids=ps.map(p=>p.by||p.presence.id);const nm=await nameOf(ids);if(VIEW!=="vs"||BT)return;
  const nmOf=p=>dispName(p.presence,nm[p.by||p.presence.id]);const inv=incoming();
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">たいせん</h2><p class="lv">いま「たいせん」の画面を開いている人と、同じ順番の〇×で60秒勝負します。60秒で正解した数が多いほうの勝ち（同点なら、まちがいが少ないほう）。</p>
  ${inv?`<div class="card inv"><p><b>${nmOf(inv)}</b> さんから申しこみが来ています</p><button class="btn" data-acc="${inv.peer}" data-seed="${inv.presence.inv.seed}">受けて立つ</button><button class="btn ghost" data-a="decl" data-peer="${inv.peer}">ことわる</button></div>`:""}
  ${NET.pendingInv?`<div class="card"><p>申しこみ中…　相手が受けると始まります</p></div>`:""}
  <div class="card"><p class="sec px">いま開いている人</p>${ps.length?ps.map(p=>`<div class="peer">${petSVG({st:p.presence.st||0,type:p.presence.type||""})}<span>${nmOf(p)}<br><small class="lv">${p.presence.status==="battle"?"たいせん中":"まちあわせ中"}</small></span>${p.presence.status==="lobby"?`<button class="btn sm" data-inv="${p.peer}">申しこむ</button>`:""}</div>`).join(""):`<p class="lv">いまは誰もいません。仲間に「今から対戦しよう」と声をかけて、同じ時間に開いてもらってください。</p>`}</div>`;}
function invite(peer){const seed=Math.floor(Math.random()*1e9);NET.pendingInv={to:peer,seed};NET.room.presence({inv:{to:peer,seed,at:Date.now()}});vsLobby();}
function acceptInv(peer,seed){NET.room.presence({acc:{to:peer,seed},inv:null});startBattle(seed,peer);}
function startBattle(seed,opp){NET.pendingInv=null;const now=Date.now();BT={seed,opp,qs:battleQs(seed),k:0,score:0,ng:0,done:false,over:false,go:now+3000,end:now+63000,flash:null,log:[]};VIEW="battle";
  NET.room.presence({status:"battle",inv:null,bt:{seed,k:0,score:0,ng:0,done:false,opp}});renderBattle();tickBattle();}
function tickBattle(){if(!BT||BT.over)return;const now=Date.now();
  if(!BT.done&&now>=BT.end){BT.done=true;NET.room.presence({bt:{seed:BT.seed,k:BT.k,score:BT.score,ng:BT.ng,done:true,opp:BT.opp}});renderBattle();if(!BT||BT.over)return;}
  const t=document.getElementById("vst");if(t)t.textContent=now<BT.go?Math.ceil((BT.go-now)/1000):Math.max(0,Math.ceil((BT.end-now)/1000));
  if(now<BT.go+200&&now>=BT.go&&!BT._started){BT._started=true;renderBattle();}
  setTimeout(tickBattle,200);}
function oppState(){const op=NET.peers.find(p=>p.peer===BT.opp);return op&&op.presence&&op.presence.bt&&op.presence.bt.seed===BT.seed?op.presence.bt:null;}
function renderBattle(){if(!BT)return;const o=oppState();
  if(BT.done&&(BT.oppGone||(o&&o.done))&&!BT.over)return endBattle(false);
  if(BT.over)return;const now=Date.now();
  if(now<BT.go){$("#app").innerHTML=`<div class="card center"><p class="lv">たいせん開始まで</p><p class="px big" id="vst">${Math.ceil((BT.go-now)/1000)}</p><p class="lv">60秒で正解した数が多いほうの勝ち</p></div>`;return;}
  const q=BT.qs[BT.k%BT.qs.length];
  $("#app").innerHTML=`<div class="timer"><span class="t px" id="vst">${Math.max(0,Math.ceil((BT.end-now)/1000))}</span><span class="lv">${BT.oppGone?"相手がいなくなりました":""}</span></div>
  <div class="vsbar"><div><small>あなた</small><b class="px">${BT.score}</b><small>まちがい ${BT.ng}</small></div><div><small>あいて</small><b class="px">${o?o.score:0}</b><small>${o&&o.done?"おわり":"とき中…"}</small></div></div>
  ${BT.done?`<div class="card center"><p>60秒おわり！ 相手を待っています…</p>${BT.oppGone?`<button class="btn" data-a="vsend">結果を見る</button>`:""}</div>`
  :`<div class="card ${BT.flash==="ok"?"flash-ok":BT.flash==="ng"?"flash-ng":""}"><p class="q" style="min-height:110px">${q.q}</p><div class="tf2"><button data-vsa="1">〇</button><button data-vsa="0">×</button></div></div>`}`;}
let vsLastWrite=0;
function vsAnswer(v){if(!BT||BT.done||Date.now()<BT.go)return;const q=BT.qs[BT.k%BT.qs.length];const ok=v===q.ans;
  BT.log.push({q:{ty:"tf",q:q.q,ans:q.ans,why:q.why},mine:v,ok});
  if(ok)BT.score++;else{BT.ng++;P.miss=[{q:q.q,why:q.why,ans:q.ans?"〇":"×"},...P.miss].slice(0,40);}
  record({ty:"tf",q:q.q,ans:q.ans,why:q.why},ok,"たいせん","vs");BT.k++;BT.flash=ok?"ok":"ng";BT.answered=null;
  const now=Date.now();if(now-vsLastWrite>700){vsLastWrite=now;NET.room.presence({bt:{seed:BT.seed,k:BT.k,score:BT.score,ng:BT.ng,done:false,opp:BT.opp}});}
  renderBattle();}
function endBattle(force){if(!BT||BT.over)return;BT.over=true;const o=oppState();const os=o?o.score:0,ong=o?(o.ng||0):0;
  let res;if(BT.oppGone&&!(o&&o.done))res="win";else if(BT.score!==os)res=BT.score>os?"win":"lose";else if(BT.ng!==ong)res=BT.ng<ong?"win":"lose";else res="draw";
  if(res==="win"){P.mood=Math.min(4,P.mood+2);const f=focusStd();if(ORDER.includes(f))P.exp[f]=Math.min(40,(P.exp[f]||0)+3);}else{P.mood=Math.min(4,P.mood+1);}
  P.vs=P.vs||{w:0,l:0,d:0};if(res==="win")P.vs.w++;else if(res==="lose")P.vs.l++;else P.vs.d=(P.vs.d||0)+1;psave();syncMe();
  NET.room.presence({status:"lobby",bt:null,acc:null,inv:null});const s=BT.score,ng=BT.ng,blog=BT.log;BT=null;VIEW="res";
  $("#app").innerHTML=`<div class="card center">${petSVG()}<p class="px big">${res==="win"?"かち！":res==="lose"?"まけ…":"ひきわけ"}</p><p>60秒で正解　あなた ${s}問　あいて ${os}問</p><p class="lv">まちがい　あなた ${ng}　あいて ${ong}${BT===null&&s===os?"（同点のときは、まちがいが少ないほうの勝ち）":""}</p><p class="lv">通算 ${P.vs.w}勝 ${P.vs.l}敗${P.vs.d?" "+P.vs.d+"分":""}　ごきげんが上がった！</p><button class="btn" data-a="vs">もう一度たいせん</button><button class="btn ghost" data-a="home">ホームへ</button></div>${reviewList(blog,"たいせんの問題")}`;}
function nickForm(){return `<div class="card nick"><p class="sec px">ニックネーム</p><div class="nrow"><input id="nickin" maxlength="12" placeholder="例：ちょぼ使い" value="${esc(P.nick||"")}"><button class="btn sm" data-a="nicksave">保存</button></div><p class="lv">ひろば・ランキング・たいせんで、この名前が表示されます（12文字まで）。設定しないと、管理人が登録した名前で表示されます。</p></div>`;}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.dataset.a!=="nicksave")return;const v=(document.getElementById("nickin")||{}).value||"";P.nick=v.trim().slice(0,12);psave();NET.last="";syncMe();if(NET.room){try{NET.room.presence({nick:P.nick});}catch(e){}}plaza();},true);

/* ===== データ保存の仕組みで動くロビー（ライブ機能を使わない） ===== */
function dbRoom(){const me=NET.me;let mine={id:me,nick:(P.nick||"").slice(0,12),st:stage(),type:stage()===4?adultType():"",status:"lobby",inv:null,acc:null,bt:null,lastSeen:Date.now()};
  let busy=false,again=false;const ref=NET.db.doc("bt/"+me);
  const write=async()=>{if(busy){again=true;return;}busy=true;try{mine.lastSeen=Date.now();await ref.set(mine);}catch(e){}busy=false;if(again){again=false;write();}};
  const room={presence:p=>{Object.assign(mine,p);write();}};
  write();setInterval(()=>{if(document.visibilityState!=="hidden"&&(VIEW==="vs"||VIEW==="battle"))write();},45000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")write();});
  NET.myPeer=me;
  try{NET.db.collection("bt").onSnapshot(sn=>{const now=Date.now();
    NET.peers=sn.docs.map(d=>{const v=d.data();return {peer:d.id,by:d.id,sameTab:d.id===me,isMe:d.id===me,kind:"viewer",presence:v};}).filter(p=>p.sameTab||now-(p.presence.lastSeen||0)<110000);
    onPeersChange();},()=>{});}catch(e){}
  setInterval(()=>{const now=Date.now();const before=NET.peers.length;NET.peers=NET.peers.filter(p=>p.sameTab||now-(p.presence.lastSeen||0)<110000);if(NET.peers.length!==before)onPeersChange();},15000);
  return room;}

/* ===== 解説の振り返りと、チェック帳 ===== */
let REV=[];
const ckKey=q=>q.id||q.q;
const isCk=q=>!!(P.checks||{})[ckKey(q)];
function ckBtn(q){const k=REV.length;REV.push(q);return `<button class="ckb${isCk(q)?" on":""}" data-ck="${k}">${isCk(q)?"★ チェック済み":"☆ チェックする"}</button>`;}
function reviewList(log,title){if(!log||!log.length)return "";const ok=log.filter(x=>x.ok).length;
  return `<div class="card rvl"><p class="sec px">${title}の解説（${log.length}問・正解${ok}）</p><p class="lv">見直したい問題は ☆ を押すと、チェック帳にたまります。</p>
  ${log.map((x,i)=>{const q=x.q;const ans=q.ty==="tf"?(q.ans?"〇":"×"):q.ans;const mine=q.ty==="tf"?(x.mine?"〇":"×"):x.mine;
    return `<div class="rvi ${x.ok?"ok":"ng"}"><div class="rvh"><span class="rvm">${x.ok?"〇 正解":"× まちがい"}</span><span class="lv">${i+1}</span></div><p class="rvq">${q.q}</p><p class="rva">答え：<b>${ans}</b>${x.ok?"":"　あなた："+mine}</p><p class="rvw">${q.why||""}</p>${q.ref?`<div class="refx">教科書：${q.ref}</div>`:""}${ckBtn(q)}</div>`;}).join("")}</div>`;}
function ckPage(){const items=Object.values(P.checks||{}).sort((a,b)=>b.t-a.t);REV=[];
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">チェック帳</h2><p class="lv">解説を見ながら ☆ を押した問題がたまっています（${items.length}問）。</p>
  ${items.length?`<button class="btn" data-a="cksolve">チェックした問題を解き直す（${Math.min(10,items.length)}問）</button>`:""}
  ${items.length?items.map(c=>{const q=c.q;const ans=q.ty==="tf"?(q.ans?"〇":"×"):q.ans;return `<div class="card rvi"><div class="rvh"><span class="lv">${new Date(c.t).toLocaleDateString()}・${c.from||""}</span><span class="lv">解き直し ${c.n||0}回</span></div><p class="rvq">${q.q}</p><p class="rva">答え：<b>${ans}</b></p><p class="rvw">${q.why||""}</p>${q.ref?`<div class="refx">教科書：${q.ref}</div>`:""}${ckBtn(q)}</div>`;}).join(""):`<div class="card"><p>まだありません。あそぶ・たいせんの結果や、問題の解説の ☆ から追加できます。</p></div>`}`;}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.ck!==undefined){const q=REV[+b.dataset.ck];if(!q)return;P.checks=P.checks||{};const k=ckKey(q);
    if(P.checks[k]){delete P.checks[k];}else{P.checks[k]={q:{id:q.id,ty:q.ty,q:q.q,ans:q.ans,why:q.why,opts:q.opts,label:q.label,ref:q.ref,std:q.std},t:Date.now(),n:0,from:VIEW==="res"?"たいせん":SP===null&&Q===null?"60秒チャレンジ":Q?{eat:"ごはん",study:"べんきょう",rv:"ふくしゅう",med:"くすり",ck:"チェック帳"}[Q.kind]:""};}
    psave();const on=!!P.checks[k];document.querySelectorAll(`[data-ck]`).forEach(x=>{const qq=REV[+x.dataset.ck];if(qq&&ckKey(qq)===k){x.classList.toggle("on",on);x.textContent=on?"★ チェック済み":"☆ チェックする";}});e.stopPropagation();return;}
  if(b.dataset.a==="ck"){ckPage();window.scrollTo(0,0);return;}
  if(b.dataset.a==="cksolve"){const items=Object.values(P.checks||{}).sort((a,b)=>(a.n||0)-(b.n||0)||b.t-a.t).slice(0,10);const qs=items.map(c=>Object.assign({},c.q));items.forEach(c=>c.n=(c.n||0)+1);psave();
    Q={kind:"ck",n:null,qs,k:0,ok:0,answered:false,last:null};drawQ();window.scrollTo(0,0);return;}
},true);

/* ===== 先生ちょぼの模試（おとな限定）と、試験当日のイベント ===== */
const MOCK_STDS=["連結","税効果会計","企業結合","外貨換算","金融商品（有価証券）","減損","退職給付","ストック・オプション","資産除去債務","リース","収益認識","包括利益・CF計算書"];
const MOCK_MIN=25;
function mockSet(std){
  const th=ITEMS.filter(i=>i.type==="theory"&&stdOfId(i.id)===std&&POINT[i.id]);
  const order=id=>{const k=PORDER.indexOf(id);return k<0?999:k;};
  const thSorted=th.sort((a,b)=>(mastered(a.id)?1:0)-(mastered(b.id)?1:0)||order(a.id)-order(b.id)||Math.random()-.5);
  const pickT=[];for(const i of thSorted){if(pickT.length>=2)break;if(!pickT.some(x=>KIND[x.id]===KIND[i.id])||thSorted.length<=3)pickT.push(i);}
  for(const i of thSorted){if(pickT.length>=2)break;if(!pickT.includes(i))pickT.push(i);}
  const cs=ITEMS.filter(i=>i.type==="calc"&&stdOfId(i.id)===std);
  const c=shuffle(cs.filter(i=>!mastered(i.id))).concat(shuffle(cs))[0];
  return [...pickT.map(i=>({id:i.id,kind:"t"})),...(c?[{id:c.id,kind:"c"}]:[])];}
let MK=null;
function mockStart(std){if(std==="auto")std=shuffle(MOCK_STDS.slice(0,5))[0];const qs=mockSet(std);if(!qs.length)return;
  MK={std,qs,k:0,open:false,got:[],grade:null,scores:[],start:Date.now(),end:Date.now()+MOCK_MIN*60000};drawMock();window.scrollTo(0,0);mockTick();}
function mockTick(){if(!MK)return;const el=document.getElementById("mkt");if(el){const s=Math.max(0,Math.round((MK.end-Date.now())/1000));el.textContent=s>0?`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`:"時間切れ";el.classList.toggle("late",s<=0);}setTimeout(mockTick,1000);}
function mockHome(){const st=stage();if(st<4){$("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><div class="card center">${petSVG()}<p>模試は、おとなちょぼになると先生として出してくれます。</p></div>`;return;}
  const hist=(P.mock||[]).slice(-6).reverse();const best=(P.mock||[]).reduce((a,m)=>Math.max(a,m.score),0);
  $("#app").innerHTML=`<button class="link" data-a="home">← もどる</button><h2 class="px">先生ちょぼの模試</h2>
  <div class="card"><div class="mini">${petSVG()}</div><p>本番と同じ形で、1つの基準について<b>理論2問＋計算1問</b>（大問1つ分）を出します。目安は${MOCK_MIN}分。理論は紙に答案を書いてから、計算は紙と電卓で解いてから答えを見てください。</p><p class="lv">配点：理論は言えたキーワードの割合で各10点、計算は〇10点・△5点。30点満点。</p></div>
  <button class="act mk" data-mock="auto"><b>おまかせ（本命・対抗から）</b><small>連結・税効果・企業結合・外貨・金融商品のどれか</small></button>
  <h3 class="px" style="font-size:16px;margin:14px 0 8px">基準を選ぶ</h3><div class="acts">${MOCK_STDS.map(n=>`<button class="act" data-mock="${n}"><b>${n}</b><small>${(P.mock||[]).filter(m=>m.std===n).length?"最高 "+Math.max(...(P.mock||[]).filter(m=>m.std===n).map(m=>m.score))+"点":"まだ"}</small></button>`).join("")}</div>
  ${hist.length?`<div class="card"><b>これまでの模試</b>（最高 ${best}点）<ul class="todo">${hist.map(m=>`<li>${new Date(m.t).toLocaleDateString()}　${m.std}　<b>${m.score}点</b>　<small class="lv">${m.min}分</small></li>`).join("")}</ul></div>`:""}`;}
function drawMock(){const q=MK.qs[MK.k],i=byIdG[q.id];const no=["問1","問2","問3"][MK.k];
  let body="";
  if(q.kind==="t"){const kw=i.kw||[];
    body=`<p class="qtype">${no}　理論・${KIND[q.id]||""}</p><p class="q">${strip(i.q)}</p>${MK.open?`<div class="fb"><b>要点</b>　${strip(POINT[q.id]||"")}<div class="refx">教科書：${refOf(q.id)}</div></div><details class="full" open><summary>模範解答</summary><p>${i.a}</p></details>
      <p class="lv" style="margin-top:10px">答案に書けたキーワードをタップ（${MK.got.length}/${kw.length}）</p><div class="kwr">${kw.map((k,n)=>`<button class="kwb${MK.got.includes(n)?" on":""}" data-mkw="${n}">${k}</button>`).join("")}</div><button class="btn" data-mnext>${MK.k===MK.qs.length-1?"採点する":"次の問題へ"}</button>`
      :`<p class="lv">紙に答案を書いてから開く</p><button class="btn" data-mopen>答えを見る</button>`}`;}
  else{body=`<p class="qtype">${no}　計算</p><p class="q" style="font-weight:400">${i.q}</p>${MK.open?`<div class="fb"><b>答え</b><br>${i.fields.map(f=>`${f.label}　<b>${f.text?f.ans:f.ans.toLocaleString()}${f.unit||""}</b>`).join("<br>")}<div class="ptx">${i.steps}</div><div class="refx">教科書：${refOf(q.id)}</div></div>
      <p class="lv" style="margin-top:10px">自分の答えを採点</p><div class="tf2 three">${[["o","〇 全部正解"],["d","△ 一部"],["x","× ちがう"]].map(([g,l])=>`<button class="${MK.grade===g?"opt ok":""}" data-mg="${g}">${l}</button>`).join("")}</div><button class="btn" data-mnext ${MK.grade?"":"disabled"}>採点する</button>`
      :`<p class="lv">紙と電卓で解いてから開く</p><button class="btn" data-mopen>答えを見る</button>`}`;}
  $("#app").innerHTML=`<div class="top"><button class="link" data-mquit>← やめる</button><span class="lv px">模試：${MK.std}　<span id="mkt" class="mkt"></span></span></div><div class="mini">${petSVG()}</div><div class="card">${body}</div>`;}
function mockNext(){const q=MK.qs[MK.k],i=byIdG[q.id];let sc;
  if(q.kind==="t"){const kw=i.kw||[];sc=kw.length?Math.round(MK.got.length/kw.length*10):0;const ok=sc>=5;P.t45=P.t45||{};if(ok&&T45.includes(q.id))P.t45[q.id]=1;record({id:q.id,ty:"t45",q:strip(i.q),ans:strip(POINT[q.id]||""),why:strip(POINT[q.id]||""),ref:refOf(q.id)},ok,MK.std,"mock");}
  else{sc=MK.grade==="o"?10:MK.grade==="d"?5:0;record({id:q.id,ty:"mc",q:strip(i.q),ans:"",why:strip(i.steps),ref:refOf(q.id)},MK.grade==="o",MK.std,"mock");}
  MK.scores.push(sc);
  if(MK.k===MK.qs.length-1)return mockResult();MK.k++;MK.open=false;MK.got=[];MK.grade=null;drawMock();window.scrollTo(0,0);}
function mockResult(){const total=MK.scores.reduce((a,b)=>a+b,0),max=MK.qs.length*10,min=Math.max(1,Math.round((Date.now()-MK.start)/60000));
  P.mock=P.mock||[];P.mock.push({t:Date.now(),std:MK.std,score:Math.round(total/max*30),min});P.mood=Math.min(4,P.mood+2);P.act.study++;const f=MK.std;if(ORDER.includes(f))P.exp[f]=Math.min(40,(P.exp[f]||0)+4);todayLog().study++;psave();
  const pct=total/max;const msg=pct>=0.8?"すばらしい！ 本番でもこの調子でいこう。":pct>=0.5?"半分以上とれたね。キーワードが抜けた所を、もう一度だけ見直そう。":"まずは要点の1行が言えるように。解説の太字を覚えよう。";
  const s=MK;MK=null;
  $("#app").innerHTML=`<div class="card center">${petSVG()}<p class="lv">先生ちょぼの採点</p><p class="px big">${Math.round(total/max*30)} / 30点</p>
  <ul class="todo" style="text-align:left">${s.qs.map((q,k)=>`<li>${["問1","問2","問3"][k]}　${q.kind==="t"?"理論":"計算"}　<b>${s.scores[k]} / 10</b><br><small class="lv">${strip(byIdG[q.id].q).slice(0,40)}…</small></li>`).join("")}</ul>
  <p>${msg}</p><p class="lv">かかった時間：${min}分（目安${MOCK_MIN}分）</p><button class="btn" data-a="mock">もう一度</button><button class="btn ghost" data-a="home">ホームへ</button></div>`;}
/* --- 試験当日のイベント --- */
const EXAM_DAY="2026-12-02";
const ymd=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
let EV=null;
function examEvent(preview){EV={i:-1,preview};const st=stage();
  $("#app").innerHTML=`<div class="exam"><div class="confetti" aria-hidden="true">${Array.from({length:24},(_,k)=>`<i style="left:${(k*41)%100}%;animation-delay:${(k%8)*0.35}s;background:${["#FF6B8B","#FFB830","#33C1A5","#4DB6E8","#9B7BF0"][k%5]}"></i>`).join("")}</div>
  <p class="px" style="color:var(--hp);font-size:15px;margin:0">${preview?"（当日の画面を先に見ています）":"12月2日　財務諸表論"}</p><h1 class="px big" style="margin:6px 0">きょうは本番！</h1>
  <div class="room exroom"><div class="bubble">${P.nick?P.nick+"、":""}ここまでいっしょに${Object.keys(P.hist||{}).length}問も解いてきたよ。最後に、最低限セットをいっしょに見直そう！</div>${petSVG()}<div class="hissho px">必勝</div></div>
  <button class="btn" data-ev="start">最低限セットを見直す（13基準・約10分）</button>
  <div class="card"><b>答案の書き方の合図</b><ul class="todo"><li>問われた要素ごとに①②と番号をふる</li><li>結論（定義・要件）を先に、理由はあとに</li><li>書けなくても、キーワードは必ず書く</li><li>計算は、余白に図（タイムテーブル・T字）を書いてから</li><li>端数・単位・年数・税率の指示に線を引く</li></ul></div>
  <button class="btn ghost" data-a="home">ホームへ</button></div>`;
  if(!preview){P.examSeen=EXAM_DAY;psave();}}
function evCard(){const x=SETS[EV.i];const w=(WHY[x.n]||[])[0];
  $("#app").innerHTML=`<div class="top"><button class="link" data-ev="back">← もどる</button><span class="lv px">${EV.i+1} / ${SETS.length}</span></div><div class="mini">${petSVG()}</div>
  <div class="card"><p class="sec px">${x.n}</p><p class="kv"><b>定義</b>${x.d}</p>${w?`<p class="kv"><b>${w[0]}？（理由は${w[1].length}つ）</b>${w[1].map((r,k)=>(w[1].length>1?"①②③④"[k]:"")+r).join("<br>")}</p>`:""}<p class="kv"><b>IFRSとの違い</b>${x.i}</p><p class="kv"><b>計算の型</b>${x.c}</p></div>
  <button class="btn" data-ev="next">${EV.i===SETS.length-1?"おわり":"次へ"}</button>`;window.scrollTo(0,0);}
function evDone(){$("#app").innerHTML=`<div class="exam"><div class="room exroom"><div class="bubble">ぜんぶ見直せたね！ あとは落ち着いて、書けることから書こう。いってらっしゃい！</div>${petSVG()}<div class="hissho px">必勝</div></div><button class="btn" data-a="home">ホームへ</button></div>`;}
function homeExtras(){const d=ymd();const acts=document.querySelector(".acts");
  if(acts&&stage()===4&&!acts.querySelector("[data-a='mock']")){const b=document.createElement("button");b.className="act mk";b.dataset.a="mock";b.innerHTML="<b>先生の模試</b><small>大問1つ分（理論2＋計算1）</small>";acts.appendChild(b);}
  const top=document.querySelector(".room");if(!top||document.getElementById("daycard"))return;let msg="";
  if(d==="2026-12-01")msg="明日はいよいよ本番。今日は新しいことはせず、まちがいリストと最低限セットだけにしよう。早めに寝てね。";
  else if(d===EXAM_DAY)msg="きょうは本番！ <button class='linkbtn' data-ev='open'>当日の画面をひらく</button>";
  else if(d>EXAM_DAY)msg="財務諸表論の試験、おつかれさま！ 次の試験もいっしょにがんばろう。";
  if(msg){const c=document.createElement("div");c.id="daycard";c.className="card daycard";c.innerHTML=msg;top.after(c);}}
let INTRO_DONE=false;
/* ぼーっと：半目で少し上を見る（上の空） */
function dazeFace(svg){const NS="http://www.w3.org/2000/svg";const eyes=[...svg.querySelectorAll(".eye")];if(eyes.length<2)return null;
  const bodies=[...svg.querySelectorAll("ellipse")].filter(e=>!/rgba/.test(e.getAttribute("fill")||""));const body=bodies.sort((a,b)=>(+b.getAttribute("rx"))-(+a.getAttribute("rx")))[0];const skin=body?body.getAttribute("fill"):"#F7E3B0";
  const added=[],old=[];
  eyes.forEach(e=>{const x=+e.getAttribute("cx"),y0=+e.getAttribute("cy"),r=+e.getAttribute("r");old.push([e,y0]);const y=y0-r*0.35;e.setAttribute("cy",y);
    const lid=document.createElementNS(NS,"path");lid.setAttribute("d",`M${x-r*1.7} ${y-r*0.15} Q${x} ${y-r*1.15} ${x+r*1.7} ${y-r*0.15} L${x+r*1.7} ${y-r*2} L${x-r*1.7} ${y-r*2} Z`);lid.setAttribute("fill",skin);
    const ln=document.createElementNS(NS,"path");ln.setAttribute("d",`M${x-r*1.55} ${y-r*0.2} Q${x} ${y-r*0.95} ${x+r*1.55} ${y-r*0.2}`);ln.setAttribute("stroke","#1B2238");ln.setAttribute("stroke-width",Math.max(1.6,r*0.32));ln.setAttribute("fill","none");ln.setAttribute("stroke-linecap","round");
    e.after(lid);lid.after(ln);added.push(lid,ln);});
  const mouth=[...svg.querySelectorAll("path")].find(p=>p.getAttribute("stroke")==="#1B2238"&&!added.includes(p));let md=null;
  if(mouth){md=mouth.getAttribute("d");const g=md.match(/M(\S+) (\S+) Q(\S+) (\S+) (\S+) (\S+)/);if(g)mouth.setAttribute("d",`M${g[1]} ${g[2]} Q${g[3]} ${(+g[2]+ +g[4])/2+1} ${g[5]} ${g[6]}`);}
  return ()=>{added.forEach(n=>n.remove());old.forEach(([e,y])=>e.setAttribute("cy",y));if(mouth&&md)mouth.setAttribute("d",md);};}
function intro(){const room=document.querySelector(".room");if(!room)return;const pet=room.querySelector(".pet");if(!pet)return;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const now=Date.now();if(Math.random()>0.3||now-(P.lastIntro||0)<4*3600e3)return;P.lastIntro=now;psave();
  const nk=P.nick?P.nick+"、":"";
  const pats=[["peek",["あ、"+nk+"来てくれたんだ！","…ひょっこり。今日もやる？"]],["daze",["あっ！ "+nk+"来てたんだ！","はっ…！ ぼーっとしてた！"]],["doze",["はっ…！ ねてないよ！","むにゃ…あ、"+nk+"おはよう！"]]];
  const [k,msgs]=pats[Math.floor(Math.random()*pats.length)];const msg=msgs[Math.floor(Math.random()*msgs.length)];
  room.classList.add("intro","intro-"+k);const fx=document.createElement("div");fx.className="introfx";room.appendChild(fx);
  const ib=document.createElement("div");ib.className="bubble ibubble";ib.textContent=msg;room.appendChild(ib);
  if(k==="doze")fx.innerHTML='<span class="zz">z</span><span class="zz z2">z</span><span class="zz z3">Z</span>';
  let undoDaze=null;if(k==="daze")undoDaze=dazeFace(pet);
  let done=false;const reveal=()=>{if(done)return;done=true;if(undoDaze)undoDaze();room.classList.add("noticed");if(k!=="peek")fx.innerHTML='<span class="bang">'+(k==="doze"?"!?":"!")+'</span>';
    setTimeout(()=>{room.classList.remove("intro","intro-"+k,"noticed");fx.remove();},1200);
    setTimeout(()=>{ib.classList.add("out");setTimeout(()=>ib.remove(),400);},3800);};
  const tm=setTimeout(reveal,k==="peek"?3300:3000);
  room.addEventListener("click",()=>{clearTimeout(tm);reveal();},{once:true});}
const _homeP0=window.homeP;window.homeP=function(){if(ymd()===EXAM_DAY&&P.examSeen!==EXAM_DAY&&!Q&&!SP&&!TQ&&!MK){examEvent(false);return;}_homeP0();homeExtras();if(!INTRO_DONE){INTRO_DONE=true;intro();}};
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.disabled)return;
  if(b.dataset.a==="mock"){mockHome();window.scrollTo(0,0);return;}
  if(b.dataset.mock){mockStart(b.dataset.mock);return;}
  if(b.hasAttribute("data-mopen")&&MK){MK.open=true;drawMock();return;}
  if(b.dataset.mkw!==undefined&&MK){const n=+b.dataset.mkw;MK.got=MK.got.includes(n)?MK.got.filter(x=>x!==n):[...MK.got,n];drawMock();return;}
  if(b.dataset.mg&&MK){MK.grade=b.dataset.mg;drawMock();return;}
  if(b.hasAttribute("data-mnext")&&MK){mockNext();return;}
  if(b.hasAttribute("data-mquit")){if(confirm("模試をやめますか？（記録は残りません）")){MK=null;homeP();}return;}
  if(b.dataset.ev==="open"){examEvent(false);window.scrollTo(0,0);return;}
  if(b.dataset.ev==="preview"){examEvent(true);window.scrollTo(0,0);return;}
  if(b.dataset.ev==="start"||b.dataset.ev==="next"){EV=EV||{i:-1};EV.i++;if(EV.i>=SETS.length){EV=null;evDone();return;}evCard();return;}
  if(b.dataset.ev==="back"){EV.i=Math.max(-1,EV.i-1);if(EV.i<0)examEvent(EV.preview);else evCard();return;}
},true);

/* ===== データの引っ越し（書き出し・読み込み） ===== */
function migEncode(){const u=new TextEncoder().encode(JSON.stringify(P));let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return "CHOBO1:"+btoa(s);}
function migDecode(t){t=String(t||"").trim();const i=t.indexOf("CHOBO1:");if(i<0)throw new Error("「CHOBO1:」で始まるコードではありません");
  let b=t.slice(i+7).replace(/[\r\n\t\u3000]/g,"").replace(/ /g,"+").replace(/-/g,"+").replace(/_/g,"/").replace(/[^A-Za-z0-9+/=]/g,"");
  if(b.length%4===1)throw new Error("コードが途中で切れています（"+b.length+"文字）。ファイルを選んで読み込んでください");
  while(b.length%4)b+="=";let o;
  try{const s=atob(b);const u=Uint8Array.from(s,c=>c.charCodeAt(0));o=JSON.parse(new TextDecoder().decode(u));}catch(e){throw new Error("コードが途中で切れているか、形がちがいます（"+b.length+"文字）。ファイルを選んで読み込んでください");}
  if(!o||typeof o!=="object"||!o.exp)throw new Error("ちょぼのデータではありません");return o;}
function migCard(){return `<div class="card mig"><p class="sec px">データの引っ越し</p>
  <p class="lv">別のゲーム（班メンバー版など）にちょぼを連れていくときに使います。</p>
  <button class="btn ghost" data-mig="out">引っ越し用のコードを出す</button><div id="migout"></div>
  ${(P.bkList||[]).length?`<details class="full"><summary>自動の控えから戻す（${(P.bkList||[]).length}日分）</summary><p class="lv">毎日1回、その日の状態を控えとして保存しています。戻すと、いまのちょぼはその日の状態で上書きされます。</p>${[...(P.bkList||[])].reverse().map(d=>`<button class="btn ghost sm2" data-bk="${d}">${d} の状態に戻す</button>`).join("")}<p class="lv" id="bkmsg"></p></details>`:""}
  <details class="full"><summary>引っ越し用のコードを読み込む</summary><p class="lv">いまのちょぼは、読み込んだデータで上書きされます。</p><p class="lv"><b>おすすめ：</b>コードを保存したファイルを選ぶ（長いコードは、コピーや貼り付けの途中で切れることがあります）。</p><input type="file" id="migfile" accept=".txt,text/plain"><p class="lv">または、コードを貼る：</p><textarea id="migin" rows="4" placeholder="CHOBO1: で始まるコードを貼る"></textarea><button class="btn" data-mig="in">読み込む</button><p class="lv" id="migmsg"></p></details></div>`;}
const _dexM=window.dex;window.dex=function(){_dexM();const app=document.getElementById("app");if(app)app.insertAdjacentHTML("beforeend",migCard());};
document.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b||!b.dataset.mig)return;
  if(b.dataset.mig==="out"){const code=migEncode();document.getElementById("migout").innerHTML=`<textarea id="migcode" rows="5" readonly>${code}</textarea><button class="btn" data-mig="copy">コピーする</button><button class="btn ghost" data-mig="save">ファイルに保存する</button><p class="lv">コードは${code.length.toLocaleString()}文字です。貼り付けたあと、最後の文字が「${code.slice(-8)}」になっているか確かめてください。</p><p class="lv">このコードには、あなたのちょぼの育ち具合・記録・まちがいリスト・チェック帳が入っています。自分以外に渡さないでください。</p>`;return;}
  if(b.dataset.mig==="save"){const code=document.getElementById("migcode").value;try{const d=window.claude&&window.claude.use?await window.claude.use("downloads"):null;if(d){await d.save({filename:"chobo_code.txt",data:code});return;}}catch(x){}
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([code],{type:"text/plain"}));a.download="chobo_code.txt";document.body.appendChild(a);a.click();a.remove();return;}
  if(b.dataset.mig==="copy"){const ta=document.getElementById("migcode");ta.select();let ok=false;try{await navigator.clipboard.writeText(ta.value);ok=true;}catch(x){try{ok=document.execCommand("copy");}catch(y){}}b.textContent=ok?"コピーしました":"長押しして全選択→コピーしてください";return;}
  if(b.dataset.mig==="in"){const msg=document.getElementById("migmsg");try{const f=document.getElementById("migfile").files[0];let t=f?await f.text():document.getElementById("migin").value;
      const o=migDecode(t);const tot=Object.values(o.exp||{}).reduce((a,c)=>a+c,0);
      if(!confirm(`そだち${tot}・解いた問題${Object.keys(o.hist||{}).length}問のちょぼを読み込みます。いまのちょぼは上書きされます。よろしいですか？`))return;
      {const ow=P.owner;P=migrateP(Object.assign(fresh(),o));P.owner=ow;}P.allowShrink=true;P.syncedAt=Date.now();P.upd=Date.now();P.t=Date.now();P.tf=Date.now();P.tm=Date.now();psave();
      if(typeof NET!=="undefined"){NET.last="";try{syncMe();}catch(x){}}
      msg.textContent="読み込みました";setTimeout(()=>homeP(),600);}catch(x){msg.textContent="読み込めませんでした："+x.message;}}
});

document.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b||!b.dataset.bk)return;const msg=document.getElementById("bkmsg");
  try{if(!GS.col){msg.textContent="控えに接続できません";return;}const s=await GS.col.doc("bk_"+b.dataset.bk).get();if(!s.exists){msg.textContent="その日の控えが見つかりません";return;}
    if(!confirm(b.dataset.bk+" の状態に戻しますか？　いまのちょぼは上書きされます。"))return;const keep=P.bkList,ow=P.owner;P=migrateP(JSON.parse(s.data().s));P.bkList=keep;P.owner=ow;P.allowShrink=true;P.syncedAt=Date.now();psave();
    if(typeof NET!=="undefined"){NET.last="";try{syncMe();}catch(x){}}msg.textContent="戻しました";setTimeout(()=>homeP(),600);}catch(x){msg.textContent="戻せませんでした："+x.message;}});

/* ===== chillなBGMと効果音（すべてオリジナル。Web Audioでその場で合成） ===== */
const SND={ctx:null,on:true,master:null,bgmGain:null,sfxGain:null,track:null,step:0,next:0,timer:null,crackle:null};
try{const v=localStorage.getItem("zaihyo-pet-sound");if(v==="off")SND.on=false;}catch(e){}
function audioInit(){if(SND.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const c=SND.ctx=new AC();SND.master=c.createGain();SND.master.gain.value=SND.on?1:0;SND.master.connect(c.destination);
  // BGMはやわらかく：ローパスとゆるいコンプ
  const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2200;lp.Q.value=0.4;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-24;comp.ratio.value=3;
  SND.bgmGain=c.createGain();SND.bgmGain.gain.value=0.22;SND.bgmGain.connect(lp);lp.connect(comp);comp.connect(SND.master);
  // ほんのりエコー
  const dl=c.createDelay();dl.delayTime.value=0.33;const fb=c.createGain();fb.gain.value=0.22;const wet=c.createGain();wet.gain.value=0.18;
  SND.bgmGain.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(lp);
  SND.sfxGain=c.createGain();SND.sfxGain.gain.value=0.3;SND.sfxGain.connect(SND.master);
  const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()<0.0009?(Math.random()*2-1):0)+(Math.random()*2-1)*0.012;SND.noise=nb;
  if(SND.want)bgm(SND.want,true);}
const hz=m=>440*Math.pow(2,(m-69)/12);
/* エレピ風の音：サイン2つを少しずらし、ゆっくり減衰 */
function keys(m,t,dur,vol,dest){const c=SND.ctx;[0,4].forEach((det,j)=>{const o=c.createOscillator(),g=c.createGain();o.type=j?"triangle":"sine";o.frequency.setValueAtTime(hz(m),t);o.detune.value=det;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol*(j?0.35:1),t+0.03);g.gain.exponentialRampToValueAtTime(vol*0.4,t+0.25);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+0.05);});}
function soft(m,t,dur,vol,dest,type){const c=SND.ctx;const o=c.createOscillator(),g=c.createGain();o.type=type||"sine";o.frequency.setValueAtTime(hz(m),t);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+0.05);}
function hat(t,vol,dest){const c=SND.ctx;const s=c.createBufferSource();const b=c.createBuffer(1,c.sampleRate*0.05,c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;s.buffer=b;
  const f=c.createBiquadFilter();f.type="highpass";f.frequency.value=6000;const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.04);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+0.05);}
function kick(t,vol,dest){const c=SND.ctx;const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+0.14);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.22);o.connect(g);g.connect(dest);o.start(t);o.stop(t+0.25);}
function snare(t,vol,dest){const c=SND.ctx;const s=c.createBufferSource();const b=c.createBuffer(1,c.sampleRate*0.2,c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;s.buffer=b;
  const f=c.createBiquadFilter();f.type="bandpass";f.frequency.value=1800;f.Q.value=0.8;const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+0.2);}
function crackleOn(on){const c=SND.ctx;if(!c)return;if(on&&!SND.crackle){const s=c.createBufferSource();s.buffer=SND.noise;s.loop=true;const f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=3500;const g=c.createGain();g.gain.value=0.35;s.connect(f);f.connect(g);g.connect(SND.bgmGain);s.start();SND.crackle=s;}
  if(!on&&SND.crackle){try{SND.crackle.stop();}catch(e){}SND.crackle=null;}}
/* 曲データ：1小節＝8マス（8分音符）。chords＝小節ごとの和音、mel＝メロディ（0は休み）、bass＝小節ごとの根音 */
const _=0;
const TRACKS={
 home:{bpm:78,swing:.16,drum:"k.h.s.h.",chords:[[65,69,72,76],[64,67,71,74],[62,65,69,72],[60,64,67,71]],bass:[41,40,38,36],
  mel:[_,_,79,_,76,_,_,_, _,74,_,76,_,_,_,_, _,_,77,_,74,_,72,_, _,_,_,_,71,_,_,_]},
 study:{bpm:70,swing:.12,drum:"k...s...",chords:[[57,60,64,67],[62,65,69,72],[55,59,62,65],[60,64,67,71]],bass:[45,38,43,36],
  mel:[_,_,_,_,76,_,_,_, _,_,77,_,_,_,_,_, _,_,74,_,_,71,_,_, _,_,_,_,72,_,_,_]},
 speed:{bpm:92,swing:.14,drum:"k.hhs.hh",chords:[[62,65,69,72],[55,59,62,65],[60,64,67,71],[57,61,64,67]],bass:[38,43,36,45],
  mel:[74,_,77,_,81,_,79,_, 77,_,_,74,_,_,_,_, 76,_,79,_,83,_,81,79, _,_,76,_,73,_,_,_]},
 battle:{bpm:86,swing:.1,drum:"k.hks.h.",chords:[[57,60,64,67],[53,57,60,64],[55,59,62,65],[52,56,59,62]],bass:[45,41,43,40],
  mel:[_,72,_,76,_,74,72,_, _,_,69,_,72,_,_,_, _,71,_,74,_,77,76,_, _,_,74,_,71,_,_,_]},
 calm:{bpm:64,swing:.1,drum:"........",chords:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]],bass:[36,45,41,43],
  mel:[_,_,_,_,79,_,_,_, _,_,_,_,76,_,_,_, _,_,_,_,72,_,_,_, _,_,_,_,74,_,_,_]}
};
function bgm(name,force){SND.want=name;if(!SND.ctx)return;if(SND.track===name&&!force)return;SND.track=name;SND.step=0;SND.next=SND.ctx.currentTime+0.1;crackleOn(true);
  if(!SND.timer)SND.timer=setInterval(schedule,25);}
function stopBgm(){SND.track=null;SND.want=null;crackleOn(false);}
function schedule(){const c=SND.ctx;if(!c||!SND.track)return;const T=TRACKS[SND.track];const sp=60/T.bpm/2;
  while(SND.next<c.currentTime+0.15){const i=SND.step%(T.chords.length*8),bar=Math.floor(i/8),pos=i%8;const sw=(pos%2===1)?sp*T.swing:0;const t=SND.next+sw,G=SND.bgmGain;
    if(pos===0)T.chords[bar].forEach((m,j)=>keys(m,t+j*0.015,sp*7.5,0.07,G));
    if(pos===5)T.chords[bar].slice(1).forEach(m=>keys(m+12,t,sp*2.5,0.025,G));
    if(pos===0||pos===6)soft(T.bass[bar],t,sp*(pos===0?5:2),0.16,G,"triangle");
    const m=T.mel[i%T.mel.length];if(m)keys(m,t,sp*3,0.06,G);
    const dr=T.drum[pos];if(dr==="k")kick(t,.22,G);if(dr==="s")snare(t,.05,G);if(dr==="h")hat(t,.018,G);
    SND.next+=sp;SND.step++;}}
/* 効果音（やわらかい音色） */
function sfx(k){if(!SND.ctx||!SND.on)return;const t=SND.ctx.currentTime+0.01,G=SND.sfxGain;
  const seq=(notes,step,vol)=>notes.forEach((m,j)=>m&&keys(m,t+j*step,step*3,vol||.18,G));
  switch(k){
   case "tap":soft(84,t,0.08,.06,G);break;
   case "ok":seq([76,79,84],0.08,.16);break;
   case "ng":soft(55,t,0.3,.12,G,"triangle");soft(52,t+0.14,0.35,.12,G,"triangle");break;
   case "combo":seq([84,88,91],0.06,.12);break;
   case "feed":seq([72,_,76,79,84],0.1,.16);break;
   case "fanfare":seq([72,76,79,83,_,84],0.12,.16);break;
   case "win":seq([67,72,76,79,_,84,88],0.11,.16);break;
   case "lose":seq([72,69,67,64],0.16,.14);break;
   case "evolve":seq([60,64,67,71,74,77,81,84,88],0.09,.14);setTimeout(()=>sfx("fanfare"),900);break;
   case "tick":soft(90,t,0.05,.05,G);break;
   case "invite":seq([81,_,85,88],0.1,.16);break;}}
function setSound(on){SND.on=on;try{localStorage.setItem("zaihyo-pet-sound",on?"on":"off");}catch(e){}if(SND.master)SND.master.gain.value=on?1:0;soundBtn();}
function soundBtn(){let b=document.getElementById("sndbtn");if(!b){b=document.createElement("button");b.id="sndbtn";b.className="sndbtn";b.setAttribute("aria-label","音のオンオフ");document.body.appendChild(b);b.addEventListener("click",e=>{e.stopPropagation();audioInit();setSound(!SND.on);if(SND.on&&SND.ctx&&SND.ctx.state==="suspended")SND.ctx.resume();});}
  b.textContent=SND.on?"♪ ON":"♪ OFF";b.classList.toggle("off",!SND.on);}
document.addEventListener("pointerdown",()=>{audioInit();if(SND.ctx&&SND.ctx.state==="suspended")SND.ctx.resume();},{capture:true});
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.id==="sndbtn")return;if(b.dataset.tf||b.dataset.mc||b.dataset.sp||b.dataset.vsa!==undefined)return;sfx("tap");},{capture:true});
/* 画面ごとにBGMを切り替える */
const wrap=(name,fn)=>{const o=window[name];window[name]=function(...a){const r=o.apply(this,a);fn(...a);return r;};};
let lastStage=null;
wrap("homeP",()=>{bgm("home");const s=stage();if(lastStage!==null&&s>lastStage)sfx("evolve");lastStage=s;});
["dex","recPage","info","chooseStd","stdPage","plaza","rank","vsLobby"].forEach(n=>wrap(n,()=>bgm("calm")));
wrap("drawQ",()=>bgm("study"));
wrap("startPlay",()=>bgm("speed"));
wrap("startBattle",()=>bgm("battle"));
wrap("ansQ",ok=>sfx(ok?"ok":"ng"));
wrap("endQ",()=>{bgm("home");sfx("feed");});
wrap("endPlay",()=>{bgm("home");sfx("fanfare");});
const _spA=window.spA;window.spA=function(v){const q=SP&&SP.pool[SP.k%SP.pool.length];const ok=q&&v===q.ans;_spA(v);sfx(ok?"ok":"ng");if(ok&&SP&&SP.combo>0&&SP.combo%5===0)sfx("combo");};
const _vsA=window.vsAnswer;window.vsAnswer=function(v){const can=BT&&!BT.done&&Date.now()>=BT.go;const q=can&&BT.qs[BT.k%BT.qs.length];const ok=q&&v===q.ans;_vsA(v);if(can)sfx(ok?"ok":"ng");};
const _endB=window.endBattle;window.endBattle=function(f){_endB(f);const w=document.querySelector(".big");sfx(w&&w.textContent.includes("かち")?"win":"lose");setTimeout(()=>bgm("calm"),1800);};
const _tickB=window.tickBattle;window.tickBattle=function(){if(BT&&!BT.done&&!BT.over){const now=Date.now();const left=Math.ceil(((now<BT.go?BT.go:BT.end)-now)/1000);if((now<BT.go||left<=5)&&left>0&&BT._lt!==left){BT._lt=left;sfx("tick");}}_tickB();};
const _tickP=window.tickP;window.tickP=function(){if(SP){const left=Math.ceil((SP.end-Date.now())/1000);if(left<=5&&left>0&&SP._lt!==left){SP._lt=left;sfx("tick");}}_tickP();};
const _onPC=window.onPeersChange;window.onPeersChange=function(){const had=!!document.getElementById("invbar");_onPC();if(!had&&document.getElementById("invbar"))sfx("invite");};
soundBtn();
homeP();initNet();gsyncInit();
wrap("drawT45",()=>bgm("study"));
wrap("drawMock",()=>bgm("study"));wrap("mockHome",()=>bgm("calm"));wrap("examEvent",()=>{bgm("home");sfx("fanfare");});wrap("mockResult",()=>{bgm("home");sfx("fanfare");});

const BGM_SRC={dusk:"bgm/dusk.mp4",rhodes:"bgm/rhodes.mp4"};

/* ===== BGM：選んだ曲を1本だけ、画面が切り替わっても途切れずに流し続ける ===== */
const BGM_LIST=[["dusk","Dusk in a Snowy Town"],["rhodes","Rhodes & Crackle"],["off","BGMなし"]];
const BGM={el:null,cur:null,url:{},gest:false,fade:null};
const bgmChoice=()=>{try{const v=localStorage.getItem("chobo-bgm");return BGM_LIST.some(x=>x[0]===v)?v:"dusk";}catch(e){return "dusk";}};
async function bgmUrl(k){if(BGM.url[k])return BGM.url[k];const src=(typeof BGM_SRC!=="undefined"&&BGM_SRC[k])||"";if(!src)return "";
  try{const r=await fetch(src);if(!r.ok)throw 0;BGM.url[k]=URL.createObjectURL(await r.blob());}catch(e){BGM.url[k]=src;}return BGM.url[k];}
function bgmFade(to,ms){if(!BGM.el)return;clearInterval(BGM.fade);const from=BGM.el.volume,st=Date.now();BGM.fade=setInterval(()=>{const t=Math.min(1,(Date.now()-st)/ms);BGM.el.volume=from+(to-from)*t;if(t>=1){clearInterval(BGM.fade);if(to===0)BGM.el.pause();}},50);}
async function bgmPlay(){const k=bgmChoice();if(!BGM.gest)return;
  if(k==="off"){if(BGM.el&&!BGM.el.paused)bgmFade(0,400);return;}
  if(!BGM.el){BGM.el=new Audio();BGM.el.loop=true;BGM.el.preload="auto";BGM.el.volume=0;}
  if(BGM.cur!==k){BGM.cur=k;const u=await bgmUrl(k);if(!u)return;if(BGM.cur!==k)return;BGM.el.src=u;BGM.el.currentTime=0;}
  if(BGM.el.paused){try{BGM.el.volume=0;await BGM.el.play();bgmFade(0.45,1200);}catch(e){}}}
/* 画面ごとの切り替えでは、曲を止めたり最初に戻したりしない */
window.bgm=function(){bgmPlay();};window.stopBgm=function(){};
document.addEventListener("pointerdown",()=>{if(!BGM.gest){BGM.gest=true;bgmPlay();}},{capture:true});
document.addEventListener("visibilitychange",()=>{if(!BGM.el)return;if(document.visibilityState==="hidden"){BGM.el.pause();}else if(bgmChoice()!=="off"&&BGM.gest){BGM.el.play().catch(()=>{});}});
/* 音の設定パネル */
window.soundBtn=function(){};
(function(){const old=document.getElementById("sndbtn");if(old)old.remove();
  const b=document.createElement("button");b.id="sndbtn2";b.className="sndbtn";b.setAttribute("aria-label","音の設定");b.textContent="♪";document.body.appendChild(b);
  const pn=document.createElement("div");pn.id="sndpanel";pn.className="sndpanel";pn.hidden=true;document.body.appendChild(pn);
  const draw=()=>{const k=bgmChoice();pn.innerHTML=`<b>BGM</b>${BGM_LIST.map(([v,l])=>`<button class="sp-opt${k===v?" on":""}" data-bgm="${v}">${k===v?"● ":"○ "}${l}</button>`).join("")}<b style="margin-top:8px">効果音</b><button class="sp-opt${SND.on?" on":""}" data-sfx="1">${SND.on?"● オン":"○ オン"}</button><button class="sp-opt${!SND.on?" on":""}" data-sfx="0">${!SND.on?"● オフ":"○ オフ"}</button><button class="sp-close" data-spclose>閉じる</button>`;};
  b.addEventListener("click",e=>{e.stopPropagation();BGM.gest=true;draw();pn.hidden=!pn.hidden;});
  pn.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;e.stopPropagation();
    if(t.dataset.bgm){try{localStorage.setItem("chobo-bgm",t.dataset.bgm);}catch(x){}if(t.dataset.bgm==="off"){if(BGM.el)bgmFade(0,400);}else{if(BGM.el&&BGM.cur!==t.dataset.bgm){BGM.el.pause();}bgmPlay();}draw();}
    if(t.dataset.sfx){SND.on=t.dataset.sfx==="1";try{localStorage.setItem("zaihyo-pet-sound",SND.on?"on":"off");}catch(x){}if(SND.master)SND.master.gain.value=SND.on?1:0;draw();}
    if(t.hasAttribute("data-spclose"))pn.hidden=true;});
  document.addEventListener("click",e=>{if(!pn.hidden&&!e.target.closest("#sndpanel")&&!e.target.closest("#sndbtn2"))pn.hidden=true;});})();


/* オフラインのときは、通信を使う画面のかわりにお知らせを出す */
const offlineScreen=t=>`<button class="link" data-a="home">← もどる</button><h2 class="px">${t}</h2><div class="card"><p>いまはオフラインのため、${t}は使えません。ネットにつながると使えます。</p><p class="lv">ごはん・べんきょう・あそぶ・ふくしゅう・模試・チェック帳は、オフラインでも使えます。記録はネットにつながったときに自動で保存されます。</p></div>`;
["plaza","rank","vsLobby"].forEach(n=>{const o=window[n];window[n]=function(...a){if(!navigator.onLine){VIEW=n==="vsLobby"?"vs":n;document.getElementById("app").innerHTML=offlineScreen({plaza:"ひろば",rank:"ランキング",vsLobby:"たいせん"}[n]);return;}return o.apply(this,a);};});
