'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Check,CreditCard,Mail,Play,Users} from 'lucide-react';
import Dialog from './dialog';
import type {ServiceName,ServiceSetupItem,SetupIntent} from '../../server/service-setup';

const copy={
    payments:{name:'Payments',icon:CreditCard,description:'Subscriptions, checkout and payments to your barn.',target:'Subscriptions',action:'Manage subscriptions',steps:['Confirm the business and its representative.','Verify identity and the bank account for payouts.','Review payment status, publish a plan and test enrollment.'],note:'The existing Stripe connection is managed under Payments below. Embedded onboarding is planned; this preview does not create or replace a Stripe account.'},
    messaging:{name:'Email & SMS',icon:Mail,description:'Prepared reminders and messages to the right families.',target:'Communications',action:'Prepare messages',steps:['Confirm your barn’s name, contact details and sending identity.','Complete SMS business registration and review communication preferences.','Preview prepared reminders, choose timing and review a test before delivery.'],note:'Twilio SMS and SendGrid email delivery are not connected. Registration, sender verification, suppression synchronization and delivery testing are required before messages can send.'},
    video:{name:'Learning videos',icon:Play,description:'Upload once. Share with selected riders and groups.',target:'Learning Library',action:'Open Learning Library',steps:['Choose a video from your device.','Review its title and the riders who can access it.','Publish to their libraries, then optionally announce it to families.'],note:'Cloudflare Stream native uploads and private playback require the platform integration. Development MP4/PDF uploads and video links are available. Optimized Stream delivery remains unconnected; reviewing this flow does not activate it.'},
    payroll:{name:'Payroll',icon:Users,description:'Set up staff, review actual work and prepare pay.',target:'Barn team',action:'Open staff & payroll',steps:['Confirm the employer, bank account and payroll schedule through secure provider forms.','Add workers, or migrate year-to-date payroll and tax history with provider guidance.','Invite workers to complete secure forms, review actual work and submit payroll.'],note:'Embedded payroll requires provider approval and integration. No bank details, tax identifiers, worker invitations or money movement are collected or initiated here. Approved work and CSV export are available today.'},
} as const;
const providerRequirements:Record<ServiceName,{needed:string;recovery:string;url:string}>={
    payments:{needed:'Stripe determines required fields from country, business type, capabilities and outstanding requirements. Its embedded form collects the applicable business, representative, identity and payout information. We must use those returned requirements rather than a fixed form.',recovery:'Incomplete verification must return the owner to the provider’s outstanding requirements. Account connection alone does not prove that checkout, credits and renewals passed sandbox verification.',url:'https://docs.stripe.com/connect/embedded-onboarding'},
    messaging:{needed:'US 10DLC setup requires the appropriate business profile and brand path, campaign purpose, opt-in flow and sample messages. Sole-proprietor requirements differ. SendGrid requires verified sending identity; using a custom domain requires DNS authentication.',recovery:'Pending or rejected SMS registration must keep SMS disabled and show the provider’s reason. Email sender verification, bounces and unsubscribes need their own statuses. A prepared automation cannot bypass these gates.',url:'https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/collect-business-info'},
    video:{needed:'The platform must generate an authorized upload URL and a maximum upload duration. After processing, EquestrianOS must check family access before issuing a private playback token. Barn owners need no Cloudflare login.',recovery:'Failed or interrupted processing must offer retry without claiming the resource is ready. Upload limits and storage availability must be checked before accepting a new upload.',url:'https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/'},
    payroll:{needed:'Employee payroll onboarding includes accepted terms, filing/mailing/work locations, employer bank verification, federal tax setup, industry, anchored pay schedule, employee onboarding, state tax setup and signed employer forms. Contractor-only setup follows a different provider path.',recovery:'Setup must show outstanding provider steps and approval status. Existing payroll also needs migration review. No payroll can be submitted before company approval and required worker setup are complete.',url:'https://docs.gusto.com/embedded-payroll/docs/onboard-a-company'},
};

function status(item:ServiceSetupItem){
    if(item.id==='payments'&&item.configured&&item.connected)return item.live?'Live account connected':'Test account connected';
    if(item.id==='payments'&&item.configured)return 'Account setup needed';
    return 'Not connected';
}
export default function ServiceSetup({onNavigate,compact=false,focus}:{onNavigate?:(view:string)=>void;compact?:boolean;focus?:ServiceName}){
    const [items,setItems]=useState<ServiceSetupItem[]|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[selected,setSelected]=useState<ServiceName|null>(null),[step,setStep]=useState(0),[busy,setBusy]=useState(false);
    const [intent,setIntent]=useState<SetupIntent>({service:'payroll',reviewed:false,payrollSource:'new',payFrequency:'biweekly'});
    async function load(){setError('');try{const response=await fetch('/api/services');const data=await response.json() as {services:ServiceSetupItem[];error?:string};if(!response.ok)throw Error(data.error??'Unable to load service setup.');setItems(data.services);}catch(e){setError(e instanceof Error?e.message:'Unable to load service setup.');}}
    useEffect(()=>{void load();},[]);
    function open(item:ServiceSetupItem){setSelected(item.id);setStep(0);setError('');setNotice('');setIntent(item.intent??{service:item.id,reviewed:false,...(item.id==='payroll'?{payrollSource:'new' as const,payFrequency:'biweekly' as const}:{}),...(item.id==='messaging'?{notifyFamilies:false}:{})});}
    const visible=items?.filter(item=>!focus||item.id===focus),item=items?.find(service=>service.id===selected),details=selected?copy[selected]:null;
    async function save(){if(!item)return;setBusy(true);setError('');try{const response=await fetch('/api/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...intent,reviewed:true})});const data=await response.json() as {services:ServiceSetupItem[];error?:string};if(!response.ok)throw Error(data.error??'Unable to save setup preferences.');setItems(data.services);setSelected(null);setNotice('Setup preferences saved. Provider connection status is unchanged.');}catch(e){setError(e instanceof Error?e.message:'Unable to save preferences.');}finally{setBusy(false);}}
    if(items&&visible?.length===0)return null;
    return <section className="panel" id="academy-services">
        <div className="panel-heading"><div><h2>{compact?'Your connected services':'Services & setup'}</h2><p>{compact?'Prepare your workflows and see what is connected.':'One workspace for your team. Review the setup and connection status for each service.'}</p></div></div>
        {!items&&!error&&<p className="empty">Loading service status…</p>}
        {error&&!selected&&<div role="alert" className="error">{error}<button type="button" className="secondary" onClick={()=>void load()}>Try again</button></div>}
        {notice&&<p role="status" className="form-note">{notice}</p>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',gap:16}}>
            {visible?.map(service=>{const content=copy[service.id],Icon=content.icon;return <article key={service.id} style={{border:'1px solid var(--border, #dce2df)',borderRadius:12,padding:20,display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}><Icon size={20} aria-hidden="true"/><h3 style={{margin:0}}>{content.name}</h3></div>
                <small>{service.provider} · {status(service)}</small>
                {!compact&&<p style={{margin:0}}>{content.description}</p>}
                {service.intent?.reviewed&&<small style={{display:'flex',alignItems:'center',gap:8}}><Check size={14}/>Setup reviewed locally</small>}
                <button type="button" className="secondary" style={{alignSelf:'flex-start',marginTop:'auto'}} onClick={()=>open(service)}>Review setup<ArrowRight size={15}/></button>
            </article>})}
        </div>
        {!compact&&<p className="form-note" style={{marginTop:16}}>Reviewing a setup saves preferences only. Provider verification, sandbox testing and live activation are separate steps.</p>}
        {selected&&item&&details&&<Dialog title={details.name+' setup'} onClose={()=>{if(!busy)setSelected(null);}} onBack={step?()=>setStep(step-1):undefined} backDisabled={busy} backLabel="Back to setup overview">
            <div style={{display:'grid',gap:20}}>
                <div><strong>{details.name} · {item.provider}</strong><p style={{margin:'8px 0 0'}}>{status(item)}. {item.intent?.reviewed?'Setup has been reviewed in EquestrianOS.':'Review how setup will work before connecting the provider.'}</p></div>
                {step===0?<>
                    <ol style={{display:'grid',gap:16,paddingLeft:24,margin:0}}>{details.steps.map(text=><li key={text} style={{paddingLeft:4}}>{text}</li>)}</ol>
                    <p className="form-note">{details.note}</p>
                    <details><summary>What connection will require</summary><div style={{display:'grid',gap:12,paddingTop:12}}><p style={{margin:0}}>{providerRequirements[selected].needed}</p><p style={{margin:0}}>{providerRequirements[selected].recovery}</p><a href={providerRequirements[selected].url} target="_blank" rel="noopener noreferrer">Official provider requirements</a>{selected==='messaging'&&<a href="https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication" target="_blank" rel="noopener noreferrer">Email sender authentication</a>}</div></details>
                    <button type="button" className="primary" onClick={()=>setStep(1)}>Continue<ArrowRight size={15}/></button>
                </>:<>
                    {selected==='payroll'&&<>
                        <label>Are you starting payroll or moving it?<select disabled={!item.manage} value={intent.payrollSource??'new'} onChange={event=>setIntent({...intent,payrollSource:event.target.value as 'new'|'existing'})}><option value="new">Starting payroll for the first time</option><option value="existing">Moving existing payroll</option></select></label>
                        {intent.payrollSource==='existing'&&<p className="form-note">The provider will need prior wages, taxes and payroll history to migrate accurately. This step records your preference; it does not import history.</p>}
                        <label>Preferred pay schedule<select disabled={!item.manage} value={intent.payFrequency??'biweekly'} onChange={event=>setIntent({...intent,payFrequency:event.target.value as SetupIntent['payFrequency']})}><option value="weekly">Every week</option><option value="biweekly">Every two weeks</option><option value="semimonthly">Twice a month</option><option value="monthly">Every month</option></select></label>
                        <p className="form-note">Provider setup will confirm available schedules and payroll requirements. Worker classification is separate from barn role, hours and pay basis.</p>
                    </>}
                    {selected==='messaging'&&<label className="checkbox"><input disabled={!item.manage} type="checkbox" checked={intent.notifyFamilies??false} onChange={event=>setIntent({...intent,notifyFamilies:event.target.checked})}/><span>Prepare optional family announcements when new learning resources are published. Each audience and message will still need review.</span></label>}
                    {selected==='payments'&&<p>Plans and per-rider benefits are managed in Subscriptions. The existing Stripe setup remains available under Payments. This review does not change connected accounts, checkout or credit rules.</p>}
                    {selected==='video'&&<p>Resources can be prepared in Learning Library. Upload processing, secure playback and usage allowances will be connected through Cloudflare Stream. This review does not upload or publish a file.</p>}
                    <p className="form-note">{details.note}</p>
                    {error&&<p className="error" role="alert">{error}</p>}
                    {item.manage?<button type="button" className="primary" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save setup preferences'}</button>:<p className="form-note">You have view-only access to this service. An authorized administrator can save setup preferences.</p>}
                    {onNavigate&&<button type="button" className="secondary" disabled={busy} onClick={()=>{setSelected(null);onNavigate(details.target);}}>{details.action}<ArrowRight size={15}/></button>}
                </>}
            </div>
        </Dialog>}
    </section>;
}
