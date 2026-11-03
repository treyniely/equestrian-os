'use client';
import ScheduleUndoToast from './schedule-undo-toast';
import type {ScheduleUndoReceipt} from '../../domain/schedule-undo';
import CategoryLabel from './category-label';
import ActionArrow from './action-arrow';

import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarDays, Users, UserRound, BookOpen, BookUser, MapPin, Settings, ShieldCheck, Menu, LogOut, ArrowUpRight, Check, ChevronRight, ClipboardList, CreditCard } from 'lucide-react';
import type { State, Save } from './types';
import Dialog, { FeedbackContext } from './dialog';
import Programs from './programs';
import PricingPlans from './pricing-plans';
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
const nav = [['Overview', LayoutDashboard], ['Calendar', CalendarDays], ['Customers', BookUser], ['Lessons & Offerings', BookOpen], ['Subscriptions', CreditCard], ['Riders', Users], ['Horses', HorseIcon], ['Trainers', UserRound], ['Riding spaces', MapPin], ['Academy setup', Settings], ['Barn team',ClipboardList],['Team & Access',ShieldCheck],['Roadmap', ShieldCheck]] as const;
const kinds: Record<string, string> = { Riders: 'rider', Horses: 'horse', Trainers: 'trainer', 'Riding spaces': 'arena' };
export default function Workspace() {
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
    const viewFeature:Record<string,Feature>={'Customers':'customers','Calendar':'schedule','Lessons & Offerings':'programs','Subscriptions':'billing','Riders':'riders','Horses':'horses','Trainers':'trainers','Riding spaces':'setup','Academy setup':'setup','Barn team':'interns','Team & Access':'team'};
    const readOnly=!!viewFeature[view]&&!can(grants,viewFeature[view],true);
    const go = (v: string) => {if(viewFeature[v]&&!can(grants,viewFeature[v]))return; setView(v);setCalendarFocus(''); setMobile(false); setError('');setIntent('');setContactParentId(''); }, resources = (kind: string) => state.resources.filter(r => r.kind === kind && (kind !== 'lesson' || !r.details.archived));
 const openSetupStep=(step:SetupStep)=>{if(!can(grants,step.feature,true))return;go(step.target);if(step.kind==='academy'&&!step.done)setResourceKind('academy');else if(['trainer','horse','arena'].includes(step.kind)&&!resources(step.kind).length)setResourceKind(step.kind);else if(['lesson','session'].includes(step.kind)&&!step.done||step.kind==='customer'&&!state.customers.length)setIntent(step.kind);if(['contact','hours','branding','payments','levels','community','plan'].includes(step.kind))setIntent('setup-'+step.kind);};
 useEffect(()=>{if(!intent.startsWith('setup-'))return;const id=({'setup-contact':'academy-contact','setup-community':'academy-contact','setup-hours':'academy-hours','setup-branding':'academy-branding','setup-payments':'academy-payments','setup-levels':'academy-language','setup-plan':'academy-plans'} as Record<string,string>)[intent];if(id)document.getElementById(id)?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},[intent,view]);
    if (auth)
        return <div className="sign-in"><img src="/assets/eo-symbol-transparent.png" alt="EquestrianOS"/><h1>Your academy starts here.</h1><p>Sign in to your private development workspace.</p><a className="primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">Continue with ChatGPT <ArrowUpRight size={16}/></a><small>Development release · Use fictional data only.</small></div>;
    return <FeedbackContext.Provider value={error}><div className="app-shell"><aside className={mobile ? 'sidebar expanded' : 'sidebar'}><a className="logo" href="/"><img className="symbol" src="/assets/eo-symbol-transparent.png" alt=""/><img src="/assets/wordmark-transparent.png" alt="EquestrianOS"/></a><div className="academy"><div className="avatar">{resources('academy')[0]?.details.photoId?<img className="academy-logo" src={'/api/photos?id='+resources('academy')[0].details.photoId} alt="Academy logo"/>:'EO'}</div><div>{resources('academy')[0]?.name ?? 'My riding academy'}<small>Private development workspace</small></div></div><a className="portal-shortcut academy-portal-link" href="/portal">Open customer portal <ActionArrow up/></a><div className="nav-label">YOUR ACADEMY</div><nav>{nav.filter(([label])=>!viewFeature[label]||can(grants,viewFeature[label])).map(([label, Icon]) => <button className={view === label ? 'selected' : ''} onClick={() => go(label)} key={label}><Icon size={17}/>{label}</button>)}</nav><div className="sidebar-bottom"><div className="build-label"><ShieldCheck size={16}/><div>Build 0.31<small>Your academy · Connected workflows</small></div></div><a href="https://equestrian-os.treynielsen.chatgpt.site">Marketing site <ActionArrow up/></a><a href="/signout-with-chatgpt?return_to=%2F" target="_top"><LogOut size={15}/>Sign out</a></div></aside><div className="main-shell"><header><div><button className="mobile-menu icon" aria-label="Toggle menu" onClick={() => setMobile(!mobile)}><Menu size={18}/></button><span>Workspace</span><b>/</b><strong>{view}</strong></div><div className="workspace-mode-switch"><a className="secondary" href="/portal">Customer view <ArrowUpRight size={14}/></a><span className="environment">ADMIN WORKSPACE</span></div></header><main><div className="release-banner"><span><ShieldCheck size={15}/>Persistent development workspace</span><small>Fictional data only · Billing records are manual · Messaging is draft-only</small></div><div className="page-heading"><div><p className="eyebrow">MANAGE · EDUCATE · GROW</p><h1>{view === 'Overview' ? 'Less juggling. More riding.' : view === 'Calendar' ? 'Your academy, in sync.' : view === 'Academy setup' ? 'Let’s make it yours.' : view}</h1><p>{view === 'Overview' ? state.onboarding?.completedAt?'Your day, your people and what needs attention.':'Get the essentials in place, then make it your own.' : view === 'Customers' ? 'Find who needs attention—and know what to do next.' : view === 'Lessons & Offerings' ? 'Everything customers can book. In language you already use.' : 'A clear place for the details that matter.'}</p></div>{kinds[view] && !readOnly && <button className="primary" onClick={() => setResourceKind(kinds[view])}>+ Add {view==='Riding spaces'?'space':kinds[view]}</button>}</div>{error && <div className="error global-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}{notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
 {loading ? <div className="empty">Loading your academy…</div> : <div className={readOnly?'feature-readonly':''}>{readOnly&&<div className="account-strip">You have view-only access to this feature.</div>}
 {view === 'Overview' && <><SetupGuide state={state} save={save} busy={busy} onAction={openSetupStep} overview/><BookingUpdates state={state} save={save} busy={busy}/><OverviewDashboard state={state} onNavigate={go} onSession={id=>{go('Calendar');setCalendarFocus(id)}}/></>}
 {view==='Team & Access'&&<Team state={state} save={save} busy={busy}/>}
 {view === 'Subscriptions' && <PricingPlans state={state} save={save} busy={busy} onOfferings={can(grants,'programs')?()=>go('Lessons & Offerings'):undefined}/>}
 {view === 'Lessons & Offerings' && <Programs state={state} save={save} busy={busy} startCreate={intent==='lesson'}/>}{view === 'Customers' && <Customers state={state} save={save} busy={busy} startCreate={intent==='customer'}/>}{view === 'Calendar' && <Sessions state={state} save={save} busy={busy} initialSessionId={calendarFocus} startCreate={intent==='session'}/>}
 {['Riders','Horses','Trainers'].includes(view)&&<Profiles key={view} state={state} save={save} busy={busy} kind={kinds[view]} create={resourceKind===kinds[view]} onClose={()=>setResourceKind('')} onContactParent={setContactParentId}/>}
 {view==='Barn team'&&<BarnTeam state={state} save={save} busy={busy}/>}
 {view==='Riding spaces' && <RidingSpaces spaces={resources('arena')} save={save} busy={busy} readOnly={readOnly}/>}
 {view === 'Academy setup' && <><AcademyPayments state={state} onPlans={()=>go('Subscriptions')}/><AcademyIdentity academy={resources('academy')[0]} onEdit={()=>setResourceKind('academy')} busy={busy} readOnly={readOnly}/><AcademyContactSettings academy={resources('academy')[0]} save={save} busy={busy} readOnly={readOnly}/><AcademyBranding academy={resources('academy')[0]} save={save} busy={busy} readOnly={readOnly}/><AcademyHours academy={resources('academy')[0]} save={save} busy={busy} readOnly={readOnly}/><section className="panel" id="academy-language"><div className="panel-heading"><div><h2>Your academy’s language</h2><p>Use the names your team and families already know.</p></div></div><div className="setup-cards">{[['level', 'Rider levels', 'Rainbow, Red, Yellow, Advanced…'], ['discipline', 'Disciplines', 'Western, English, or your own focus'], ['group', 'Rider groups', 'Rainbow/Red Group, Advanced Academy…']].map(([kind, title, desc]) => <article key={kind}><div><h3>{title}</h3><p>{desc}</p><div className="chip-list">{resources(kind).map(r => <span key={r.id}>{kind==='level'?<CategoryLabel kind="level" value={r.name}/>:<span className="pill">{r.name}</span>}</span>)}</div></div><button className="secondary" onClick={() => setResourceKind(kind)}>+ Add {kind === 'academy' ? 'name' : kind}</button></article>)}</div></section><SetupGuide state={state} save={save} busy={busy} onAction={openSetupStep} onFinished={()=>go('Overview')}/><div className="account-strip">Calendar times follow your academy’s time zone. Trainer hours, breaks, days off and academy closures apply to planning and new bookings. Existing lessons stay scheduled. Custom levels match by name; they are not automatically ranked.</div></>}
 {view === 'Roadmap' && <div className="milestones">{[['Available in 0.2', 'Lessons & Offerings templates, session capacity, private parties, customer records and filters, manual memberships, saved communication drafts, custom rider labels and guided setup.'], ['Next: complete booking lifecycle', 'Local timezones and recurring schedules, guardian login, staff permissions, Stripe test payments, membership entitlements and transactional messages.'], ['Pilot readiness', 'Live billing, packages, waivers, delivery/retry workflows, monitoring, security and accessibility review.'], ['Learning beyond the barn', 'Trainer content, rider assignments, knowledge checks and practical trainer sign-off.'], ['AI and growth', 'Permissioned AI assistance, connected lifecycle automation and reporting.'], ['Native mobile', 'Dedicated apps after responsive workflows are validated. Academy website builder excluded.']].map(([title, desc], i) => <article key={title}><span className="milestone-number">0{i + 1}</span><div><h2>{title}</h2><p>{desc}</p></div></article>)}</div>}
 {view === 'Overview' && state.audit.length > 0 && <section className="panel activity"><div className="panel-heading"><h2>Recent academy activity</h2></div>{state.audit.slice(0, 8).map((a, i) => <div key={i}><span className="activity-dot"/><p>{a.action}</p><small>{new Date(a.created).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</small></div>)}</section>}
 </div>}<footer>EquestrianOS <span>Manage · Educate · Grow</span><small>Build 0.31 · Development workspace</small></footer></main></div>
 {contactParentId&&can(grants,'communications',true)&&state.customers.find(c=>c.id===contactParentId)&&<ParentContact customer={state.customers.find(c=>c.id===contactParentId)!} onClose={()=>setContactParentId('')}/>}
 {resourceKind&&!['rider','horse','trainer'].includes(resourceKind) && <Dialog title={resourceKind==='academy'?'Academy name & logo':'Add '+(resourceKind==='arena'?'a riding space':resourceKind)} onClose={() => setResourceKind('')}><form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setUploadingLogo(true);try{let photoId=resources('academy')[0]?.details.photoId??'';const file=f.get('photo') as File|null;if(file?.size){if(resourceKind==='academy'){if(!preparedLogo)throw Error('Wait for a prepared logo or choose a valid image.');photoId=await uploadPreparedLogo(preparedLogo)}else photoId=await upload(file);}if (await save({ action: 'resource',id:resourceKind==='academy'?resources('academy')[0]?.id:undefined,photoId:resourceKind==='academy'?photoId:undefined,cancellationHours:resourceKind==='academy'?Number(f.get('cancellationHours')):undefined,kind: resourceKind, name: f.get('name'), level: f.get('level'), group: f.get('group') ?? '', customer: f.get('customer') ?? '' }))
        setResourceKind('');}catch(e){setError(e instanceof Error?e.message:'Unable to upload logo.')}finally{setUploadingLogo(false)} }}><label>Name<input name="name" autoFocus required maxLength={100} defaultValue={resourceKind==='academy'?resources('academy')[0]?.name:''}/></label>{resourceKind==='academy'&&<><AcademyLogoUpload photoId={resources('academy')[0]?.details.photoId} onPrepared={setPreparedLogo} onBusy={setPreparingLogo}/><label>Online cancellation / reschedule notice · hours<input name="cancellationHours" type="number" min={0} max={720} required defaultValue={resources('academy')[0]?.details.cancellationHours??24}/></label><small>Inside this window, families contact the academy for changes. Existing financial records are unaffected.</small></>}<button className="primary submit" disabled={busy||uploadingLogo||preparingLogo}>{busy||uploadingLogo ? 'Saving…' : <>Save and continue <ActionArrow/></>}</button></form></Dialog>}
 {scheduleUndo&&<ScheduleUndoToast key={scheduleUndo.token} receipt={scheduleUndo} busy={busy} onDismiss={()=>setScheduleUndo(current=>current?.token===scheduleUndo.token?null:current)} onUndo={async()=>{const token=scheduleUndo.token;await save({action:'undoSchedule',token});setScheduleUndo(current=>current?.token===token?null:current)}}/>}
 </div></FeedbackContext.Provider>;
}
