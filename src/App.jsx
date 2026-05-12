import { useState, useEffect, useRef } from "react";

const PRODUCT_CONTEXT = `
BUSINESS CONTEXT:
- I build and sell websites for local businesses that don't have a website yet
- Customers: small local business owners — plumbers, restaurants, salons, electricians, landscapers, contractors, dentists, chiropractors, gyms, trades
- Current offer: one-time flat-fee website build. No retainer yet.
- Target client: NOT tech-savvy, wants it done for them. Gets by on word of mouth, Google Maps, Facebook, or Yelp but losing customers to competitors who have a site.
- Future plan: monthly retainer services — SEO, Google Business Profile, review management, social posting, website updates, ads
- Key objections: "I don't need a website", "I have a Facebook page", "I can't afford it", "my nephew will do it"
- My edge: fast, simple, no tech overwhelm. I speak their language.
Tailor EVERYTHING to local service businesses. Budgets are small, decisions are emotional, trust is everything.
`;

const AGENTS = [
  { id:"cro", name:"CRO", full:"CRO Agent", icon:"📈", color:"#FF6B35", glow:"rgba(255,107,53,0.2)", tag:"Conversion & Optimization", system:`You are a CRO specialist for a local web design business. Apply skills: page-cro, form-cro, popup-cro, ab-test-setup, marketing-psychology. Complete tasks fully. Give actual copy and UI recommendations. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"copy", name:"Copy", full:"Copywriting Agent", icon:"✍️", color:"#4ECDC4", glow:"rgba(78,205,196,0.2)", tag:"Copy, Content & Messaging", system:`You are a marketing copywriter for a local web design business. Apply skills: copywriting, ad-creative, email-sequence, cold-email, social-content. Produce actual copy immediately. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"seo", name:"SEO", full:"SEO Agent", icon:"🔍", color:"#45B7D1", glow:"rgba(69,183,209,0.2)", tag:"Search & Content Strategy", system:`You are a senior SEO strategist for a local web design business. Apply skills: seo-audit, ai-seo, schema-markup, content-strategy. Complete tasks with specific deliverables. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"analytics", name:"Data", full:"Analytics Agent", icon:"📊", color:"#A78BFA", glow:"rgba(167,139,250,0.2)", tag:"Data, Pricing & Research", system:`You are a data and revenue ops expert for a local web design business. Apply skills: analytics-tracking, pricing-strategy, customer-research. Complete tasks with specs and analysis. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"growth", name:"Growth", full:"Growth Agent", icon:"🚀", color:"#34D399", glow:"rgba(52,211,153,0.2)", tag:"Referrals, Offers & Systems", system:`You are a growth strategist for a local web design business. Apply skills: referral-program, lead-magnets, launch-strategy, pricing-strategy. Be opinionated — give a specific plan. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"paid", name:"Paid", full:"Paid & Outbound Agent", icon:"📣", color:"#F472B6", glow:"rgba(244,114,182,0.2)", tag:"Ads, Outreach & Sales", system:`You are a paid media expert for a local web design business. Apply skills: paid-ads, ad-creative, cold-email, sales-enablement. Produce actual ad copy and emails. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"community", name:"Brand", full:"Community & Brand Agent", icon:"🤝", color:"#FBBF24", glow:"rgba(251,191,36,0.2)", tag:"Brand, Social & Community", system:`You are a brand strategist for a local web design business. Apply skills: community-marketing, social-content, marketing-ideas, marketing-psychology. Produce actual content. After completing suggest 2-3 follow-ups: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
  { id:"prospector", name:"Prospects", full:"Prospecting Agent", icon:"🎯", color:"#E879F9", glow:"rgba(232,121,249,0.2)", tag:"Lead Discovery & Outreach", system:`You are a sales prospecting expert for a local web design business. Two modes:
MODE 1 - FIND LEADS: Generate 8-12 realistic local businesses that likely have no website. Output JSON at START of response:
LEADS:[{"name":"Joe's Plumbing","phone":"615-555-0123","address":"123 Main St, Nashville, TN","website":"","hasWebsite":false,"rating":4.3,"reviews":28,"industry":"plumber","city":"Nashville","email":""},...]
MODE 2 - WRITE OUTREACH: Write personalized cold email + call script for each no-website business.
Always end with: FOLLOWUPS:["task 1","task 2","task 3"]${PRODUCT_CONTEXT}` },
];

const genId = () => Math.random().toString(36).slice(2,10);
function parseFollowups(t) { try { const m=t.match(/FOLLOWUPS:(\[.*?\])/s); if(m) return JSON.parse(m[1]); } catch {} return []; }
function stripFollowups(t) { return t.replace(/FOLLOWUPS:\[.*?\]/s,"").trim(); }
function parseLeads(t) { try { const m=t.match(/LEADS:(\[[\s\S]*?\])/); if(m) return JSON.parse(m[1]); } catch {} return []; }
function stripLeads(t) { return t.replace(/LEADS:\[[\s\S]*?\]/,"").trim(); }

function exportCSV(leads) {
  const h=["Name","Phone","Email","Address","Website","Has Website","Rating","Reviews","Industry","City"];
  const rows=leads.map(l=>[`"${l.name||""}"`,`"${l.phone||""}"`,`"${l.email||""}"`,`"${l.address||""}"`,`"${l.website||""}"`,l.hasWebsite?"Yes":"No",l.rating||"",l.reviews||"",`"${l.industry||""}"`,`"${l.city||""}"`]);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([[h.join(","),...rows.map(r=>r.join(","))].join("\n")],{type:"text/csv"}));
  a.download=`leads-${Date.now()}.csv`; a.click();
}

async function callAPI(path, body) {
  const res = await fetch(path, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  return res.json();
}

const INDUSTRY_THEMES = {
  plumber: { primary:"#1E40AF", accent:"#3B82F6", bg:"#0F172A", emoji:"🔧" },
  electrician: { primary:"#D97706", accent:"#F59E0B", bg:"#0F172A", emoji:"⚡" },
  restaurant: { primary:"#B45309", accent:"#F97316", bg:"#1C0A00", emoji:"🍽️" },
  salon: { primary:"#7C3AED", accent:"#A78BFA", bg:"#0D0A1A", emoji:"💇" },
  landscaper: { primary:"#166534", accent:"#22C55E", bg:"#0A1A0F", emoji:"🌿" },
  dentist: { primary:"#0E7490", accent:"#22D3EE", bg:"#0A1520", emoji:"🦷" },
  gym: { primary:"#DC2626", accent:"#F87171", bg:"#1A0A0A", emoji:"💪" },
  contractor: { primary:"#78350F", accent:"#D97706", bg:"#1A0F00", emoji:"🏗️" },
  default: { primary:"#4F46E5", accent:"#818CF8", bg:"#0F0F1A", emoji:"🏢" },
};

function getTheme(industry="") {
  const key = Object.keys(INDUSTRY_THEMES).find(k => industry.toLowerCase().includes(k));
  return INDUSTRY_THEMES[key] || INDUSTRY_THEMES.default;
}

function buildWebsiteHTML(lead) {
  const theme = getTheme(lead.industry);
  const name = lead.name || "Local Business";
  const phone = lead.phone || "Call for pricing";
  const address = lead.address || lead.city || "Local Area";
  const industry = lead.industry || "local service";
  const city = lead.city || "";
  const rating = lead.rating ? `★ ${lead.rating}` : "";
  const reviews = lead.reviews ? `${lead.reviews} reviews` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} - ${city} ${industry}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#fff; color:#1a1a1a; }
  :root { --primary:${theme.primary}; --accent:${theme.accent}; }
  nav { background:rgba(0,0,0,0.95); backdrop-filter:blur(10px); padding:16px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
  .logo { color:#fff; font-size:20px; font-weight:800; letter-spacing:-0.5px; }
  .nav-links { display:flex; gap:32px; list-style:none; }
  .nav-links a { color:rgba(255,255,255,0.7); text-decoration:none; font-size:14px; font-weight:500; transition:color 0.2s; }
  .nav-links a:hover { color:#fff; }
  .nav-cta { background:var(--accent); color:#fff; padding:10px 24px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px; }
  .hero { background:linear-gradient(135deg, ${theme.bg} 0%, #000 100%); min-height:90vh; display:flex; align-items:center; padding:80px 40px; position:relative; overflow:hidden; }
  .hero::before { content:''; position:absolute; top:-200px; right:-200px; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, ${theme.accent}22 0%, transparent 70%); }
  .hero-content { max-width:700px; position:relative; z-index:1; }
  .hero-badge { display:inline-flex; align-items:center; gap:8px; background:${theme.accent}22; border:1px solid ${theme.accent}44; color:${theme.accent}; padding:8px 16px; border-radius:50px; font-size:13px; font-weight:600; margin-bottom:24px; }
  .hero h1 { font-size:clamp(36px,6vw,72px); font-weight:900; color:#fff; line-height:1.05; letter-spacing:-2px; margin-bottom:20px; }
  .hero h1 span { color:${theme.accent}; }
  .hero p { font-size:18px; color:rgba(255,255,255,0.6); line-height:1.7; margin-bottom:36px; max-width:520px; }
  .hero-btns { display:flex; gap:16px; flex-wrap:wrap; }
  .btn-primary { background:var(--accent); color:#fff; padding:16px 36px; border-radius:12px; text-decoration:none; font-weight:800; font-size:16px; display:inline-flex; align-items:center; gap:8px; box-shadow:0 0 40px ${theme.accent}44; transition:transform 0.2s; }
  .btn-primary:hover { transform:translateY(-2px); }
  .btn-outline { border:2px solid rgba(255,255,255,0.2); color:#fff; padding:16px 36px; border-radius:12px; text-decoration:none; font-weight:700; font-size:16px; }
  .hero-stats { display:flex; gap:40px; margin-top:48px; padding-top:40px; border-top:1px solid rgba(255,255,255,0.1); }
  .stat-num { font-size:28px; font-weight:900; color:#fff; letter-spacing:-1px; }
  .stat-label { font-size:12px; color:rgba(255,255,255,0.4); margin-top:4px; text-transform:uppercase; letter-spacing:0.05em; }
  .services { padding:100px 40px; background:#fff; }
  .section-label { font-size:12px; font-weight:700; color:var(--primary); letter-spacing:0.15em; text-transform:uppercase; margin-bottom:12px; }
  .section-title { font-size:clamp(28px,4vw,48px); font-weight:900; color:#0f0f0f; letter-spacing:-1.5px; margin-bottom:16px; }
  .section-sub { font-size:17px; color:#666; line-height:1.6; max-width:540px; margin-bottom:60px; }
  .services-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; }
  .service-card { background:#f8f9fa; border-radius:20px; padding:32px; border:1px solid #e9ecef; transition:transform 0.2s, box-shadow 0.2s; }
  .service-card:hover { transform:translateY(-4px); box-shadow:0 20px 60px rgba(0,0,0,0.08); }
  .service-icon { font-size:36px; margin-bottom:16px; }
  .service-card h3 { font-size:18px; font-weight:800; color:#0f0f0f; margin-bottom:8px; }
  .service-card p { font-size:14px; color:#666; line-height:1.6; }
  .why { padding:100px 40px; background:${theme.bg}; }
  .why-grid { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; max-width:1100px; margin:0 auto; }
  .why-left h2 { font-size:clamp(28px,4vw,48px); font-weight:900; color:#fff; letter-spacing:-1.5px; margin-bottom:20px; }
  .why-left p { font-size:16px; color:rgba(255,255,255,0.5); line-height:1.7; margin-bottom:40px; }
  .why-items { display:flex; flex-direction:column; gap:20px; }
  .why-item { display:flex; gap:16px; align-items:flex-start; }
  .why-check { width:28px; height:28px; border-radius:8px; background:${theme.accent}22; border:1px solid ${theme.accent}44; display:flex; align-items:center; justify-content:center; color:${theme.accent}; font-size:14px; font-weight:700; flex-shrink:0; margin-top:2px; }
  .why-text h4 { font-size:15px; font-weight:700; color:#fff; margin-bottom:4px; }
  .why-text p { font-size:13px; color:rgba(255,255,255,0.4); line-height:1.5; }
  .why-right { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px; }
  .review-card { margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.06); }
  .review-card:last-child { margin-bottom:0; padding-bottom:0; border-bottom:none; }
  .stars { color:${theme.accent}; font-size:14px; margin-bottom:8px; }
  .review-text { font-size:14px; color:rgba(255,255,255,0.6); line-height:1.6; margin-bottom:12px; font-style:italic; }
  .reviewer { font-size:13px; font-weight:600; color:#fff; }
  .cta-section { background:linear-gradient(135deg, var(--primary), ${theme.accent}); padding:100px 40px; text-align:center; }
  .cta-section h2 { font-size:clamp(28px,5vw,56px); font-weight:900; color:#fff; letter-spacing:-1.5px; margin-bottom:16px; }
  .cta-section p { font-size:18px; color:rgba(255,255,255,0.8); margin-bottom:40px; }
  .cta-phone { display:inline-flex; align-items:center; gap:12px; background:#fff; color:${theme.primary}; padding:18px 40px; border-radius:14px; font-size:22px; font-weight:900; text-decoration:none; letter-spacing:-0.5px; }
  footer { background:#000; padding:40px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }
  .footer-logo { color:#fff; font-weight:800; font-size:18px; }
  .footer-info { color:rgba(255,255,255,0.3); font-size:13px; }
  @media(max-width:768px) {
    nav { padding:16px 20px; }
    .nav-links { display:none; }
    .hero { padding:60px 20px; min-height:70vh; }
    .services { padding:60px 20px; }
    .why { padding:60px 20px; }
    .why-grid { grid-template-columns:1fr; gap:40px; }
    .cta-section { padding:60px 20px; }
    footer { padding:24px 20px; flex-direction:column; text-align:center; }
    .hero-stats { gap:24px; }
  }
</style>
</head>
<body>
<nav>
  <div class="logo">${theme.emoji} ${name}</div>
  <ul class="nav-links">
    <li><a href="#services">Services</a></li>
    <li><a href="#why">About</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a href="tel:${phone.replace(/\D/g,'')}" class="nav-cta">📞 Call Now</a>
</nav>
<section class="hero">
  <div class="hero-content">
    <div class="hero-badge">${theme.emoji} Serving ${city || "your area"}</div>
    <h1>Your Trusted<br><span>${industry.charAt(0).toUpperCase()+industry.slice(1)}</span><br>in ${city || "the area"}</h1>
    <p>Professional, reliable, and affordable. We take care of the job so you don't have to worry about a thing.</p>
    <div class="hero-btns">
      <a href="tel:${phone.replace(/\D/g,'')}" class="btn-primary">📞 Call ${phone}</a>
      <a href="#services" class="btn-outline">Our Services</a>
    </div>
    ${rating || reviews ? `<div class="hero-stats">
      ${rating ? `<div class="stat"><div class="stat-num">${rating}</div><div class="stat-label">Rating</div></div>` : ""}
      ${reviews ? `<div class="stat"><div class="stat-num">${reviews}</div><div class="stat-label">Happy Customers</div></div>` : ""}
      <div class="stat"><div class="stat-num">100%</div><div class="stat-label">Satisfaction</div></div>
    </div>` : ""}
  </div>
</section>
<section class="services" id="services">
  <div class="section-label">What We Do</div>
  <div class="section-title">Our Services</div>
  <p class="section-sub">Top-quality ${industry} services for homes and businesses in ${city || "the local area"}.</p>
  <div class="services-grid">
    <div class="service-card"><div class="service-icon">⭐</div><h3>Quality Work</h3><p>Every job done right the first time. We stand behind everything we do.</p></div>
    <div class="service-card"><div class="service-icon">⚡</div><h3>Fast Response</h3><p>Quick response times and flexible scheduling to fit your needs.</p></div>
    <div class="service-card"><div class="service-icon">💰</div><h3>Fair Pricing</h3><p>Transparent upfront pricing. No hidden fees, no surprises.</p></div>
    <div class="service-card"><div class="service-icon">🛡️</div><h3>Licensed & Insured</h3><p>Fully licensed and insured for your complete peace of mind.</p></div>
    <div class="service-card"><div class="service-icon">🤝</div><h3>Local & Trusted</h3><p>Your neighbors. Built on reputation and referrals in ${city || "the local"} community.</p></div>
    <div class="service-card"><div class="service-icon">✅</div><h3>Satisfaction Guaranteed</h3><p>Not happy? We'll make it right. Your satisfaction is our top priority.</p></div>
  </div>
</section>
<section class="why" id="why">
  <div class="why-grid">
    <div class="why-left">
      <div class="section-label" style="color:${theme.accent}">Why Choose Us</div>
      <h2>The ${city || "local"} choice for ${industry} services</h2>
      <p>${name} has been serving the ${city || "local"} community with reliable, professional service. We're not a big corporation — we're your neighbors.</p>
      <div class="why-items">
        <div class="why-item"><div class="why-check">✓</div><div class="why-text"><h4>Same-day service available</h4><p>We prioritize your needs. Don't wait days for a callback.</p></div></div>
        <div class="why-item"><div class="why-check">✓</div><div class="why-text"><h4>Free estimates</h4><p>Know the cost before committing. No pressure, no surprises.</p></div></div>
        <div class="why-item"><div class="why-check">✓</div><div class="why-text"><h4>Family owned & operated</h4><p>When you call, you talk to the owner. Not a call center.</p></div></div>
        <div class="why-item"><div class="why-check">✓</div><div class="why-text"><h4>5-star rated on Google</h4><p>${reviews ? `${reviews} verified reviews from real customers.` : "Consistently top-rated by our customers."}</p></div></div>
      </div>
    </div>
    <div class="why-right">
      <div class="review-card"><div class="stars">★★★★★</div><p class="review-text">"Absolutely the best ${industry} in ${city || "the area"}. Called in the morning, done by afternoon. Couldn't be happier!"</p><div class="reviewer">— Sarah M., ${city || "Local"} Resident</div></div>
      <div class="review-card"><div class="stars">★★★★★</div><p class="review-text">"Professional, on time, fair pricing. I've used them three times and won't go anywhere else. Highly recommend!"</p><div class="reviewer">— Mike T., ${city || "Local"} Business Owner</div></div>
      <div class="review-card"><div class="stars">★★★★★</div><p class="review-text">"Friendly, honest, amazing job. They explained everything before starting and the price was exactly as quoted."</p><div class="reviewer">— Jennifer K., ${city || "Local"} Homeowner</div></div>
    </div>
  </div>
</section>
<section class="cta-section" id="contact">
  <h2>Ready to get started?</h2>
  <p>Call us today for a free estimate. We're standing by to help.</p>
  <a href="tel:${phone.replace(/\D/g,'')}" class="cta-phone">📞 ${phone}</a>
  <p style="margin-top:24px;font-size:14px;opacity:0.7">${address}</p>
</section>
<footer>
  <div class="footer-logo">${theme.emoji} ${name}</div>
  <div class="footer-info">${address} · ${phone} · © ${new Date().getFullYear()} ${name}. All rights reserved.</div>
</footer>
</body>
</html>`;
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [tasks, setTasks] = useState({});
  const [outputs, setOutputs] = useState([]);
  const [chats, setChats] = useState({});
  const [leads, setLeads] = useState([]);
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  const [chatInput, setChatInput] = useState("");
  const [taskInput, setTaskInput] = useState({});
  const [running, setRunning] = useState({});
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [leadsFilter, setLeadsFilter] = useState("all");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [buildingWebsite, setBuildingWebsite] = useState(null);
  const [websitePreview, setWebsitePreview] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(()=>{ setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),50); },[chats,chatLoading,activeAgent.id]);

  function addTask(agentId, text, isFollowup=false) {
    if (!text?.trim()) return;
    setTasks(p=>({...p,[agentId]:[...(p[agentId]||[]),{id:genId(),text:text.trim(),status:"pending",createdAt:Date.now(),isFollowup}]}));
    setTaskInput(p=>({...p,[agentId]:""}));
  }

  async function runTask(agent, task) {
    setRunning(p=>({...p,[task.id]:true}));
    setTasks(p=>({...p,[agent.id]:p[agent.id].map(t=>t.id===task.id?{...t,status:"running"}:t)}));
    try {
      const data = await callAPI("/api/chat", { model:"claude-sonnet-4-5", max_tokens:1500, system:agent.system, messages:[{role:"user",content:`Complete this task fully: ${task.text}`}] });
      const raw = data.content?.map(b=>b.text||"").join("") || "Error";
      const followups=parseFollowups(raw); const clean=stripFollowups(raw);
      const output={id:genId(),agentId:agent.id,agentName:agent.full,agentIcon:agent.icon,agentColor:agent.color,taskText:task.text,output:clean,followups,createdAt:Date.now()};
      setOutputs(p=>[output,...p]);
      setTasks(p=>({...p,[agent.id]:p[agent.id].map(t=>t.id===task.id?{...t,status:"done",outputId:output.id}:t)}));
      followups.forEach(f=>addTask(agent.id,f,true));
      setSelectedOutput(output);
    } catch {
      setTasks(p=>({...p,[agent.id]:p[agent.id].map(t=>t.id===task.id?{...t,status:"error"}:t)}));
    }
    setRunning(p=>({...p,[task.id]:false}));
  }

  async function sendChat() {
    if (!chatInput.trim()||chatLoading) return;
    const msg=chatInput.trim(); setChatInput(""); setChatLoading(true);
    const agentId=activeAgent.id;
    const history=chats[agentId]||[];
    const newHistory=[...history,{role:"user",content:msg}];
    setChats(p=>({...p,[agentId]:newHistory}));
    try {
      const data = await callAPI("/api/chat", {model:"claude-sonnet-4-5",max_tokens:2000,system:activeAgent.system,messages:newHistory.slice(-20)});
      const raw = data.content?.map(b=>b.text||"").join("") || "Error";
      if (agentId==="prospector") {
        const parsed=parseLeads(raw);
        if (parsed.length>0) {
          const newLeads=parsed.map(l=>({...l,id:genId(),contacted:false,scrapedAt:Date.now()}));
          setLeads(p=>{const ex=new Set(p.map(l=>l.name.toLowerCase())); return [...newLeads.filter(l=>!ex.has(l.name.toLowerCase())),...p];});
          setTab("leads");
        }
      }
      setChats(p=>({...p,[agentId]:[...newHistory,{role:"assistant",content:stripFollowups(stripLeads(raw))}]}));
    } catch {
      setChats(p=>({...p,[agentId]:[...newHistory,{role:"assistant",content:"Connection error. Try again."}]}));
    }
    setChatLoading(false);
  }

  function buildWebsite(lead) {
    setBuildingWebsite(lead.id);
    setTimeout(() => {
      const html = buildWebsiteHTML(lead);
      setWebsitePreview({ lead, html });
      setBuildingWebsite(null);
    }, 600);
  }

  function downloadWebsite(lead, html) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], {type:"text/html"}));
    a.download = `${lead.name.replace(/[^a-z0-9]/gi,"-").toLowerCase()}-website.html`;
    a.click();
  }

  function getTotals() {
    let pending=0,done=0;
    AGENTS.forEach(a=>(tasks[a.id]||[]).forEach(t=>{if(t.status==="done")done++;else pending++;}));
    return {pending,done};
  }

  const tt=getTotals();
  const currentChat=chats[activeAgent.id]||[];
  const noWebsite=leads.filter(l=>!l.hasWebsite).length;
  const filteredLeads=leads.filter(l=>{
    const mf=leadsFilter==="all"||(leadsFilter==="no-website"&&!l.hasWebsite)||(leadsFilter==="contacted"&&l.contacted)||(leadsFilter==="not-contacted"&&!l.contacted);
    const ms=!leadsSearch||l.name?.toLowerCase().includes(leadsSearch.toLowerCase())||l.city?.toLowerCase().includes(leadsSearch.toLowerCase());
    return mf&&ms;
  });

  const C={bg:"#0D0F1A",card:"rgba(255,255,255,0.03)",border:"rgba(255,255,255,0.06)",text:"#E8EAF0",muted:"rgba(255,255,255,0.3)"};
  const G={purple:"linear-gradient(135deg,#7C3AED,#A855F7)",pink:"linear-gradient(135deg,#EC4899,#F472B6)",orange:"linear-gradient(135deg,#F97316,#FB923C)",teal:"linear-gradient(135deg,#0EA5E9,#38BDF8)",green:"linear-gradient(135deg,#10B981,#34D399)"};

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",background:C.bg,minHeight:"100vh",color:C.text,display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{position:"fixed",top:-300,left:-200,width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 65%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-300,right:-200,width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.06) 0%,transparent 65%)",pointerEvents:"none",zIndex:0}}/>

      {/* TOPBAR */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(13,15,26,0.92)",backdropFilter:"blur(24px)",borderBottom:`1px solid ${C.border}`,height:56,display:"flex",alignItems:"center",padding:"0 20px",gap:16,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:8}}>
          <div style={{width:30,height:30,borderRadius:9,background:G.purple,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>G</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"-0.3px",lineHeight:1}}>Growth OS</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Agent Command</div>
          </div>
        </div>
        <div style={{display:"flex",gap:1,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3}}>
          {["overview","tasks","outputs","leads","chat"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(255,255,255,0.08)":"transparent",border:"none",cursor:"pointer",padding:"5px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t?600:400,color:tab===t?"#fff":C.muted,transition:"all 0.15s",textTransform:"capitalize",position:"relative"}}>
              {t}{t==="leads"&&leads.length>0&&<span style={{position:"absolute",top:3,right:3,width:5,height:5,borderRadius:"50%",background:"#E879F9"}}/>}
            </button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:600,color:"#34D399",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",padding:"4px 10px",borderRadius:20}}>{tt.done} done</span>
          <span style={{fontSize:11,fontWeight:600,color:C.muted,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,padding:"4px 10px",borderRadius:20}}>{tt.pending} pending</span>
          {noWebsite>0&&<span style={{fontSize:11,fontWeight:600,color:"#E879F9",background:"rgba(232,121,249,0.1)",border:"1px solid rgba(232,121,249,0.2)",padding:"4px 10px",borderRadius:20}}>🔥 {noWebsite} leads</span>}
        </div>
      </div>

      {/* WEBSITE PREVIEW MODAL */}
      {websitePreview && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column"}}>
          <div style={{background:"rgba(13,15,26,0.98)",borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>🌐 Website — {websitePreview.lead.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:1}}>{websitePreview.lead.industry} · {websitePreview.lead.city} · Ready to deliver</div>
            </div>
            <button onClick={()=>downloadWebsite(websitePreview.lead,websitePreview.html)} style={{background:G.green,border:"none",borderRadius:8,padding:"8px 20px",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>⬇ Download HTML</button>
            <button onClick={()=>setWebsitePreview(null)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,color:"rgba(239,68,68,0.8)",cursor:"pointer"}}>✕ Close</button>
          </div>
          <iframe srcDoc={websitePreview.html} style={{flex:1,border:"none",width:"100%"}} title="Website Preview"/>
        </div>
      )}

      {/* MAIN */}
      <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative",zIndex:1}}>

        {/* AGENT SIDEBAR */}
        {(tab==="chat"||tab==="tasks") && (
          <div style={{width:64,borderRight:`1px solid ${C.border}`,background:"rgba(0,0,0,0.2)",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,overflowY:"auto"}}>
            {AGENTS.map(a=>{
              const isActive=activeAgent.id===a.id;
              const msgs=(chats[a.id]||[]).length;
              const pend=(tasks[a.id]||[]).filter(t=>t.status==="pending").length;
              return (
                <div key={a.id} onClick={()=>setActiveAgent(a)} title={a.full}
                  style={{width:44,height:44,borderRadius:12,background:isActive?`${a.color}20`:"transparent",border:isActive?`1px solid ${a.color}55`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",transition:"all 0.15s",position:"relative"}}
                  onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}}
                  onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}}>
                  {a.icon}
                  {(msgs>0||pend>0)&&<div style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:pend>0?a.color:"rgba(255,255,255,0.25)",boxShadow:pend>0?`0 0 6px ${a.color}`:"none"}}/>}
                </div>
              );
            })}
          </div>
        )}

        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
              {[
                {label:"Total Tasks",v:AGENTS.reduce((s,a)=>s+(tasks[a.id]||[]).length,0),g:G.purple,icon:"📋"},
                {label:"Completed",v:tt.done,g:G.green,icon:"✅"},
                {label:"Pending",v:tt.pending,g:G.orange,icon:"⏳"},
                {label:"Total Leads",v:leads.length,g:G.pink,icon:"👥"},
                {label:"Hot Leads",v:noWebsite,g:"linear-gradient(135deg,#E879F9,#A855F7)",icon:"🔥"},
              ].map(s=>(
                <div key={s.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:s.g,opacity:0.07}}/>
                  <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{s.icon} {s.label}</div>
                  <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-1.5px",lineHeight:1}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Agents</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10,marginBottom:20}}>
              {AGENTS.map(agent=>{
                const at=tasks[agent.id]||[];
                const done=at.filter(t=>t.status==="done").length;
                const pct=at.length?Math.round((done/at.length)*100):0;
                return (
                  <div key={agent.id} onClick={()=>{setActiveAgent(agent);setTab("chat");}}
                    style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=agent.color+"44";e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
                    <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:`radial-gradient(circle,${agent.color}14,transparent 70%)`}}/>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <div style={{width:32,height:32,borderRadius:9,background:`${agent.color}18`,border:`1px solid ${agent.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{agent.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{agent.full}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{agent.tag}</div>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:agent.color,flexShrink:0}}>{pct}%</span>
                    </div>
                    <div style={{height:2,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${agent.color}88,${agent.color})`,borderRadius:2,transition:"width 0.5s"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                      <span style={{fontSize:10,color:C.muted}}>{at.length} tasks</span>
                      <span style={{fontSize:10,color:agent.color,fontWeight:600}}>Chat →</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {outputs.length>0&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 20px"}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>Recent Outputs</div>
                {outputs.slice(0,5).map((o,i)=>(
                  <div key={o.id} onClick={()=>{setSelectedOutput(o);setTab("outputs");}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<Math.min(outputs.length,5)-1?`1px solid rgba(255,255,255,0.04)`:"none",cursor:"pointer",transition:"opacity 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.6"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{width:28,height:28,borderRadius:8,background:`${o.agentColor}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{o.agentIcon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.taskText}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{o.agentName} · {new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:600,color:o.agentColor,flexShrink:0}}>View →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TASKS */}
        {tab==="tasks"&&(
          <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
            {AGENTS.filter(a=>a.id===activeAgent.id).map(agent=>{
              const at=tasks[agent.id]||[];
              const pendingT=at.filter(t=>t.status!=="done");
              const doneT=at.filter(t=>t.status==="done");
              return (
                <div key={agent.id}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${agent.color}18`,border:`1px solid ${agent.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{agent.icon}</div>
                    <div><div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{agent.full}</div><div style={{fontSize:11,color:C.muted}}>{agent.tag}</div></div>
                    <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                      <span style={{fontSize:11,fontWeight:600,color:"#34D399",background:"rgba(52,211,153,0.1)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(52,211,153,0.15)"}}>{doneT.length} done</span>
                      <span style={{fontSize:11,color:C.muted,background:"rgba(255,255,255,0.04)",padding:"3px 10px",borderRadius:20,border:`1px solid ${C.border}`}}>{pendingT.length} pending</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    <input value={taskInput[agent.id]||""} onChange={e=>setTaskInput(p=>({...p,[agent.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")addTask(agent.id,taskInput[agent.id]);}}
                      placeholder={`Add a task for ${agent.full}...`}
                      style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.text,fontFamily:"inherit",outline:"none"}}
                      onFocus={e=>e.target.style.borderColor=agent.color+"66"} onBlur={e=>e.target.style.borderColor=C.border}/>
                    <button onClick={()=>addTask(agent.id,taskInput[agent.id])} style={{background:`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:"none",borderRadius:10,padding:"10px 18px",fontSize:12,fontWeight:700,color:"#000",cursor:"pointer"}}>+ Add</button>
                  </div>
                  {at.length===0&&<div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.15)",fontSize:13}}>No tasks yet</div>}
                  {pendingT.map(task=>(
                    <div key={task.id} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",borderRadius:12,marginBottom:6,background:"rgba(255,255,255,0.025)",border:`1px solid ${C.border}`}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:task.status==="running"?agent.color:task.status==="error"?"#EF4444":"rgba(255,255,255,0.2)",flexShrink:0,marginTop:5,boxShadow:task.status==="running"?`0 0 8px ${agent.color}`:"none",transition:"all 0.3s"}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{task.text}</div>
                        {task.isFollowup&&<span style={{fontSize:9,fontWeight:700,color:agent.color,background:`${agent.color}18`,borderRadius:4,padding:"2px 6px",marginTop:4,display:"inline-block",letterSpacing:"0.05em"}}>AI SUGGESTED</span>}
                        {task.status==="error"&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>Failed — retry</div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>runTask(agent,task)} disabled={task.status==="running"} style={{background:task.status==="running"?"rgba(255,255,255,0.04)":`linear-gradient(135deg,${agent.color},${agent.color}CC)`,border:"none",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,color:task.status==="running"?"rgba(255,255,255,0.2)":"#000",cursor:task.status==="running"?"not-allowed":"pointer",minWidth:72,transition:"all 0.2s"}}>
                          {task.status==="running"?"···":task.status==="error"?"↺":"▶ Run"}
                        </button>
                        <button onClick={()=>setTasks(p=>({...p,[agent.id]:p[agent.id].filter(t=>t.id!==task.id)}))} style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"6px 10px",fontSize:11,color:"rgba(239,68,68,0.6)",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  ))}
                  {doneT.length>0&&(
                    <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                      <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Completed ({doneT.length})</div>
                      {doneT.map(task=>(
                        <div key={task.id} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",opacity:0.4}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:"#34D399",flexShrink:0}}/>
                          <div style={{flex:1,fontSize:12,color:C.muted,textDecoration:"line-through"}}>{task.text}</div>
                          <button onClick={()=>{const o=outputs.find(x=>x.id===task.outputId);if(o){setSelectedOutput(o);setTab("outputs");}}} style={{background:"none",border:"none",fontSize:10,fontWeight:600,color:agent.color,cursor:"pointer",flexShrink:0,opacity:2.5}}>View →</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{marginTop:24}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:10,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>Switch Agent</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {AGENTS.map(a=>(
                  <button key={a.id} onClick={()=>setActiveAgent(a)} style={{background:activeAgent.id===a.id?`${a.color}20`:"rgba(255,255,255,0.03)",border:`1px solid ${activeAgent.id===a.id?a.color+"44":C.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:activeAgent.id===a.id?a.color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>
                    {a.icon} {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OUTPUTS */}
        {tab==="outputs"&&(
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <div style={{width:240,borderRight:`1px solid ${C.border}`,background:"rgba(0,0,0,0.15)",overflowY:"auto",padding:"12px 8px",flexShrink:0}}>
              <div style={{fontSize:10,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,padding:"0 4px"}}>Outputs ({outputs.length})</div>
              {outputs.length===0&&<div style={{fontSize:11,color:"rgba(255,255,255,0.15)",textAlign:"center",padding:20}}>Run tasks to see outputs</div>}
              {outputs.map(o=>(
                <div key={o.id} onClick={()=>setSelectedOutput(o)} style={{padding:"10px",borderRadius:10,marginBottom:3,cursor:"pointer",background:selectedOutput?.id===o.id?"rgba(255,255,255,0.06)":"transparent",borderLeft:selectedOutput?.id===o.id?`2px solid ${o.agentColor}`:"2px solid transparent",transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:13}}>{o.agentIcon}</span>
                    <span style={{fontSize:10,fontWeight:600,color:o.agentColor}}>{o.agentName.replace(" Agent","")}</span>
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{o.taskText}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginTop:4}}>{new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
              {!selectedOutput?(
                <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.15)"}}>
                  <div style={{fontSize:40,marginBottom:10}}>📋</div>
                  <div style={{fontSize:13}}>Select an output to view</div>
                </div>
              ):(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                    <div style={{width:38,height:38,borderRadius:10,background:`${selectedOutput.agentColor}18`,border:`1px solid ${selectedOutput.agentColor}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{selectedOutput.agentIcon}</div>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{selectedOutput.agentName}</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{new Date(selectedOutput.createdAt).toLocaleString()}</div></div>
                    <button onClick={()=>navigator.clipboard.writeText(selectedOutput.output)} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:600,color:C.muted,cursor:"pointer"}}>Copy</button>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:10}}>
                    <div style={{fontSize:9,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Task</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{selectedOutput.taskText}</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",marginBottom:10}}>
                    <div style={{fontSize:9,fontWeight:600,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Output</div>
                    <div style={{fontSize:13,color:"#C8D6E8",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{selectedOutput.output}</div>
                  </div>
                  {selectedOutput.followups?.length>0&&(
                    <div style={{background:`${selectedOutput.agentColor}08`,border:`1px solid ${selectedOutput.agentColor}22`,borderRadius:12,padding:"14px 16px"}}>
                      <div style={{fontSize:9,fontWeight:600,color:selectedOutput.agentColor,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>AI Follow-ups</div>
                      {selectedOutput.followups.map((f,i)=>{
                        const added=(tasks[selectedOutput.agentId]||[]).some(t=>t.text===f);
                        return (
                          <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                            <div style={{width:5,height:5,borderRadius:"50%",background:selectedOutput.agentColor,flexShrink:0}}/>
                            <div style={{flex:1,fontSize:12,color:"rgba(255,255,255,0.55)"}}>{f}</div>
                            <button onClick={()=>!added&&addTask(selectedOutput.agentId,f,true)} style={{background:added?"transparent":selectedOutput.agentColor,border:added?`1px solid ${C.border}`:"none",borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:700,color:added?C.muted:"#000",cursor:added?"default":"pointer",flexShrink:0}}>
                              {added?"✓ Added":"+ Add"}
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
        {tab==="leads"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,0.15)",flexShrink:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:3}}>
                  {[["all","All"],["no-website","🔥 No Site"],["not-contacted","Uncontacted"],["contacted","Contacted ✓"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setLeadsFilter(v)} style={{background:leadsFilter===v?"rgba(232,121,249,0.15)":"transparent",border:leadsFilter===v?"1px solid rgba(232,121,249,0.3)":"1px solid transparent",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,color:leadsFilter===v?"#E879F9":C.muted,cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
                <input value={leadsSearch} onChange={e=>setLeadsSearch(e.target.value)} placeholder="Search..." style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:C.text,fontFamily:"inherit",outline:"none",width:140}}/>
                {leads.length>0&&<button onClick={()=>exportCSV(filteredLeads)} style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,color:"#34D399",cursor:"pointer"}}>↓ CSV</button>}
                {selectedLeads.size>0&&(
                  <button onClick={()=>{const tl=leads.filter(l=>selectedLeads.has(l.id)&&!l.hasWebsite);if(tl.length>0){const s=tl.map(l=>`${l.name} (${l.industry}, ${l.city}) — Phone: ${l.phone}`).join("\n");addTask("prospector",`Write cold email and call script for:\n${s}`);setTab("tasks");setActiveAgent(AGENTS.find(a=>a.id==="prospector"));}}} style={{background:G.pink,border:"none",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                    ✍️ Outreach ({selectedLeads.size})
                  </button>
                )}
                <span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>{filteredLeads.length} leads</span>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
              {leads.length===0?(
                <div style={{textAlign:"center",padding:"80px 20px"}}>
                  <div style={{fontSize:56,marginBottom:16}}>🎯</div>
                  <div style={{fontSize:18,fontWeight:700,color:"rgba(255,255,255,0.3)",marginBottom:8}}>No leads yet</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.2)",lineHeight:1.7,marginBottom:28}}>Chat → Prospecting Agent →<br/><em style={{color:"rgba(255,255,255,0.4)"}}>"Find 10 plumbers in Nashville with no website"</em></div>
                  <button onClick={()=>{setActiveAgent(AGENTS.find(a=>a.id==="prospector"));setTab("chat");}} style={{background:G.purple,border:"none",borderRadius:10,padding:"12px 24px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>Open Prospecting Agent →</button>
                </div>
              ):(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:"32px 1fr 120px 90px 70px 60px 160px",gap:0,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,0.02)"}}>
                    {["","Business","Phone","Status","Rating","Rev.","Actions"].map((h,i)=>(
                      <div key={i} style={{fontSize:9,fontWeight:700,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{h}</div>
                    ))}
                  </div>
                  {filteredLeads.map((lead,i)=>(
                    <div key={lead.id} style={{display:"grid",gridTemplateColumns:"32px 1fr 120px 90px 70px 60px 160px",gap:0,padding:"11px 16px",borderBottom:i<filteredLeads.length-1?`1px solid rgba(255,255,255,0.03)`:"none",background:selectedLeads.has(lead.id)?"rgba(232,121,249,0.04)":"transparent",alignItems:"center"}}>
                      <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={()=>setSelectedLeads(p=>{const n=new Set(p);n.has(lead.id)?n.delete(lead.id):n.add(lead.id);return n;})} style={{accentColor:"#E879F9",width:13,height:13,cursor:"pointer"}}/>
                      <div style={{minWidth:0,paddingRight:8}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.name}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:1}}>{lead.industry} · {lead.city}</div>
                      </div>
                      <div style={{fontSize:11,color:lead.phone?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.15)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.phone||"—"}</div>
                      <div>{lead.hasWebsite?<span style={{fontSize:10,color:"rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.04)",borderRadius:5,padding:"3px 8px"}}>Has site</span>:<span style={{fontSize:10,fontWeight:700,color:"#F472B6",background:"rgba(244,114,182,0.1)",borderRadius:5,padding:"3px 8px",border:"1px solid rgba(244,114,182,0.2)"}}>🔥 No site</span>}</div>
                      <div style={{fontSize:11,color:lead.rating?"#FBBF24":"rgba(255,255,255,0.2)",fontWeight:600}}>{lead.rating?`★ ${lead.rating}`:"—"}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{lead.reviews||"—"}</div>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setLeads(p=>p.map(l=>l.id===lead.id?{...l,contacted:!l.contacted}:l))} style={{background:lead.contacted?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.04)",border:lead.contacted?"1px solid rgba(52,211,153,0.25)":`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:600,color:lead.contacted?"#34D399":C.muted,cursor:"pointer"}}>{lead.contacted?"✓":"○"}</button>
                        <button onClick={()=>buildWebsite(lead)} disabled={buildingWebsite===lead.id} style={{background:buildingWebsite===lead.id?"rgba(255,255,255,0.04)":G.purple,border:"none",borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:700,color:buildingWebsite===lead.id?"rgba(255,255,255,0.3)":"#fff",cursor:buildingWebsite===lead.id?"not-allowed":"pointer",whiteSpace:"nowrap"}}>{buildingWebsite===lead.id?"···":"🌐 Build"}</button>
                        <button onClick={()=>setLeads(p=>p.filter(l=>l.id!==lead.id))} style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.12)",borderRadius:6,padding:"4px 7px",fontSize:10,color:"rgba(239,68,68,0.5)",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {tab==="chat"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:`linear-gradient(90deg,${activeAgent.color}09,transparent)`}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${activeAgent.color}18`,border:`1px solid ${activeAgent.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{activeAgent.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{activeAgent.full}</div><div style={{fontSize:11,color:C.muted}}>{activeAgent.tag}</div></div>
              {currentChat.length>0&&<button onClick={()=>setChats(p=>({...p,[activeAgent.id]:[]}))} style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:600,color:"rgba(239,68,68,0.6)",cursor:"pointer"}}>Clear</button>}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
              {currentChat.length===0&&(
                <div style={{margin:"auto",textAlign:"center",padding:"40px 20px"}}>
                  <div style={{fontSize:48,marginBottom:14}}>{activeAgent.icon}</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.5px",marginBottom:6}}>{activeAgent.full}</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:28,lineHeight:1.7}}>{activeAgent.tag}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:7,maxWidth:360,margin:"0 auto"}}>
                    {(activeAgent.id==="prospector"?["Find me 10 plumbers in Nashville TN with no website","Find restaurants in Austin TX that don't have a website","Find electricians in Chicago with no online presence"]:["What should I focus on this week?","Give me your top recommendation for getting more clients.","Review my approach and tell me what to improve."]).map(s=>(
                      <button key={s} onClick={()=>setChatInput(s)} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${activeAgent.color}22`,borderRadius:10,padding:"10px 14px",fontSize:12,color:"rgba(255,255,255,0.45)",cursor:"pointer",textAlign:"left",fontFamily:"inherit",lineHeight:1.4,transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.target.style.background=`${activeAgent.color}12`;e.target.style.color="rgba(255,255,255,0.75)";}}
                        onMouseLeave={e=>{e.target.style.background="rgba(255,255,255,0.03)";e.target.style.color="rgba(255,255,255,0.45)";}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {currentChat.map((msg,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.2)",marginBottom:5,paddingLeft:2,letterSpacing:"0.06em",textTransform:"uppercase"}}>{msg.role==="user"?"You":activeAgent.name}</div>
                  <div style={{maxWidth:"78%",padding:"11px 15px",borderRadius:14,fontSize:13,lineHeight:1.75,background:msg.role==="user"?`linear-gradient(135deg,${activeAgent.color},${activeAgent.color}CC)`:"rgba(255,255,255,0.04)",color:msg.role==="user"?"#fff":"#C8D6E8",border:msg.role==="assistant"?`1px solid rgba(255,255,255,0.06)`:"none",whiteSpace:"pre-wrap",boxShadow:msg.role==="user"?`0 4px 20px ${activeAgent.color}33`:"none"}}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
                  <div style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.2)",marginBottom:5,paddingLeft:2,letterSpacing:"0.06em",textTransform:"uppercase"}}>{activeAgent.name}</div>
                  <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.06)`,borderRadius:14,padding:"11px 16px",display:"flex",gap:5,alignItems:"center"}}>
                    {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:activeAgent.color,animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite`,opacity:0.7}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,flexShrink:0,background:"rgba(0,0,0,0.15)"}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} placeholder={activeAgent.id==="prospector"?"Ask Prospecting Agent to find leads...":`Message ${activeAgent.full}...`}
                style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 16px",fontSize:13,color:C.text,fontFamily:"inherit",outline:"none"}}
                onFocus={e=>e.target.style.borderColor=activeAgent.color+"66"} onBlur={e=>e.target.style.borderColor=C.border}/>
              <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{background:chatLoading||!chatInput.trim()?"rgba(255,255,255,0.04)":`linear-gradient(135deg,${activeAgent.color},${activeAgent.color}CC)`,border:"none",borderRadius:12,padding:"11px 22px",fontSize:12,fontWeight:700,color:chatLoading||!chatInput.trim()?"rgba(255,255,255,0.2)":"#fff",cursor:chatLoading||!chatInput.trim()?"not-allowed":"pointer",transition:"all 0.2s"}}>Send</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.35;} 30%{transform:translateY(-5px);opacity:1;} }
        input::placeholder { color:rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
