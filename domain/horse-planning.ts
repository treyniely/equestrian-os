export type Work={start:number;end:number};
export function scheduledMinutes(work:Work[],date:string){return work.filter(w=>new Date(w.start).toISOString().slice(0,10)===date).reduce((n,w)=>n+(w.end-w.start)/60000,0)}
export function horseAvailability(work:Work[],start:number,end:number,limit:number|null|undefined,rest=0){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 'Choose a date and time';
 if(work.some(w=>start<w.end&&w.start<end))return 'Already booked';
 if(rest&&work.some(w=>start<w.end+rest*60000&&w.start<end+rest*60000))return 'Rest time needed';
 if(limit!=null&&scheduledMinutes(work,new Date(start).toISOString().slice(0,10))+(end-start)/60000>limit)return 'Daily work limit reached';
 return '';
}

export function resourceWork(state:{reservations:{kind:string;resource:string;session:string}[];sessions:{id:string;status:string;start:number;end:number}[];bookings:any[]},kind:string,id:string):Work[]{return [...state.reservations.filter(r=>r.kind===kind&&r.resource===id).flatMap(r=>{const s=state.sessions.find(s=>s.id===r.session&&s.status==='scheduled');return s?[{start:s.start,end:s.end}]:[]}),...state.bookings.filter(b=>b[kind]===id&&b.status!=='canceled').map(b=>({start:b.start,end:b.end}))]}
