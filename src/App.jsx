import { useState, useEffect, useRef } from "react";

const PRODUCT_CONTEXT = `
BUSINESS CONTEXT:
- I build and sell websites for local businesses that don't have a website yet
- Customers: small local business owners — plumbers, restaurants, salons, electricians, landscapers, contractors, dentists, chiropractors, gyms, trades
- Current offer: one-time flat-fee website build. No retainer yet.
- Target client: NOT tech-savvy, wants it done for them. Gets by on word of mouth, Google Maps, Facebook, or Yelp but is losing customers to competitors who have a site.
- Future plan: add monthly retainer services — SEO, Google Business Profile management, review management, social posting, website updates, ad management
- Key objections: "I don't need a website", "I have a Facebook page", "I can't afford it", "my nephew will do it"
- My edge: fast, simple, no tech overwhelm. I speak their language.
Tailor EVERYTHING to local service businesses. Budgets are small, decisions are emotional, trust is everything.
`;

const AGENTS = [
  { id:"cro", name:"CRO", full:"CRO Agent", icon:"📈", color:"#FF6B35", glow:"rgba(255,107,53,0.3)", tag:"Conversion & Optimization", system:`You are a CRO specialist for a local web design business. Apply skills: page-cro, form-cro, popup-cro, ab-test-setup, marketing-psychology, churn-prevention. Complete tasks fully. Give actual copy and UI recommendations. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"copy", name:"Copy", full:"Copywriting Agent", icon:"✍️", color:"#4ECDC4", glow:"rgba(78,205,196,0.3)", tag:"Copy, Content & Messaging", system:`You are a marketing copywriter for a local web design business. Apply skills: copywriting, copy-editing, ad-creative, email-sequence, cold-email, social-content. Produce actual copy immediately. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"seo", name:"SEO", full:"SEO Agent", icon:"🔍", color:"#45B7D1", glow:"rgba(69,183,209,0.3)", tag:"Search & Content Strategy", system:`You are a senior SEO strategist for a local web design business. Apply skills: seo-audit, ai-seo, programmatic-seo, schema-markup, content-strategy. Complete tasks with specific deliverables. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"analytics", name:"Data", full:"Analytics Agent", icon:"📊", color:"#A78BFA", glow:"rgba(167,139,250,0.3)", tag:"Data, Pricing & Research", system:`You are a data and revenue ops expert for a local web design business. Apply skills: analytics-tracking, revops, pricing-strategy, customer-research. Complete tasks with specs and analysis. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"growth", name:"Growth", full:"Growth Agent", icon:"🚀", color:"#34D399", glow:"rgba(52,211,153,0.3)", tag:"Referrals, Offers & Systems", system:`You are a growth strategist for a local web design business. Apply skills: free-tool-strategy, referral-program, lead-magnets, launch-strategy, pricing-strategy. Be opinionated — give a specific plan. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"paid", name:"Paid", full:"Paid & Outbound Agent", icon:"📣", color:"#F472B6", glow:"rgba(244,114,182,0.3)", tag:"Ads, Outreach & Sales", system:`You are a paid media expert for a local web design business. Apply skills: paid-ads, ad-creative, cold-email, sales-enablement, competitor-profiling. Produce actual ad copy and emails. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"community", name:"Brand", full:"Community & Brand Agent", icon:"🤝", color:"#FBBF24", glow:"rgba(251,191,36,0.3)", tag:"Brand, Social & Community", system:`You are a brand strategist for a local web design business. Apply skills: community-marketing, social-content, marketing-ideas, customer-research, marketing-psychology. Produce actual content. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"prospector", name:"Prospector", full:"Prospecting Agent", icon:"🎯", color:"#E879F9", glow:"rgba(232,121,249,0.3)", tag:"Lead Discovery & Outreach", system:`You are a sales prospecting expert for a local web design business. You have two modes:

MODE 1 - FIND LEADS: When the user asks you to find businesses in a city or area, generate a realistic list of 8-12 local businesses that likely don't have websites. Output them as a JSON block at the start of your response in this EXACT format, then follow with outreach copy:
LEADS:[{"name":"Business Name","phone":"555-000-0000","address":"123 Main St, City, ST","website":"","hasWebsite":false,"rating":4.2,"reviews":47,"industry":"plumber","city":"Nashville","email":""},...]

MODE 2 - WRITE OUTREACH: When given leads, write personalized cold email and call script for each no-website lead. Be specific, persuasive, and human. Reference their rating and review count.

Always end with: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
];

const genId = () => Math.random().toString(36).slice(2,10);
const save = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k,fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
function parseFollowups(t) { try { const m=t.match(/FOLLOWUPS:(\[.*?\])/s); if(m) return JSON.parse(m[1]); } catch {} return []; }
function stripFollowups(t) { return t.replace(/FOLLOWUPS:\[.*?\]/s,"").trim(); }

function exportCSV(leads) {
  const headers = ["Business Name","Phone","Email","Address","Website","Has Website","Rating","Reviews","Industry","City","Scraped At"];
  const rows = leads.map(l => [
    `"${l.name}"`, `"${l.phone}"`, `"${l.email}"`, `"${l.address}"`,
    `"${l.website}"`, l.hasWebsite?"Yes":"No",
    l.rating||"", l.reviews||"", `"${l.industry}"`, `"${l.city}"`,
    new Date(l.scrapedAt).toLocaleDateString()
  ]);
  const csv = [headers.join(","), ...rows.map(r=>r.join(","))].join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=`leads-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [tasks, setTasks] = useState(() => load("gos_tasks3",{}));
  const [outputs, setOutputs] = useState(() => load("gos_outputs3",[]));
  const [chats, setChats] = useState(() => load("gos_chats3",{}));
  const [leads, setLeads] = useState(() => load("gos_leads",[]));
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  const [chatInput, setChatInput] = useState("");
  const [taskInput, setTaskInput] = useState({});
  const [running, setRunning] = useState({});
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [prospectCity, setProspectCity] = useState("");
  const [prospectIndustry, setProspectIndustry] = useState("");
  const [prospecting, setProspecting] = useState(false);
  const [prospectError, setProspectError] = useState("");
  const [leadsFilter, setLeadsFilter] = useState("all");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const chatEndRef = useRef(null);

  useEffect(() => save("gos_tasks3", tasks), [tasks]);
  useEffect(() => save("gos_outputs3", outputs), [outputs]);
  useEffect(() => save("gos_chats3", chats), [chats]);
  useEffect(() => save("gos_leads", leads), [leads]);
  useEffect(() => { setTimeout(() => chatEndRef.current?.scrollIntoView({behavior:"smooth"}),50); }, [chats, chatLoading, activeAgent.id]);

  function addTask(agentId, text, isFollowup=false) {
    if (!text?.trim()) return;
    const task = { id:genId(), text:text.trim(), status:"pending", createdAt:Date.now(), isFollowup };
    setTasks(prev => ({...prev, [agentId]:[...(prev[agentId]||[]), task]}));
    setTaskInput(prev => ({...prev, [agentId]:""}));
  }

  async function runTask(agent, task) {
    setRunning(prev => ({...prev, [task.id]:true}));
    setTasks(prev => ({...prev, [agent.id]:prev[agent.id].map(t => t.id===task.id ? {...t,status:"running"} : t)}));
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1500, system:agent.system, messages:[{role:"user", content:`Complete this task fully: ${task.text}`}] }),
      });
      const data = await res.json();
      const raw = data.content?.map(b=>b.text||"").join("") || "Something went wrong.";
      const followups = parseFollowups(raw);
      const clean = stripFollowups(raw);
      const output = { id:genId(), agentId:agent.id, agentName:agent.full, agentIcon:agent.icon, agentColor:agent.color, taskText:task.text, output:clean, followups, createdAt:Date.now() };
      setOutputs(prev => [output, ...prev]);
      setTasks(prev => ({...prev, [agent.id]:prev[agent.id].map(t => t.id===task.id ? {...t,status:"done",outputId:output.id} : t)}));
      followups.forEach(f => addTask(agent.id, f, true));
      setSelectedOutput(output);
    } catch {
      setTasks(prev => ({...prev, [agent.id]:prev[agent.id].map(t => t.id===task.id ? {...t,status:"error"} : t)}));
    }
    setRunning(prev => ({...prev, [task.id]:false}));
  }

  function deleteTask(agentId, taskId) {
    setTasks(prev => ({...prev, [agentId]:prev[agentId].filter(t=>t.id!==taskId)}));
  }

  async function runProspect() {
    if (!prospectCity.trim() || !prospectIndustry.trim()) return;
    setProspecting(true);
    setProspectError("");
    try {
      const res = await fetch("http://localhost:3001/api/places/search", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ city: prospectCity.trim(), industry: prospectIndustry.trim() }),
      });
      const data = await res.json();
      if (data.error) { setProspectError(data.error); setProspecting(false); return; }
      const newLeads = data.leads.map(l => ({...l, id: l.id || genId(), contacted:false, note:""}));
      setLeads(prev => {
        const existingIds = new Set(prev.map(l=>l.id));
        const fresh = newLeads.filter(l=>!existingIds.has(l.id));
        return [...fresh, ...prev];
      });
      setTab("leads");
    } catch(e) {
      setProspectError("Connection error. Make sure the server is running.");
    }
    setProspecting(false);
  }

  function toggleLead(id) {
    setSelectedLeads(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  function toggleContacted(id) {
    setLeads(prev => prev.map(l => l.id===id ? {...l, contacted:!l.contacted} : l));
  }

  function deleteLead(id) {
    setLeads(prev => prev.filter(l=>l.id!==id));
    setSelectedLeads(prev => { const n=new Set(prev); n.delete(id); return n; });
  }

  async function generateOutreach() {
    const targetLeads = leads.filter(l => selectedLeads.has(l.id) && !l.hasWebsite);
    if (!targetLeads.length) return;
    const prospector = AGENTS.find(a=>a.id==="prospector");
    const summary = targetLeads.map(l=>`${l.name} (${l.industry}, ${l.city}) — Phone: ${l.phone}, Rating: ${l.rating}, Reviews: ${l.reviews}`).join("\n");
    addTask("prospector", `Write personalized cold email and call script for these ${targetLeads.length} no-website leads:\n${summary}`);
    setTab("tasks");
  }

  function parseLeadsFromResponse(text) {
    try { const m=text.match(/LEADS:(\[[\s\S]*?\])/); if(m) return JSON.parse(m[1]); } catch {}
    return [];
  }

  function stripLeads(text) { return text.replace(/LEADS:\[[\s\S]*?\]/,"").trim(); }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput(""); setChatLoading(true);
    const agentId = activeAgent.id;
    const history = chats[agentId] || [];
    const newHistory = [...history, {role:"user",content:msg}];
    setChats(prev => ({...prev,[agentId]:newHistory}));
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-sonnet-4-5", max_tokens:2000, system:activeAgent.system, messages:newHistory.slice(-20)}),
      });
      const data = await res.json();
      const raw = data.content?.map(b=>b.text||"").join("") || "Something went wrong.";
      if (agentId === "prospector") {
        const parsedLeads = parseLeadsFromResponse(raw);
        if (parsedLeads.length > 0) {
          const newLeads = parsedLeads.map(l => ({...l, id:genId(), contacted:false, note:"", scrapedAt:Date.now()}));
          setLeads(prev => {
            const existingNames = new Set(prev.map(l=>l.name.toLowerCase()));
            const fresh = newLeads.filter(l=>!existingNames.has(l.name.toLowerCase()));
            return [...fresh, ...prev];
          });
        }
      }
      const cleaned = stripFollowups(stripLeads(raw));
      setChats(prev => ({...prev,[agentId]:[...newHistory,{role:"assistant",content:cleaned}]}));
    } catch {
      setChats(prev => ({...prev,[agentId]:[...newHistory,{role:"assistant",content:"Connection error. Try again."}]}));
    }
    setChatLoading(false);
  }

  function getTotals() {
    let pending=0, done=0;
    AGENTS.forEach(a => (tasks[a.id]||[]).forEach(t => { if(t.status==="done") done++; else pending++; }));
    return {pending, done};
  }

  const tt = getTotals();
  const currentChat = chats[activeAgent.id] || [];
  const noWebsiteCount = leads.filter(l=>!l.hasWebsite).length;

  const filteredLeads = leads.filter(l => {
    const matchesFilter = leadsFilter==="all" || (leadsFilter==="no-website" && !l.hasWebsite) || (leadsFilter==="contacted" && l.contacted) || (leadsFilter==="not-contacted" && !l.contacted);
    const matchesSearch = !leadsSearch || l.name.toLowerCase().includes(leadsSearch.toLowerCase()) || l.city.toLowerCase().includes(leadsSearch.toLowerCase()) || l.industry.toLowerCase().includes(leadsSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const TABS = ["overview","tasks","outputs","leads","chat"];

  const C = {
    bg:"#080B14", surface:"rgba(255,255,255,0.025)", border:"rgba(255,255,255,0.07)",
    text:"#E2E8F0", muted:"rgba(255,255,255,0.35)", faint:"rgba(255,255,255,0.1)",
  };

  return (
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:C.bg, minHeight:"100vh", color:C.text, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden"}}>

      {/* Ambient orbs */}
      <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,53,0.04) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}} />
      <div style={{position:"fixed",bottom:-300,right:-200,width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,121,249,0.04) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}} />

      {/* TOPBAR */}
      <div style={{position:"relative",zIndex:10,borderBottom:`1px solid ${C.border}`,background:"rgba(8,11,20,0.95)",backdropFilter:"blur(20px)",padding:"0 28px",display:"flex",alignItems:"center",height:58,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:"auto"}}>
          <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#FF6B35,#F472B6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>G</div>
          <div>
            <span style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>Growth OS</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginLeft:8,letterSpacing:"0.05em"}}>AGENT COMMAND CENTER</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginRight:20}}>
          <div style={{padding:"4px 12px",borderRadius:20,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",fontSize:11,fontWeight:600,color:"#34D399"}}>{tt.done} done</div>
          <div style={{padding:"4px 12px",borderRadius:20,background:C.faint,border:`1px solid ${C.border}`,fontSize:11,fontWeight:600,color:C.muted}}>{tt.pending} pending</div>
          {noWebsiteCount>0 && <div style={{padding:"4px 12px",borderRadius:20,background:"rgba(232,121,249,0.1)",border:"1px solid rgba(232,121,249,0.2)",fontSize:11,fontWeight:600,color:"#E879F9"}}>{noWebsiteCount} hot leads</div>}
        </div>
        <div style={{display:"flex",gap:2}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(255,255,255,0.08)":"none",border:"none",cursor:"pointer",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:tab===t?600:400,color:tab===t?"#fff":C.muted,letterSpacing:"0.02em",transition:"all 0.15s",textTransform:"capitalize",position:"relative"}}>
              {t}
              {t==="leads" && leads.length>0 && <span style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:"#E879F9",boxShadow:"0 0 6px rgba(232,121,249,0.8)"}} />}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW */}
      {tab==="overview" && (
        <div style={{padding:"28px",flex:1,overflowY:"auto",position:"relative",zIndex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
            {[
              {label:"Total Tasks",value:AGENTS.reduce((s,a)=>s+(tasks[a.id]||[]).length,0),color:C.text},
              {label:"Completed",value:tt.done,color:"#34D399"},
              {label:"Pending",value:tt.pending,color:"#FBBF24"},
              {label:"Total Leads",value:leads.length,color:"#E879F9"},
              {label:"No Website",value:noWebsiteCount,color:"#F472B6"},
            ].map(stat=>(
              <div key={stat.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:28,fontWeight:800,color:stat.color,letterSpacing:"-1px",lineHeight:1}}>{stat.value}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:6,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:24}}>
            {AGENTS.map(agent=>{
              const at=tasks[agent.id]||[];
              const done=at.filter(t=>t.status==="done").length;
              const pending=at.filter(t=>t.status!=="done").length;
              const pct=at.length?Math.round((done/at.length)*100):0;
              const isH=hoveredAgent===agent.id;
              return (
                <div key={agent.id} onMouseEnter={()=>setHoveredAgent(agent.id)} onMouseLeave={()=>setHoveredAgent(null)}
                  style={{background:isH?"rgba(255,255,255,0.05)":C.surface,border:`1px solid ${isH?agent.color+"44":C.border}`,borderRadius:16,padding:"18px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
                  {isH && <div style={{position:"absolute",top:-60,right:-60,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${agent.glow} 0%,transparent 70%)`,pointerEvents:"none"}} />}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <div style={{width:34,height:34,borderRadius:10,background:`${agent.color}18`,border:`1px solid ${agent.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{agent.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{agent.full}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{agent.tag}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:agent.color}}>{pct}%</div>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,marginBottom:12,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${agent.color}88,${agent.color})`,borderRadius:2,transition:"width 0.6s"}} />
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setTab("tasks")} style={{flex:1,background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 0",fontSize:11,fontWeight:600,color:C.muted,cursor:"pointer"}}>Tasks</button>
                    <button onClick={()=>{setActiveAgent(agent);setTab("chat");}} style={{flex:1,background:`${agent.color}18`,border:`1px solid ${agent.color}44`,borderRadius:8,padding:"6px 0",fontSize:11,fontWeight:600,color:agent.color,cursor:"pointer"}}>Chat →</button>
                  </div>
                </div>
              );
            })}
          </div>

          {outputs.length>0 && (
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>Recent Outputs</div>
              {outputs.slice(0,4).map((o,i)=>(
                <div key={o.id} onClick={()=>{setSelectedOutput(o);setTab("outputs");}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<3?`1px solid rgba(255,255,255,0.05)`:"none",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${o.agentColor}18`,border:`1px solid ${o.agentColor}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{o.agentIcon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:500}}>{o.taskText}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:1}}>{o.agentName} · {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:o.agentColor,flexShrink:0}}>View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TASKS */}
      {tab==="tasks" && (
        <div style={{padding:"24px 28px",flex:1,overflowY:"auto",position:"relative",zIndex:1}}>
          {AGENTS.map(agent=>{
            const at=tasks[agent.id]||[];
            const pendingT=at.filter(t=>t.status!=="done");
            const doneT=at.filter(t=>t.status==="done");
            return (
              <div key={agent.id} style={{marginBottom:12,background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
                <div style={{padding:"13px 20px",borderBottom:`1px solid rgba(255,255,255,0.05)`,display:"flex",alignItems:"center",gap:10,background:`linear-gradient(90deg,${agent.color}08,transparent)`}}>
                  <div style={{width:28,height:28,borderRadius:8,background:`${agent.color}18`,border:`1px solid ${agent.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{agent.icon}</div>
                  <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{agent.full}</span>
                  <span style={{fontSize:11,color:C.muted}}>{agent.tag}</span>
                  <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                    <span style={{fontSize:11,fontWeight:600,color:"#34D399",background:"rgba(52,211,153,0.1)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(52,211,153,0.2)"}}>{doneT.length} done</span>
                    <span style={{fontSize:11,fontWeight:600,color:C.muted,background:C.faint,padding:"3px 10px",borderRadius:20,border:`1px solid ${C.border}`}}>{pendingT.length} pending</span>
                  </div>
                </div>
                <div style={{padding:"14px 20px"}}>
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    <input value={taskInput[agent.id]||""} onChange={e=>setTaskInput(p=>({...p,[agent.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter") addTask(agent.id,taskInput[agent.id]);}}
                      placeholder={`Add a task for ${agent.full}...`}
                      style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 14px",fontSize:13,color:C.text,fontFamily:"inherit",outline:"none"}}
                      onFocus={e=>e.target.style.borderColor=agent.color+"66"} onBlur={e=>e.target.style.borderColor=C.border} />
                    <button onClick={()=>addTask(agent.id,taskInput[agent.id])} style={{background:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:"none",borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:700,color:"#000",cursor:"pointer",whiteSpace:"nowrap"}}>+ Add</button>
                  </div>
                  {at.length===0 && <div style={{textAlign:"center",padding:"14px 0",fontSize:12,color:"rgba(255,255,255,0.15)"}}>No tasks yet</div>}
                  {pendingT.map(task=>(
                    <div key={task.id} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:task.status==="running"?agent.color:task.status==="error"?"#EF4444":"rgba(255,255,255,0.15)",flexShrink:0,marginTop:5,boxShadow:task.status==="running"?`0 0 8px ${agent.color}`:"none",transition:"all 0.3s"}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>
                          {task.text}
                          {task.isFollowup && <span style={{marginLeft:8,fontSize:10,fontWeight:600,color:agent.color,background:`${agent.color}18`,borderRadius:4,padding:"2px 7px"}}>AI SUGGESTED</span>}
                        </div>
                        {task.status==="error" && <div style={{fontSize:11,color:"#EF4444",marginTop:2}}>Failed — click retry</div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>runTask(agent,task)} disabled={task.status==="running"} style={{background:task.status==="running"?"rgba(255,255,255,0.05)":agent.color,border:"none",borderRadius:8,padding:"5px 14px",fontSize:11,fontWeight:700,color:task.status==="running"?"rgba(255,255,255,0.3)":"#000",cursor:task.status==="running"?"not-allowed":"pointer",minWidth:72,transition:"all 0.2s"}}>
                          {task.status==="running"?"●●●":task.status==="error"?"↺ Retry":"▶ Run"}
                        </button>
                        <button onClick={()=>deleteTask(agent.id,task.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"5px 10px",fontSize:11,color:"rgba(239,68,68,0.6)",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  ))}
                  {doneT.length>0 && (
                    <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Completed ({doneT.length})</div>
                      {doneT.map(task=>(
                        <div key={task.id} style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",opacity:0.4}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:"#34D399",flexShrink:0}} />
                          <div style={{flex:1,fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"line-through"}}>{task.text}</div>
                          <button onClick={()=>{const o=outputs.find(x=>x.id===task.outputId);if(o){setSelectedOutput(o);setTab("outputs");}}} style={{background:"none",border:"none",fontSize:11,fontWeight:600,color:agent.color,cursor:"pointer",opacity:2.5,flexShrink:0}}>View →</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OUTPUTS */}
      {tab==="outputs" && (
        <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative",zIndex:1}}>
          <div style={{width:280,borderRight:`1px solid ${C.border}`,background:"rgba(255,255,255,0.015)",overflowY:"auto",padding:"14px 10px",flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,padding:"0 6px"}}>All Outputs ({outputs.length})</div>
            {outputs.length===0 && <div style={{fontSize:12,color:"rgba(255,255,255,0.2)",textAlign:"center",padding:24}}>Run a task to see outputs</div>}
            {outputs.map(o=>(
              <div key={o.id} onClick={()=>setSelectedOutput(o)} style={{padding:"11px",borderRadius:10,marginBottom:3,cursor:"pointer",background:selectedOutput?.id===o.id?"rgba(255,255,255,0.06)":"transparent",borderLeft:selectedOutput?.id===o.id?`2px solid ${o.agentColor}`:"2px solid transparent",transition:"all 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                  <span style={{fontSize:14}}>{o.agentIcon}</span>
                  <span style={{fontSize:11,fontWeight:600,color:o.agentColor}}>{o.agentName.replace(" Agent","")}</span>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{o.taskText}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:4}}>{new Date(o.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"26px"}}>
            {!selectedOutput ? (
              <div style={{textAlign:"center",padding:"80px 20px",color:"rgba(255,255,255,0.15)"}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <div style={{fontSize:14,fontWeight:500}}>Select an output to view it</div>
              </div>
            ) : (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
                  <div style={{width:42,height:42,borderRadius:12,background:`${selectedOutput.agentColor}18`,border:`1px solid ${selectedOutput.agentColor}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>{selectedOutput.agentIcon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{selectedOutput.agentName}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:1}}>{new Date(selectedOutput.createdAt).toLocaleString()}</div>
                  </div>
                  <button onClick={()=>navigator.clipboard.writeText(selectedOutput.output)} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:600,color:C.muted,cursor:"pointer"}}>Copy Output</button>
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 17px",marginBottom:11}}>
                  <div style={{fontSize:10,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Task</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{selectedOutput.taskText}</div>
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"17px",marginBottom:11}}>
                  <div style={{fontSize:10,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:11}}>Output</div>
                  <div style={{fontSize:13,color:"#C8D6E8",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'Georgia',serif"}}>{selectedOutput.output}</div>
                </div>
                {selectedOutput.followups?.length>0 && (
                  <div style={{background:`${selectedOutput.agentColor}08`,border:`1px solid ${selectedOutput.agentColor}22`,borderRadius:12,padding:"15px 17px"}}>
                    <div style={{fontSize:10,fontWeight:600,color:selectedOutput.agentColor,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:11}}>AI Suggested Follow-ups</div>
                    {selectedOutput.followups.map((f,i)=>{
                      const added=(tasks[selectedOutput.agentId]||[]).some(t=>t.text===f);
                      return (
                        <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:9}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:selectedOutput.agentColor,flexShrink:0}} />
                          <div style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.6)"}}>{f}</div>
                          <button onClick={()=>!added&&addTask(selectedOutput.agentId,f,true)} style={{background:added?"rgba(255,255,255,0.04)":selectedOutput.agentColor,border:added?`1px solid ${C.border}`:"none",borderRadius:8,padding:"5px 13px",fontSize:11,fontWeight:700,color:added?"rgba(255,255,255,0.25)":"#000",cursor:added?"default":"pointer",flexShrink:0}}>
                            {added?"Added ✓":"+ Add Task"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEADS */}
      {tab==="leads" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1}}>

          {/* Prospect search bar */}
          <div style={{padding:"20px 28px",borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,0.015)",flexShrink:0}}>
            <div style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>🎯 Find New Leads — Search Google Maps</div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input value={prospectCity} onChange={e=>setProspectCity(e.target.value)} placeholder="City (e.g. Nashville, TN)"
                style={{flex:1,minWidth:180,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 14px",fontSize:13,color:C.text,fontFamily:"inherit",outline:"none"}}
                onFocus={e=>e.target.style.borderColor="#E879F966"} onBlur={e=>e.target.style.borderColor=C.border} />
              <input value={prospectIndustry} onChange={e=>setProspectIndustry(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") runProspect();}} placeholder="Industry (e.g. plumbers, salons)"
                style={{flex:1,minWidth:180,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 14px",fontSize:13,color:C.text,fontFamily:"inherit",outline:"none"}}
                onFocus={e=>e.target.style.borderColor="#E879F966"} onBlur={e=>e.target.style.borderColor=C.border} />
              <button onClick={runProspect} disabled={prospecting||!prospectCity.trim()||!prospectIndustry.trim()} style={{background:prospecting||!prospectCity.trim()||!prospectIndustry.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#E879F9,#A78BFA)",border:"none",borderRadius:10,padding:"9px 22px",fontSize:13,fontWeight:700,color:prospecting||!prospectCity.trim()||!prospectIndustry.trim()?"rgba(255,255,255,0.2)":"#000",cursor:prospecting||!prospectCity.trim()||!prospectIndustry.trim()?"not-allowed":"pointer",whiteSpace:"nowrap",transition:"all 0.2s"}}>
                {prospecting?"Searching...":"🔍 Search"}
              </button>
              {leads.length>0 && (
                <>
                  <button onClick={()=>exportCSV(filteredLeads)} style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,color:"#34D399",cursor:"pointer",whiteSpace:"nowrap"}}>↓ Export CSV</button>
                  {selectedLeads.size>0 && <button onClick={generateOutreach} style={{background:"linear-gradient(135deg,#F472B6,#E879F9)",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,color:"#000",cursor:"pointer",whiteSpace:"nowrap"}}>✍️ Generate Outreach ({selectedLeads.size})</button>}
                </>
              )}
            </div>
            {prospectError && <div style={{marginTop:10,fontSize:12,color:"#EF4444",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"8px 12px"}}>{prospectError}</div>}
            <div style={{marginTop:10,fontSize:12,color:"rgba(255,255,255,0.4)",background:"rgba(232,121,249,0.06)",border:"1px solid rgba(232,121,249,0.15)",borderRadius:8,padding:"8px 14px",lineHeight:1.6}}>
              💡 <strong style={{color:"#E879F9"}}>Two ways to add leads:</strong> (1) Enter city + industry above to search Google Maps (requires free API key), or (2) go to <strong style={{color:"#E879F9"}}>Chat → Prospecting Agent</strong> and say <em>"Find me 10 plumbers in Nashville with no website"</em> — leads will auto-appear here.
            </div>
          </div>

          {/* Filters + table */}
          <div style={{flex:1,overflowY:"auto",padding:"16px 28px"}}>
            {leads.length===0 ? (
              <div style={{textAlign:"center",padding:"80px 20px",color:"rgba(255,255,255,0.15)"}}>
                <div style={{fontSize:48,marginBottom:12}}>🎯</div>
                <div style={{fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.3)",marginBottom:6}}>No leads yet</div>
                <div style={{fontSize:13}}>Search a city and industry above to find local businesses</div>
              </div>
            ) : (
              <>
                {/* Filter + search bar */}
                <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                  {[["all","All"],["no-website","No Website 🔥"],["not-contacted","Not Contacted"],["contacted","Contacted ✓"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setLeadsFilter(v)} style={{background:leadsFilter===v?"rgba(232,121,249,0.15)":C.faint,border:leadsFilter===v?"1px solid rgba(232,121,249,0.4)":`1px solid ${C.border}`,borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:600,color:leadsFilter===v?"#E879F9":C.muted,cursor:"pointer"}}>{l}</button>
                  ))}
                  <input value={leadsSearch} onChange={e=>setLeadsSearch(e.target.value)} placeholder="Search leads..."
                    style={{marginLeft:"auto",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 12px",fontSize:12,color:C.text,fontFamily:"inherit",outline:"none",width:200}} />
                  <span style={{fontSize:12,color:C.muted}}>{filteredLeads.length} leads</span>
                </div>

                {/* Table */}
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                  {/* Table header */}
                  <div style={{display:"grid",gridTemplateColumns:"32px 1fr 120px 140px 100px 80px 80px 80px",gap:0,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,0.02)"}}>
                    {["","Business","Phone","Address","Website","Rating","Reviews",""].map((h,i)=>(
                      <div key={i} style={{fontSize:10,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{h}</div>
                    ))}
                  </div>

                  {filteredLeads.map((lead,i)=>(
                    <div key={lead.id} style={{display:"grid",gridTemplateColumns:"32px 1fr 120px 140px 100px 80px 80px 80px",gap:0,padding:"11px 16px",borderBottom:i<filteredLeads.length-1?`1px solid rgba(255,255,255,0.04)`:"none",background:selectedLeads.has(lead.id)?"rgba(232,121,249,0.05)":"transparent",transition:"background 0.15s",alignItems:"center"}}>
                      
                      <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={()=>toggleLead(lead.id)}
                        style={{accentColor:"#E879F9",width:14,height:14,cursor:"pointer"}} />
                      
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.name}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:1}}>{lead.industry} · {lead.city}</div>
                      </div>
                      
                      <div style={{fontSize:12,color:lead.phone?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.phone||"—"}</div>
                      
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={lead.address}>{lead.address||"—"}</div>
                      
                      <div>
                        {lead.hasWebsite
                          ? <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"3px 8px"}}>Has site</span>
                          : <span style={{fontSize:11,fontWeight:700,color:"#F472B6",background:"rgba(244,114,182,0.1)",borderRadius:6,padding:"3px 8px",border:"1px solid rgba(244,114,182,0.2)"}}>🔥 No site</span>
                        }
                      </div>

                      <div style={{fontSize:12,color:lead.rating?"#FBBF24":"rgba(255,255,255,0.2)",fontWeight:600}}>{lead.rating?`★ ${lead.rating}`:"—"}</div>

                      <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{lead.reviews>0?lead.reviews.toLocaleString():"—"}</div>

                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>toggleContacted(lead.id)} title={lead.contacted?"Mark not contacted":"Mark contacted"} style={{background:lead.contacted?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.04)",border:lead.contacted?"1px solid rgba(52,211,153,0.3)":`1px solid ${C.border}`,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:600,color:lead.contacted?"#34D399":C.muted,cursor:"pointer"}}>
                          {lead.contacted?"✓":"○"}
                        </button>
                        <button onClick={()=>deleteLead(lead.id)} style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.12)",borderRadius:6,padding:"3px 7px",fontSize:10,color:"rgba(239,68,68,0.5)",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHAT */}
      {tab==="chat" && (
        <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative",zIndex:1}}>
          <div style={{width:200,borderRight:`1px solid ${C.border}`,background:"rgba(255,255,255,0.015)",flexShrink:0,overflowY:"auto",padding:"12px 8px"}}>
            {AGENTS.map(a=>{
              const msgs=(chats[a.id]||[]).length;
              const isActive=activeAgent.id===a.id;
              return (
                <div key={a.id} onClick={()=>setActiveAgent(a)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:3,cursor:"pointer",background:isActive?`${a.color}12`:"transparent",borderLeft:isActive?`2px solid ${a.color}`:"2px solid transparent",transition:"all 0.15s"}}>
                  <span style={{fontSize:17}}>{a.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:isActive?700:500,color:isActive?"#fff":"rgba(255,255,255,0.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.full.replace(" Agent","")}</div>
                    {msgs>0 && <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:1}}>{msgs} msgs</div>}
                  </div>
                  {msgs>0 && <div style={{width:6,height:6,borderRadius:"50%",background:a.color,boxShadow:`0 0 6px ${a.color}`,flexShrink:0}} />}
                </div>
              );
            })}
          </div>

          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:`linear-gradient(90deg,${activeAgent.color}08,transparent)`}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${activeAgent.color}18`,border:`1px solid ${activeAgent.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{activeAgent.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{activeAgent.full}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>{activeAgent.tag}</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.2)",fontWeight:500}}>{currentChat.length} messages</span>
                {currentChat.length>0 && <button onClick={()=>setChats(p=>({...p,[activeAgent.id]:[]}))} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:600,color:"rgba(239,68,68,0.6)",cursor:"pointer"}}>Clear</button>}
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
              {currentChat.length===0 && (
                <div style={{margin:"auto",textAlign:"center",padding:"40px 20px"}}>
                  <div style={{fontSize:44,marginBottom:14}}>{activeAgent.icon}</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.5px",marginBottom:6}}>{activeAgent.full}</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:28,lineHeight:1.6}}>{activeAgent.tag}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:360,margin:"0 auto"}}>
                    {["What should I focus on this week?","Give me your top recommendation for getting more clients right now.","Review my current approach and tell me what to improve."].map(s=>(
                      <button key={s} onClick={()=>setChatInput(s)} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${activeAgent.color}22`,borderRadius:10,padding:"10px 16px",fontSize:12,color:"rgba(255,255,255,0.5)",cursor:"pointer",textAlign:"left",fontFamily:"inherit",lineHeight:1.4,transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.target.style.background=`${activeAgent.color}12`;e.target.style.color="rgba(255,255,255,0.8)";}}
                        onMouseLeave={e=>{e.target.style.background="rgba(255,255,255,0.04)";e.target.style.color="rgba(255,255,255,0.5)";}}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {currentChat.map((msg,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.2)",marginBottom:5,paddingLeft:4,letterSpacing:"0.05em",textTransform:"uppercase"}}>{msg.role==="user"?"You":activeAgent.name}</div>
                  <div style={{maxWidth:"76%",padding:"12px 16px",borderRadius:14,fontSize:13,lineHeight:1.7,background:msg.role==="user"?`linear-gradient(135deg,${activeAgent.color},${activeAgent.color}CC)`:"rgba(255,255,255,0.05)",color:msg.role==="user"?"#000":"#C8D6E8",border:msg.role==="assistant"?`1px solid rgba(255,255,255,0.07)`:"none",whiteSpace:"pre-wrap",fontFamily:msg.role==="assistant"?"'Georgia',serif":"inherit",fontWeight:msg.role==="user"?600:400,boxShadow:msg.role==="user"?`0 4px 20px ${activeAgent.color}33`:"none"}}>{msg.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
                  <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.2)",marginBottom:5,paddingLeft:4,letterSpacing:"0.05em",textTransform:"uppercase"}}>{activeAgent.name}</div>
                  <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.07)`,borderRadius:14,padding:"12px 18px",display:"flex",gap:5,alignItems:"center"}}>
                    {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:activeAgent.color,animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite`,opacity:0.7}} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{padding:"16px 24px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,flexShrink:0}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} placeholder={`Message ${activeAgent.full}...`}
                style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 16px",fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",transition:"border-color 0.15s"}}
                onFocus={e=>e.target.style.borderColor=activeAgent.color+"66"} onBlur={e=>e.target.style.borderColor=C.border} />
              <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{background:chatLoading||!chatInput.trim()?"rgba(255,255,255,0.05)":`linear-gradient(135deg,${activeAgent.color},${activeAgent.color}CC)`,border:"none",borderRadius:12,padding:"11px 22px",fontSize:12,fontWeight:700,color:chatLoading||!chatInput.trim()?"rgba(255,255,255,0.2)":"#000",cursor:chatLoading||!chatInput.trim()?"not-allowed":"pointer",transition:"all 0.2s",letterSpacing:"0.02em"}}>Send</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4;} 30%{transform:translateY(-6px);opacity:1;} }
      `}</style>
    </div>
  );
}
