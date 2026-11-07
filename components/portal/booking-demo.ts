import {matchingBenefit,type Benefit} from '../../domain/plans.ts';
import type {PortalState} from './types';

const hour=3600000;
export function bookingDemo(now=Date.now()):PortalState{
    const riders=['Avery','Morgan'].map(name=>({id:name,name,details:{level:'Beginner',preferredHorses:[],preferredTrainer:''}}));
    const offerings=[['private','Private lesson','private'],['group','Group lesson','group'],['class','Horsemanship','class']];
    const directory=offerings.map(([id,name,template])=>({id,name,kind:'lesson',details:{template,access:'membership',description:'',photoId:'',level:'',duration:45,price:0}}));
    const start=now-10*24*hour,end=now+20*24*hour;
    const benefits:Benefit[]=riders.flatMap(({id},index)=>offerings.map(([program,label],i)=>({
        bucket:id+program,period:id,customer:'demo',rider:id,membership:id,plan_id:id,
        name:index?'Barn Essentials':'Barn Plus',kind:'monthly',price:index?12900:19900,currency:'USD',
        start,end,start_date:new Date(start).toISOString().slice(0,10),end_date:new Date(end).toISOString().slice(0,10),
        anchor:1,status:'active',label:label+' credits',quantity:(index?[1,2,2]:[2,4,4])[i],used:id==='Avery'&&program==='private'?1:0,programs:[program],
    })));
    const sessions=[['private',8],['private',74],['private',122],['group',77],['group',149],['class',101],['class',173]].map(([program,offset],i)=>{
        const start=now+Number(offset)*hour;
        return {id:'session-'+i,program:String(program),start,end:start+45*60000,status:'scheduled',available:true,remaining:1,assignments:[]};
    });
    return {
        academy:{id:'demo',name:'Cedar Ridge Riding Academy',photoId:'',cancellationHours:24},
        userEmail:'family@example.invalid',
        customer:{id:'demo',name:'Sample family',email:'family@example.invalid',phone:'',billing:'current',balance:0,email_consent:0,sms_consent:0},
        riders,directory,benefits,sessions,memberships:[],
        registrations:[{id:'sample-lesson',session:sessions[0].id,rider:'Avery'}],
        creditAssignments:[{enrollment:'sample-lesson',bucket:'Averyprivate'}],
    };
}

export function updateBookingDemo(state:PortalState,input:Record<string,unknown>,now=Date.now()):PortalState{
    const {action}=input;
    if(action!=='book'&&action!=='cancel'&&action!=='reschedule')throw Error('This demo supports booking, rescheduling, and canceling lessons.');
    const old=state.registrations.find(r=>r.id===input.id);
    const original=state.sessions.find(s=>s.id===old?.session);
    if(action!=='book'&&(!original||original.start<=now+state.academy.cancellationHours*hour)){
        throw Error('The online change window has closed. Contact your academy for help.');
    }
    const target=state.sessions.find(s=>s.id===input.session);
    const oldCredit=state.creditAssignments?.find(c=>c.enrollment===old?.id);
    const benefits=(state.benefits??[]).map(b=>({...b,used:b.used-(b.bucket===oldCredit?.bucket?1:0)}));
    const rider=state.riders.find(r=>r.id===input.rider);
    const registrations=state.registrations.filter(r=>r.id!==old?.id);
    const creditAssignments=(state.creditAssignments??[]).filter(c=>c.enrollment!==old?.id);
    if(action!=='cancel'){
        if(!rider||!target||target.start<=now||target.id===original?.id||!target.remaining||old&&old.rider!==rider.id)throw Error('Choose another available lesson.');
        const credit=matchingBenefit(benefits,rider.id,target.program,target.start);
        if(!credit)throw Error('No eligible credit remains for this lesson.');
        credit.used+=1;
        const id=old?.id??crypto.randomUUID();
        registrations.push({id,session:target.id,rider:rider.id});
        creditAssignments.push({enrollment:id,bucket:credit.bucket});
    }
    return {...state,benefits,registrations,creditAssignments,sessions:state.sessions.map(s=>({...s,remaining:s.remaining+(s.id===original?.id?1:0)-(action!=='cancel'&&s.id===target?.id?1:0)}))};
}
