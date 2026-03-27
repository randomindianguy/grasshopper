import { useState, useEffect, useRef } from "react";

/* ─── Partner Ecosystem Data ─── */
const PARTNERS = {
  fis: { name: "FIS IBS", role: "Core Banking", color: "#4338CA" },
  narmi: { name: "Narmi", role: "Digital Platform", color: "#0D9488" },
  mantl: { name: "MANTL", role: "Account Origination", color: "#B45309" },
  alloy: { name: "Alloy", role: "Identity & KYC", color: "#BE185D" },
  autobooks: { name: "Autobooks", role: "Invoicing & Payments", color: "#059669" },
  plaid: { name: "Plaid", role: "Account Linking", color: "#2563EB" },
  hummingbird: { name: "Hummingbird", role: "BSA Compliance", color: "#DC2626" },
  fiverity: { name: "FiVerity", role: "Fraud Detection", color: "#9333EA" },
  mx: { name: "MX", role: "Data Aggregation", color: "#0891B2" },
  lendio: { name: "Lendio", role: "SBA Lending", color: "#CA8A04" },
  enfi: { name: "EnFi", role: "Credit Risk AI", color: "#6D28D9" },
  visa: { name: "Visa", role: "Debit Card", color: "#1D4ED8" },
  internal: { name: "Internal", role: "Manual Review / CS", color: "#71717A" },
};

const LIFECYCLE = [
  { id: "onboarding", label: "Onboarding", partners: ["mantl", "alloy", "plaid"] },
  { id: "core", label: "Core", partners: ["fis"] },
  { id: "experience", label: "Experience", partners: ["narmi", "mx"] },
  { id: "banking", label: "Daily Banking", partners: ["autobooks", "visa"] },
  { id: "compliance", label: "Compliance", partners: ["hummingbird", "fiverity", "internal"] },
  { id: "lending", label: "Lending", partners: ["lendio", "enfi"] },
];

const EXAMPLES = [
  {
    label: "Account closed post-approval",
    text: "Applied for a business checking account, was approved within minutes, deposited $10,000. Three weeks later, received a notice that my account was being closed with no explanation. Took over two months to get my funds returned. Had to fill out a release form and still waited weeks. No one could explain what triggered the closure.",
    source: "Trustpilot / BBB (n≈12 similar)",
    result: {
      primary_partner: { id: "mantl", name: "MANTL" },
      secondary_partner: { id: "internal", name: "Internal" },
      seam_type: "between-partner",
      lifecycle_stage: "onboarding",
      severity: "critical",
      summary: "Automated onboarding approval contradicted by manual compliance closure weeks later, with no client-facing explanation bridging the two decisions.",
      seam_explanation: "MANTL auto-approves 97% of applications in minutes using Alloy's identity checks. But Grasshopper's internal compliance team runs a separate, slower review using Hummingbird's BSA monitoring — often weeks after the account is live and funded. These two systems don't share a unified risk verdict. When compliance flags something MANTL already approved, the client experiences a bewildering reversal with no explanation, because the closure reason lives in Hummingbird/Internal systems that the client-facing Narmi dashboard can't surface.",
      suggested_owner: "Grasshopper Internal Compliance + MANTL integration team. Investigate whether MANTL's approval criteria can incorporate Hummingbird's risk signals earlier, or whether a provisional-account state can be surfaced in Narmi's UI during the compliance review window.",
      pattern_signal: "This is Grasshopper's highest-frequency seam failure. It reveals a fundamental timing mismatch: onboarding is optimized for speed (minutes) while compliance operates on a different clock (weeks). Every instance generates a 1-star review and potential regulatory attention. The product team should instrument the gap between MANTL approval timestamp and Internal review completion timestamp — that delta IS the complaint."
    }
  },
  {
    label: "ACH hold blocks payroll",
    text: "Five day hold on an ACH transfer with no logical reason given. When I contacted support, I just got chatbots. No human being could explain why my transfer was held or when it would clear. This is a business account — I need to make payroll. The amount was only $3,200.",
    source: "Trustpilot review",
    result: {
      primary_partner: { id: "fis", name: "FIS IBS" },
      secondary_partner: { id: "hummingbird", name: "Hummingbird" },
      seam_type: "between-partner",
      lifecycle_stage: "daily_banking",
      severity: "high",
      summary: "ACH transfer held by compliance screening with no status visibility or resolution path in the client-facing UI.",
      seam_explanation: "When a client initiates an ACH transfer, FIS processes the transaction while Hummingbird screens it for BSA/AML compliance. If Hummingbird flags the transaction, it enters a hold state — but that hold reason and estimated resolution time don't flow back to the Narmi UI that the client sees. The support team (operating in Narmi's tools) can see the hold but can't see Hummingbird's screening status or override it. The client gets a generic 'hold' with no explanation because the explanation lives in a system the support layer can't access.",
      suggested_owner: "Narmi + Hummingbird integration. Build a hold-status API that exposes non-sensitive hold metadata (estimated timeline, required action if any) from Hummingbird to the Narmi dashboard, so clients and support agents have a resolution path.",
      pattern_signal: "ACH holds are operationally correct but experientially broken. The issue isn't the hold — it's that hold status is invisible across the compliance-to-experience boundary. For a bank serving payroll-dependent SMBs, a 5-day hold with no ETA is a business-critical failure. Instrument: how many ACH holds exceed 48 hours, and what % have zero client-facing status updates?"
    }
  },
  {
    label: "Wire flagged, no resolution path",
    text: "Opened an account for my LLC, received member wires without issue. But when I tried to send an outbound wire, it was flagged. It's been 48 hours, I can't get in touch with anyone from the right team. I've consistently asked what documentation they need but can't get a straight answer.",
    source: "DepositAccounts review",
    result: {
      primary_partner: { id: "hummingbird", name: "Hummingbird" },
      secondary_partner: { id: "narmi", name: "Narmi" },
      seam_type: "between-partner",
      lifecycle_stage: "compliance",
      severity: "high",
      summary: "Outbound wire flagged by compliance but the client-facing support team can't see what's needed or who owns resolution.",
      seam_explanation: "Inbound wires flow through a different compliance path than outbound wires — inbound is lower scrutiny, outbound triggers enhanced review through Hummingbird. When Hummingbird flags an outbound wire, the required documentation lives in Hummingbird's compliance workflow, but the client service team in Narmi can't access or relay that information. The client is stuck asking 'what do you need?' while support asks the compliance team the same question internally. The bottleneck is a missing handoff protocol between Hummingbird's flagging system and Narmi's support tooling.",
      suggested_owner: "Hummingbird + Internal Compliance + Narmi support tools. Create a structured 'documentation request' object that Hummingbird generates when flagging a transaction, which flows to the Narmi support view so agents can tell the client what's needed.",
      pattern_signal: "Asymmetric compliance treatment (inbound easy, outbound hard) creates a trust trap — the client thinks everything works because inbound wires succeed, then hits an unexpected wall on outbound. Consider whether onboarding can set expectations about outbound wire review upfront. The 48-hour response gap suggests the compliance team may not have SLAs that match client expectations for wire timing."
    }
  },
  {
    label: "Missing Xero integration",
    text: "I like everything about Grasshopper except two things: 1) I don't see that it integrates with Xero so reconciliations are a bit of a pain. 2) Online transfers took longer than I was expecting. Otherwise, no complaints. Would love to see Xero added.",
    source: "Trustpilot review",
    result: {
      primary_partner: { id: "narmi", name: "Narmi" },
      secondary_partner: null,
      seam_type: "within-partner",
      lifecycle_stage: "experience",
      severity: "low",
      summary: "Missing accounting integration (Xero) limits reconciliation workflows for clients not using QuickBooks.",
      seam_explanation: "Grasshopper currently supports QuickBooks and Autobooks for accounting integration, both surfaced through Narmi's platform. Xero integration would need to be built by Narmi as a platform-level integration or as a direct API connection. This is a within-partner gap in Narmi's integration catalog rather than a seam failure between systems.",
      suggested_owner: "Narmi product team (integration roadmap). Note: Grasshopper's own Trustpilot response indicated a Xero integration was in beta as of late 2025 — check current status before prioritizing.",
      pattern_signal: "Low severity individually, but a signal about client mix evolving. QuickBooks dominates US SMB accounting, but Xero's share is growing — especially among the startup and international-founder segments Grasshopper targets with its Accelerator product. Track: how many clients mention Xero in onboarding or support, and does it correlate with Accelerator (startup) vs Innovator (SMB) segments?"
    }
  },
];

const SEVERITY = {
  low: { label: "Low", bg: "#ECFDF5", text: "#047857", border: "#A7F3D0", dot: "#10B981" },
  medium: { label: "Medium", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
  high: { label: "High", bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", dot: "#F97316" },
  critical: { label: "Critical", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", dot: "#EF4444" },
};

const SEAM_TYPE_CONFIG = {
  "within-partner": { label: "Within-Partner", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "between-partner": { label: "Seam Failure", bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
};

export default function Seam() {
  const [selectedExample, setSelectedExample] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const [result, setResult] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [animating, setAnimating] = useState(false);
  const resultRef = useRef(null);

  const handleExample = (idx) => {
    if (animating) return;
    setAnimating(true);
    setResult(null);
    setSelectedExample(idx);
    setCustomInput(EXAMPLES[idx].text);
    setTimeout(() => {
      setResult(EXAMPLES[idx].result);
      setAnimating(false);
    }, 650);
  };

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, [result]);

  const hl = result ? [result.primary_partner?.id, result.secondary_partner?.id].filter(Boolean) : [];
  const sev = result ? SEVERITY[result.severity] : null;
  const st = result ? SEAM_TYPE_CONFIG[result.seam_type] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulseBorder{0%,100%{border-color:#F97316;box-shadow:0 0 0 0 rgba(249,115,22,0.08)}50%{border-color:#FB923C;box-shadow:0 2px 12px rgba(249,115,22,0.13)}}
        .fu{animation:fadeUp .4s ease-out forwards}
        .fu1{animation-delay:.06s;opacity:0}.fu2{animation-delay:.14s;opacity:0}.fu3{animation-delay:.22s;opacity:0}.fu4{animation-delay:.3s;opacity:0}
        .shim{background:linear-gradient(90deg,#E7E5E4 25%,#F5F5F0 50%,#E7E5E4 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
        .phl{animation:pulseBorder 2s ease-in-out infinite;transform:scale(1.06)}
        .sd{background:repeating-linear-gradient(90deg,#F97316 0 5px,transparent 5px 10px);height:2px}
        textarea:focus{outline:none;box-shadow:0 0 0 2px rgba(249,115,22,.14);border-color:#F97316}
        .eb{transition:all .2s;cursor:pointer;border:1px solid #E7E5E4;border-radius:6px;padding:6px 14px;font-size:12.5px;font-weight:500;background:#FFF;color:#57534E;font-family:'DM Sans',system-ui,sans-serif}
        .eb:hover{border-color:#D6D3D1;background:#FAFAF8}.eb.on{border-color:#FDBA74;background:#FFF7ED;color:#C2410C}
      `}</style>
      <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#FAFAF8",minHeight:"100vh",color:"#1C1917"}}>

        {/* Header */}
        <div style={{borderBottom:"1px solid #E7E5E4",background:"#FFF"}}>
          <div style={{maxWidth:860,margin:"0 auto",padding:"28px 24px 22px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
                  <h1 style={{fontFamily:"'Newsreader',Georgia,serif",fontSize:30,fontWeight:600,letterSpacing:"-.025em"}}>Seam</h1>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#A8A29E"}}>v0.1</span>
                </div>
                <p style={{fontSize:14.5,color:"#57534E",lineHeight:1.55,maxWidth:540}}>
                  Classify client complaints by partner system. Find where the multi-partner architecture creates friction — not within any single partner, but at the seams between them.
                </p>
              </div>
              <button onClick={()=>setShowAbout(!showAbout)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#78716C",background:"none",border:"1px solid #D6D3D1",borderRadius:6,padding:"6px 14px",cursor:"pointer",whiteSpace:"nowrap"}}>
                {showAbout?"close":"why this exists"}
              </button>
            </div>
            {showAbout&&(
              <div className="fu" style={{marginTop:18,padding:"20px 24px",background:"#FAFAF8",borderRadius:10,border:"1px solid #E7E5E4",fontSize:14,color:"#57534E",lineHeight:1.65}}>
                <p style={{fontFamily:"'Newsreader',Georgia,serif",fontSize:17,color:"#1C1917",marginBottom:10,fontWeight:500}}>Grasshopper's product is a composition of 12+ partner systems.</p>
                <p style={{marginBottom:10}}>A single client journey passes through MANTL (application) → Alloy (identity) → FIS (core banking) → Narmi (dashboard) → Autobooks (invoicing). Each partner owns its own data, analytics, and release cycle.</p>
                <p style={{marginBottom:10}}>Client friction doesn't usually live inside any single partner — it emerges at the handoffs. An automated approval from MANTL/Alloy gets contradicted by a manual compliance flag weeks later. A wire gets flagged by Hummingbird, but support (operating in Narmi) can't see why.</p>
                <p style={{marginBottom:0}}>This tool classifies complaints by which partner boundary is breaking, so the product team can systematically track seam failures — instead of treating each one as an isolated incident.</p>
                <div style={{marginTop:14,padding:"12px 16px",background:"#FFF7ED",borderRadius:8,border:"1px solid #FDBA74",fontSize:13,color:"#9A3412",lineHeight:1.55}}>
                  <strong>In production,</strong> this classifier would be powered by an LLM (e.g. Claude API) to analyze any complaint, NPS verbatim, or interview note in real time — automatically tagging it to the partner map and surfacing systemic patterns across hundreds of tickets. What you see here uses pre-analyzed examples to demonstrate the output format and analytical depth.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Partner Map */}
        <div style={{borderBottom:"1px solid #E7E5E4",background:"#FFF"}}>
          <div style={{maxWidth:860,margin:"0 auto",padding:"14px 24px",overflowX:"auto"}}>
            <div style={{display:"flex",gap:4,minWidth:"fit-content"}}>
              {LIFECYCLE.map((stage,si)=>(
                <div key={stage.id} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                  <div style={{background:"#FAFAF8",borderRadius:8,padding:"8px 10px",border:"1px solid #E7E5E4"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#A8A29E",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>{stage.label}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {stage.partners.map(pid=>{
                        const isHl=hl.includes(pid);
                        return(
                          <div key={pid} className={isHl?"phl":""} style={{fontSize:11,fontWeight:500,padding:"3px 8px",borderRadius:4,background:isHl?"#FFF7ED":"#FFF",border:`1.5px solid ${isHl?"#F97316":"#E7E5E4"}`,color:isHl?"#C2410C":"#57534E",transition:"all .3s"}}>
                            {PARTNERS[pid].name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {si<LIFECYCLE.length-1&&<span style={{color:"#D6D3D1",fontSize:13,padding:"0 1px"}}>›</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{maxWidth:860,margin:"0 auto",padding:"28px 24px 80px"}}>
          <div style={{marginBottom:18}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#A8A29E",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Real complaints from Trustpilot, BBB & DepositAccounts</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {EXAMPLES.map((ex,i)=>(
                <button key={i} className={`eb ${selectedExample===i?"on":""}`} onClick={()=>handleExample(i)}>{ex.label}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <textarea value={customInput} onChange={e=>{setCustomInput(e.target.value);setSelectedExample(null);setResult(null)}} placeholder="Select an example above, or paste your own complaint..." rows={4} style={{width:"100%",fontSize:14,lineHeight:1.6,padding:"14px 16px",borderRadius:10,border:"1px solid #D6D3D1",resize:"vertical",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#1C1917",background:"#FFF"}}/>
          </div>

          {selectedExample!==null&&(
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"#A8A29E",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
              <span style={{display:"inline-block",width:4,height:4,borderRadius:"50%",background:"#D6D3D1"}}/>
              Source: {EXAMPLES[selectedExample].source}
            </div>
          )}

          {customInput&&selectedExample===null&&(
            <div style={{fontSize:13,color:"#78716C",background:"#FFF",border:"1px solid #E7E5E4",borderRadius:8,padding:"12px 16px",marginBottom:20,lineHeight:1.55}}>
              <strong style={{color:"#1C1917"}}>Custom complaint analysis</strong> — In the deployed version, this input gets sent to the Claude API, which classifies it against the full partner ecosystem in real time and returns structured analysis like the examples above. The system prompt encodes all 12 partner systems, their data ownership boundaries, and known seam failure patterns.
            </div>
          )}

          {animating&&(
            <div style={{marginBottom:24}}>
              <div className="shim" style={{height:20,width:"60%",marginBottom:10}}/>
              <div className="shim" style={{height:14,width:"40%",marginBottom:8}}/>
              <div className="shim" style={{height:14,width:"80%",marginBottom:8}}/>
              <div className="shim" style={{height:14,width:"55%"}}/>
            </div>
          )}

          {result&&!animating&&(
            <div ref={resultRef} className="fu" style={{borderRadius:12,border:"1px solid #E7E5E4",background:"#FFF",overflow:"hidden"}}>
              {/* Summary */}
              <div style={{padding:"18px 24px"}}>
                <p style={{fontFamily:"'Newsreader',Georgia,serif",fontSize:19,fontWeight:500,color:"#1C1917",lineHeight:1.4,marginBottom:14,maxWidth:580}}>{result.summary}</p>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:500,padding:"3px 10px",borderRadius:99,background:st.bg,color:st.text,border:`1px solid ${st.border}`,textTransform:"uppercase",letterSpacing:".04em"}}>{st.label}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:500,padding:"3px 10px",borderRadius:99,background:sev.bg,color:sev.text,border:`1px solid ${sev.border}`,textTransform:"uppercase",letterSpacing:".04em",display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:sev.dot,display:"inline-block"}}/>
                    {sev.label}
                  </span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:500,padding:"3px 10px",borderRadius:99,background:"#FAFAF8",color:"#78716C",border:"1px solid #E7E5E4",textTransform:"uppercase",letterSpacing:".04em"}}>{result.lifecycle_stage?.replace("_"," ")}</span>
                </div>
              </div>

              {/* Partners */}
              <div className="fu fu1" style={{borderTop:"1px solid #F5F5F0",padding:"18px 24px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{padding:"10px 16px",borderRadius:8,border:`2px solid ${PARTNERS[result.primary_partner.id]?.color}`}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#A8A29E",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Primary</div>
                  <div style={{fontSize:15,fontWeight:600,color:PARTNERS[result.primary_partner.id]?.color}}>{result.primary_partner.name}</div>
                  <div style={{fontSize:11,color:"#78716C"}}>{PARTNERS[result.primary_partner.id]?.role}</div>
                </div>
                {result.secondary_partner&&(
                  <>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div className="sd" style={{width:36}}/><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#F97316",letterSpacing:".1em",textTransform:"uppercase"}}>seam</span><div className="sd" style={{width:36}}/>
                    </div>
                    <div style={{padding:"10px 16px",borderRadius:8,border:`2px solid ${PARTNERS[result.secondary_partner.id]?.color}`}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#A8A29E",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Secondary</div>
                      <div style={{fontSize:15,fontWeight:600,color:PARTNERS[result.secondary_partner.id]?.color}}>{result.secondary_partner.name}</div>
                      <div style={{fontSize:11,color:"#78716C"}}>{PARTNERS[result.secondary_partner.id]?.role}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Analysis */}
              {[
                {label:"Seam Analysis",value:result.seam_explanation,icon:"⚡",d:"fu2"},
                {label:"Suggested Owner",value:result.suggested_owner,icon:"→",d:"fu3"},
                {label:"Pattern Signal",value:result.pattern_signal,icon:"◆",d:"fu4"},
              ].map((s,i)=>(
                <div key={i} className={`fu ${s.d}`} style={{borderTop:"1px solid #F5F5F0",padding:"18px 24px"}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:12,color:"#D6D3D1",marginTop:2,flexShrink:0}}>{s.icon}</span>
                    <div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#A8A29E",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{s.label}</div>
                      <p style={{fontSize:14,color:"#44403C",lineHeight:1.65}}>{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!result&&!animating&&(
            <div style={{textAlign:"center",padding:"44px 24px"}}>
              <div style={{fontFamily:"'Newsreader',Georgia,serif",fontSize:18,color:"#44403C",marginBottom:10,lineHeight:1.45,maxWidth:480,margin:"0 auto 10px"}}>
                Grasshopper runs 12 partner systems.<br/>When clients complain, the friction usually isn't in any single system — it's at the handoff between two.
              </div>
              <p style={{fontSize:13,color:"#A8A29E",maxWidth:420,margin:"0 auto",lineHeight:1.5}}>Select a real complaint above to see how it maps to the partner architecture. Each example is sourced from public reviews.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{borderTop:"1px solid #E7E5E4",background:"#FFF"}}>
          <div style={{maxWidth:860,margin:"0 auto",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:13,color:"#57534E"}}>Built by <a href="https://sidharthsundaram.com" target="_blank" rel="noopener noreferrer" style={{color:"#1C1917",fontWeight:600,textDecoration:"none",borderBottom:"1px solid #D6D3D1"}}>Sidharth Sundaram</a></div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#A8A29E",marginTop:2}}>PM Internship Application — Grasshopper Bank</div>
            </div>
            <div style={{display:"flex",gap:16}}>
              <a href="https://linkedin.com/in/sidharthsundaram/" target="_blank" rel="noopener noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#78716C",textDecoration:"none"}}>LinkedIn ↗</a>
              <a href="mailto:sundar84@purdue.edu" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#78716C",textDecoration:"none"}}>Email ↗</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
