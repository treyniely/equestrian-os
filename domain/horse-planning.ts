export type Work={start:number;end:number};
export function horseAvailability(work:Work[],start:number,end:number){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 'Choose a date and time';
 if(work.some(w=>start<w.end&&w.start<end))return 'Already booked';
 return '';
}

export function resourceWork(state:{reservations:{kind:string;resource:string;session:string}[];sessions:{id:string;status:string;start:number;end:number}[];bookings:any[]},kind:string,id:string):Work[]{return [...state.reservations.filter(r=>r.kind===kind&&r.resource===id).flatMap(r=>{const s=state.sessions.find(s=>s.id===r.session&&s.status==='scheduled');return s?[{start:s.start,end:s.end}]:[]}),...state.bookings.filter(b=>b[kind]===id&&b.status!=='canceled').map(b=>({start:b.start,end:b.end}))]}
