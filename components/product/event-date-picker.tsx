'use client';

import {useRef, useState} from 'react';
import {CalendarDays} from 'lucide-react';
import {DayPicker} from 'react-day-picker';
import 'react-day-picker/style.css';
import {localDate} from '../../domain/barn';

export default function EventDatePicker({zone}: {zone: string}) {
  const [date, setDate] = useState('');
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const today = localDate(Date.now(), zone);
  const firstDay = new Date(today + 'T00:00:00');
  const selected = date ? new Date(date + 'T12:00:00') : undefined;

  return <div className="event-date-picker">
    <label>Event date<input type="date" name="eventDate" min={today} value={date} onChange={event=>setDate(event.target.value)} required /></label>
    <button type="button" className="secondary" ref={trigger} aria-expanded={open} onClick={()=>setOpen(!open)}>
      <CalendarDays size={16} aria-hidden="true" />{open?'Hide calendar':'Choose from calendar'}
    </button>
    {open && <DayPicker
      mode="single"
      required
      autoFocus
      selected={selected}
      today={firstDay}
      defaultMonth={selected && selected >= firstDay ? selected : firstDay}
      startMonth={firstDay}
      disabled={{before:firstDay}}
      onSelect={day=>{
        const parts = [day.getFullYear(), day.getMonth()+1, day.getDate()];
        setDate(parts.map(value=>String(value).padStart(2,'0')).join('-'));
        setOpen(false);
        trigger.current?.focus();
      }}
    />}
  </div>;
}
