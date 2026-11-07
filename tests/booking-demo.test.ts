import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingDemo,updateBookingDemo} from '../components/portal/booking-demo.ts';

test('booking demo isolates rider credits, moves a booking, restores credits, and respects the cutoff',()=>{
    const now=Date.parse('2030-10-15T12:00:00Z');
    const demo=bookingDemo(now);
    const used=(state:typeof demo)=>state.benefits?.find(b=>b.bucket==='Averyprivate')?.used;
    const booked=updateBookingDemo(demo,{action:'book',session:'session-1',rider:'Avery'},now);
    assert.equal(used(booked),2);
    assert.equal(used(demo),1);
    assert.throws(()=>updateBookingDemo(booked,{action:'book',session:'session-2',rider:'Avery'},now),/No eligible credit/);
    const id=booked.registrations.find(r=>r.session==='session-1')?.id;
    const moved=updateBookingDemo(booked,{action:'reschedule',id,session:'session-2',rider:'Avery'},now);
    assert.equal(used(moved),2);
    assert.equal(moved.registrations.find(r=>r.id===id)?.session,'session-2');
    assert.equal(used(updateBookingDemo(moved,{action:'cancel',id},now)),1);
    assert.throws(()=>updateBookingDemo(demo,{action:'cancel',id:'sample-lesson'},now),/window has closed/);
});
