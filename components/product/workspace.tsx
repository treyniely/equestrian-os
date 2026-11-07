'use client';
import ProductReference from './product-reference';
import LearningLibrary from './learning-library';
import Communications from './communications';
import ServiceSetup from './service-setup';
import ScheduleUndoToast from './schedule-undo-toast';
import type {ScheduleUndoReceipt} from '../../domain/schedule-undo';
import CategoryLabel,{LevelLabels} from './category-label';
import LevelEditor from './level-editor';
import ActionArrow from './action-arrow';

import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarDays, Users, UserRound, BookOpen, BookUser, MapPin, Settings, ShieldCheck, Menu, LogOut, ArrowUpRight, Check, ChevronRight, ClipboardList, CreditCard, MessagesSquare } from 'lucide-react';
import type { State, Save } from './types';
import Dialog, { FeedbackContext } from './dialog';
import Programs from './programs';
import PricingPlans from './pricing-plans';
import PayInputs from './pay-inputs';
import BarnWorkers from './barn-workers';
import Customers from './customers';
import ParentContact from './parent-contact';
import Sessions from './sessions';
import Team from './team';import BarnTeam from './barn-team';
import AcademyBranding from './academy-branding';
import AcademyIdentity from './academy-identity';
import BookingUpdates from './booking-updates';
import AcademyPayments from './academy-payments';
import AcademyHours from './academy-hours';
import AcademyContactSettings from './academy-contact';
import {can,roleGrants,type Feature} from '../../domain/permissions';
import Profiles,{upload} from './profiles';
import AcademyLogoUpload,{uploadPreparedLogo} from './academy-logo-upload';
import HorseIcon from './horse-icon';
import RidingSpaces from './riding-spaces';
import SetupGuide from './setup-guide';
import OverviewDashboard from './overview-dashboard';
import type {SetupStep} from '../../domain/onboarding';
const empty: State = { resources: [], bookings: [], customers: [], memberships: [], sessions: [], enrollments: [], reservations: [], drafts: [], audit: [] };
const nav = [['Overview', LayoutDashboard], ['Calendar', CalendarDays], ['Customers', BookUser], ['Communications', MessagesSquare], ['Lessons & Offerings', BookOpen], ['Learning Library', BookOpen], ['Subscriptions', CreditCard], ['Riders', Users], ['Horses', HorseIcon], ['Trainers', UserRound], ['Riding spaces', MapPin], ['Academy setup', Settings], ['Barn team',ClipboardList],['User Management',ShieldCheck],['Product reference', BookOpen],['Roadmap', ShieldCheck]] as const;
const kinds: Record<string, string> = { Riders: 'rider', Horses: 'horse', Trainers: 'trainer', 'Riding spaces': 'arena' };
export default function Workspace() {
    const [levelEditing,setLevelEditing]=useState<State['resources'][number]>();
    const [calendarFocus,setCalendarFocus]=useState('');
    const [scheduleUndo,setScheduleUndo]=useState<ScheduleUndoReceipt|null>(null);
    const [state, setState] = useState<State>(empty), [view, setView] = useState('Overview'), [loading, setLoading] = useState(true), [auth, setAuth] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [mobile, setMobile] = useState(false), [resourceKind, setResourceKind] = useState(''), [intent,setIntent]=useState(''),[contactParentId,setContactParentId]=useState(''),[uploadingLogo,setUploadingLogo]=useState(false),[preparedLogo,setPreparedLogo]=useState<File|null>(null),[preparingLogo,setPreparingLogo]=useState(false);
    useEffect(()=>{setPreparedLogo(null);setPreparingLogo(false)},[resourceKind]);
    useEffect(() => { fetch('/api/workspace').then(async (r) => { if (r.status === 401) {
        setAuth(true);
        return;
    } const d = await r.json() as State & {
        error: string;
    }; if (!r.ok)
        throw Error(d.error); setState(d);if(d.currentRole==='intern')setView('Barn team'); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
    const save: Save = async (data,onSaved) => { setBusy(true); setError(''); try {
        const r = await fetch('/api/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const d = await r.json() as State & {
            error: string;scheduleUndo?:ScheduleUndoReceipt;
        };
        if (!r.ok)
            throw Error(d.error);
        setState(d);onSaved?.(d);
        if(d.scheduleUndo)setScheduleUndo(d.scheduleUndo);
        if(data.action==='undoSchedule')setScheduleUndo(current=>current?.token===data.token?null:current);
        setNotice(['session','scheduleBatch','undoSchedule'].includes(String(data.action))?'':data.action === 'draft' ? 'Draft saved. Nothing has been sent.' : 'Saved to your academy workspace.');
        return true;
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save');
        return false;
    }
    finally {
        setBusy(false);
    } };
    const grants=state.permissions??roleGrants('owner');
    const [barnSection,setBarnSection]=useState<'operations'|'payroll'>('operations');
    const [workerRevision,setWorkerRevision]=useState(0);
    const canPayroll=can(grants,'timeApproval')||can(grants,'payroll');
    const showPayroll=canPayroll&&(barnSection==='payroll'||!can(grants,'interns'));
    const viewFeature:Record<string,Feature>={'Customers':'customers','Communications':'communications','Calendar':'schedule','Lessons & Offerings':'programs','Learning Library':'programs','Subscriptions':'billing','Riders':'riders','Horses':'horses','Trainers':'trainers','Riding spaces':'setup','Product reference':'setup','Academy setup':'setup','Barn team':'interns','User Management':'team'};
    const readOnly=view!=='Barn team'&&!!viewFeature[view]&&!can(grants,viewFeature[view],true);
    const canOpen=(label:string)=>label==='Barn team'?can(grants,'interns')||can(grants,'timeApproval')||can(grants,'payroll'):!viewFeature[label]||can(grants,viewFeature[label]);
    const go = (v: string) => {if(!canOpen(v))return; setView(v);setCalendarFocus(''); setMobile(false); setError('');setIntent('');setContactParentId(''); }, resources = (kind: string) => state.resources.filter(r => r.kind === kind && (kind !== 'lesson' || !r.details.archived));
 const openSetupStep=(step:SetupStep)=>{if(!can(grants,step.feature,true))return;go(step.target);if(step.kind==='academy'&&!step.done)setResourceKind('academy');else if(['trainer','horse','arena'].includes(step.kind)&&!resources(step.kind).length)setResourceKind(step.kind);else if(['lesson','session'].includes(step.kind)&&!step.done||step.kind==='customer'&&!state.customers.length)setIntent(step.kind);if(['contact','hours','branding','payments','levels','community','plan'].includes(step.kind))setIntent('setup-'+step.kind);};
 useEffect(()=>{if(!intent.startsWith('setup-'))return;const id=({'setup-contact':'academy-contact','setup-community':'academy-contact','setup-hours':'academy-hours','setup-branding':'academy-branding','setup-payments':'academy-payments','setup-levels':'academy-language','setup-plan':'academy-plans'} as Record<string,string>)[intent];if(id)document.getElementById(id)?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},[intent,view]);
    if (auth)
        return <div className="sign-in"><img src="/assets/eo-symbol-transparent.png" alt="EquestrianOS"/><h1>Your academy starts here.</h1><p>Sign in to your private development workspace.</p><a className="primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">Continue with ChatGPT <ArrowUpRight size={16}/></a><small>Development release · Use fictional data only.</small></div>;
    return <LevelLabels.Provider value={state.academyInfo?.levels??[]}><FeedbackContext.Provider value={error}><div className="app-shell"><aside className={mobile ? 'sidebar expanded' : 'sidebar'}><a className="logo" href="/"><img className="symbol" src="/assets/eo-symbol-transparent.png" alt=""/><img src="/assets/wordmark-transparent.png" alt="EquestrianOS"/></a><div className="academy"><div className="avatar">{resources('academy')[0]?.details.photoId?<img className="academy-logo" src={'/api/photos?id='+resources('academy')[0].details.photoId} alt="Academy logo"/>:'EO'}</div><div>{resources('academy')[0]?.name ?? 'My riding academy'}<small>Private development workspace</small></div></div><a className="portal-shortcut academy-portal-link" href="/portal">Open customer portal <ActionArrow up/></a><div className="nav-label">YOUR ACADEMY</div><nav>{nav.filter(([label])=>canOpen(label)).map(([label, Icon]) => <button className={view === label ? 'selected' : ''} onClick={() => go(label)} key={label}><Icon size={17}/>{label}</button>)}</nav><div className="sidebar-bottom"><div className="build-label"><ShieldCheck size={16}/><div>Build 0.36<small>Your academy · Connected workflows</small></div></div><a href="https://equestrian-os.treynielsen.chatgpt.site">Marketing site <ActionArrow up/></a><a href="/signout-with-chatgpt?return_to=%2F" target="_top"><LogOut size={15}/>Sign out</a></div></aside><div className="main-shell"><header><div><button className="mobile-menu icon" aria-label="Toggle menu" onClick={() => setMobile(!mobile)}><Menu size={18}/></button><span>Workspace</span><b>/</b><strong>{view}</strong></div><div className="workspace-mode-switch"><a className="secondary" href="/portal">Customer view <ArrowUpRight size={14}/></a><a className="secondary" href="/portal?demo=1">Booking demo <ArrowUpRight size={14}/></a><span className="environment">ADMIN WORKSPACE</span></div></header><main><div className="release-banner"><span><ShieldCheck size={15}/>Persistent development workspace</span><small>Fictional data only · Billing records are manual · Messaging is draft-only</small></div>{view!=='Calendar'&&<div className="page-heading"><div><h1>{view}</h1></div>{kinds[view] && !readOnly && <button className="primary" onClick={() => setResourceKind(kinds[view])}>+ Add {view==='Riding spaces'?'space':kinds[view]}</button>}</div>}{error && <div className="error global-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}{notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
 {loading ? <div className="empty">Loading your academy…</div> : <div className={readOnly?'feature-readonly':''}>{readOnly&&<div className="account-strip">You have view-only access to this feature.</div>}
 {view === 'Overview' && <><SetupGuide state={state} save={save} busy={busy} onAction={openSetupStep} overview/><BookingUpdates state={state} save={save} busy={busy}/><OverviewDashboard state={state} onNavigate={go} onSession={id=>{go('Calendar');setCalendarFocus(id)}}/>{can(grants,'setup')&&<ServiceSetup compact onNavigate={go}/>}</>}
 {view==='Learning Library'&&can(grants,'programs')&&<LearningLibrary manage={can(grants,'programs',true)} state={state} onChanged={async()=>{const r=await fetch('/api/workspace');if(r.ok)setState(await r.json() as State);}}/>}
 {view==='Communications'&&<Communications state={state} save={save} busy={busy} onChanged={async()=>{const r=await fetch('/api/workspace');if(r.ok)setState(await r.json() as State);}}/>}
 {view==='User Management'&&<Team state={state} save={save} busy={busy}/>}
 {view === 'Subscriptions' && <PricingPlans state={state} save={save} busy={busy} onOfferings={can(grants,'programs')?()=>go('Lessons & Offerings'):undefined}/>}
 {view === 'Lessons & Offerings' && <Programs state={state} save={save} busy={busy} startCreate={intent==='lesson'}/>}{view === 'Customers' && <Customers state={state} save={save} busy={busy} startCreate={intent==='customer'}/>}{view === 'Calendar' && <Sessions state={state} save={save} busy={busy} initialSessionId={calendarFocus} startCreate={intent==='session'}/>}
 {['Riders','Horses','Trainers'].includes(view)&&<Profiles key={view} state={state} save={save} busy={busy} kind={kinds[view]} create={resourceKind===kinds[view]} onClose={()=>setResourceKind('')} onContactParent={setContactParentId}/>}
 {view==='Barn team'&&canOpen(view)&&<>
    {can(grants,'interns')&&canPayroll&&<div className="button-row barn-sections" aria-label="Barn team sections">
      <button className={showPayroll?'secondary':'primary'} aria-pressed={!showPayroll} onClick={()=>setBarnSection('operations')}>Daily operations</button>
      <button className={showPayroll?'primary':'secondary'} aria-pressed={showPayroll} onClick={()=>setBarnSection('payroll')}>Staff & payroll</button>
    </div>}
    {showPayroll?<>{can(grants,'payroll')&&<ServiceSetup focus="payroll" onNavigate={go}/>}{can(grants,'payroll')&&<BarnWorkers manage={can(grants,'payroll',true)} onSaved={()=>setWorkerRevision(value=>value+1)}/>}<PayInputs key={workerRevision} grants={grants} zone={state.academyInfo?.timezone??'UTC'}/></>:<BarnTeam state={state} save={save} busy={busy}/>}
 </>}
 {view==='Riding spaces' && <RidingSpaces spaces={resources('arena')} save={save} busy={busy} readOnly={readOnly}/>}
 {view === 'Academy setup' && <><ServiceSetup onNavigate={go}/><AcademyPayments state={state} onPlans={()=>go('Subscriptions')}/><AcademyIdentity academy={resources('academy')[0]} onEdit={()=>setResourceKind('academy')} busy={busy} readOnly={readOnly}/><AcademyContactSettings academy={resources('academy')[0]} save={save} busy={busy} readOnly={readOnly}/><AcademyBranding academy={resources('academy')[0]} save={save} busy={busy} readOnly={readOnly}/><AcademyHours academy={resources('academy')[0]} save={save} busy={busy} readOnly={readOnly}/><section className="panel" id="academy-language"><div className="panel-heading"><div><h2>Your academy’s language</h2><p>Use the names your team and families already know.</p></div></div><div className="setup-cards">{[['level', 'Rider levels', 'Rainbow, Red, Yellow, Advanced…'], ['discipline', 'Disciplines', 'Western, English, or your own focus'], ['group', 'Rider groups', 'Rainbow/Red Group, Advanced Academy…']].map(([kind, title, desc]) => <article key={kind}><div><h3>{title}</h3><p>{desc}</p><div className="chip-list">{resources(kind).map(r => <span key={r.id}>{kind==='level'?readOnly?<CategoryLabel kind="level" value={r.name}/>:<button type="button" className="level-appearance-edit" aria-label={'Edit appearance for '+r.name} onClick={()=>{setLevelEditing(r);setResourceKind('level');}}><CategoryLabel kind="level" value={r.name}/></button>:<span className="pill">{r.name}</span>}</span>)}</div></div><button className="secondary" onClick={() => {setLevelEditing(undefined);setResourceKind(kind);}}>+ Add {kind === 'academy' ? 'name' : kind}</button></article>)}</div></section><SetupGuide state={state} save={save} busy={busy} onAction={openSetupStep} onFinished={()=>go('Overview')}/><div className="account-strip">Calendar times follow your academy’s time zone. Trainer hours, breaks, days off and academy closures apply to planning and new bookings. Existing lessons stay scheduled. Custom levels match by name; they are not automatically ranked.</div></>}
 {view==='Product reference'&&<ProductReference onNavigate={go}/>}
 {view === 'Roadmap' && <section className="panel"><div className="panel-heading"><div><h2>Built today. Connecting next.</h2><p>Saved setup is separate from verified provider activation.</p></div></div><div className="milestones">{[['Academy & scheduling','Contact, branding, operating hours, trainer availability, month planning, quick bookings and calendar views.'],['Customers & rider subscriptions','Adult accounts, multiple guardians, rider profiles, immutable plan benefits and credit-aware bookings. Stripe sandbox verification remains required.'],['Communications','Prepared automation rules, audience previews, consent preferences and reviewed campaigns. Provider delivery and background dispatch remain off.'],['Learning Library','Video/PDF uploads, drafts, rider-level and group targeting, private access and announcement drafts. Optimized Stream delivery remains unconnected.'],['Staff & payroll','Worker setup, attendance, tasks, approved actual work and CSV exports. Embedded onboarding, tax forms and payments require payroll-provider approval.'],['Before pilot launch','Complete provider sandbox checks, embedded payments decision, production identity/access review, delivery queue, monitoring and security review. Native apps follow shared API verification.']].map(([title,description],i)=><article key={title}><span className="milestone-number">{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>}
 {view === 'Overview' && state.audit.length > 0 && <section className="panel activity"><div className="panel-heading"><h2>Recent academy activity</h2></div>{state.audit.slice(0, 8).map((a, i) => <div key={i}><span className="activity-dot"/><p>{a.action}</p><small>{new Date(a.created).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</small></div>)}</section>}
 </div>}<footer>EquestrianOS <span>Manage · Educate · Grow</span><small>Build 0.36 · Development workspace</small></footer></main></div>
 {contactParentId&&can(grants,'communications',true)&&state.customers.find(c=>c.id===contactParentId)&&<ParentContact customer={state.customers.find(c=>c.id===contactParentId)!} onClose={()=>setContactParentId('')}/>}
 {resourceKind==='level'&&<LevelEditor level={levelEditing} save={save} busy={busy} close={()=>{setResourceKind('');setLevelEditing(undefined);}}/>}
 {resourceKind&&!['rider','horse','trainer','level'].includes(resourceKind) && <Dialog title={resourceKind==='academy'?'Academy name & logo':'Add '+(resourceKind==='arena'?'a riding space':resourceKind)} onClose={() => setResourceKind('')}><form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setUploadingLogo(true);try{let photoId=resources('academy')[0]?.details.photoId??'';const file=f.get('photo') as File|null;if(file?.size){if(resourceKind==='academy'){if(!preparedLogo)throw Error('Wait for a prepared logo or choose a valid image.');photoId=await uploadPreparedLogo(preparedLogo)}else photoId=await upload(file);}if (await save({ action: 'resource',id:resourceKind==='academy'?resources('academy')[0]?.id:undefined,photoId:resourceKind==='academy'?photoId:undefined,cancellationHours:resourceKind==='academy'?Number(f.get('cancellationHours')):undefined,kind: resourceKind, name: f.get('name'), level: f.get('level'), group: f.get('group') ?? '', customer: f.get('customer') ?? '' }))
        setResourceKind('');}catch(e){setError(e instanceof Error?e.message:'Unable to upload logo.')}finally{setUploadingLogo(false)} }}><label>Name<input name="name" autoFocus required maxLength={100} defaultValue={resourceKind==='academy'?resources('academy')[0]?.name:''}/></label>{resourceKind==='academy'&&<><AcademyLogoUpload photoId={resources('academy')[0]?.details.photoId} onPrepared={setPreparedLogo} onBusy={setPreparingLogo}/><label>Online cancellation / reschedule notice · hours<input name="cancellationHours" type="number" min={0} max={720} required defaultValue={resources('academy')[0]?.details.cancellationHours??24}/></label><small>Inside this window, families contact the academy for changes. Existing financial records are unaffected.</small></>}<button className="primary submit" disabled={busy||uploadingLogo||preparingLogo}>{busy||uploadingLogo ? 'Saving…' : <>Save and continue <ActionArrow/></>}</button></form></Dialog>}
 {scheduleUndo&&<ScheduleUndoToast key={scheduleUndo.token} receipt={scheduleUndo} busy={busy} onDismiss={()=>setScheduleUndo(current=>current?.token===scheduleUndo.token?null:current)} onUndo={async()=>{const token=scheduleUndo.token;await save({action:'undoSchedule',token});setScheduleUndo(current=>current?.token===token?null:current)}}/>}
 </div></FeedbackContext.Provider></LevelLabels.Provider>;
}
