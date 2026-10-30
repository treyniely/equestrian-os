export const templates = [
    { id: 'private', name: 'Private lesson', description: 'One rider. Focused instruction.', duration: 45, capacity: 1, mounted: true },
    { id: 'group', name: 'Group lesson', description: 'A shared lesson with individual spots.', duration: 60, capacity: 6, mounted: true },
    { id: 'class', name: 'Horsemanship class', description: 'Horse Sense and learning at the barn.', duration: 60, capacity: 12, mounted: false },
    { id: 'experience', name: 'Trail ride / experience', description: 'Time with horses, beyond a lesson.', duration: 60, capacity: 6, mounted: true },
    { id: 'party', name: 'Private party', description: 'Exclusive time for one organizer’s group.', duration: 90, capacity: 12, mounted: false },
    { id: 'camp', name: 'Camp / clinic', description: 'A scheduled camp or clinic session.', duration: 180, capacity: 12, mounted: false },
    { id: 'event', name: 'Event', description: 'A gathering with a guest list.', duration: 60, capacity: 20, mounted: false }
] as const;
export type Customer = {
    emergency_contacts?:import('./family-contacts').FamilyContact[];contacts_revision?:number;
    id: string;
    adult_confirmed?:number;
    name: string;
    email: string;
    phone: string;
    stage: string;
    billing: string;
    balance: number;
    notes: string;
    email_consent: number;
    sms_consent: number;
};
export function inSegment(c: Customer, segment: string, memberIds: string[] = []) { switch (segment) {
    case 'Needs attention': return ['failed', 'overdue'].includes(c.billing);
    case 'Active members': return memberIds.includes(c.id);
    case 'Trials & inquiries': return ['inquiry', 'trial'].includes(c.stage);
    case 'Inactive': return c.stage === 'inactive';
    default: return true;
} }
export function eligibleRecipients(customers: Customer[], segment: string, channel: string, memberIds: string[] = []) { return customers.filter(c => inSegment(c, segment, memberIds) && !!c.adult_confirmed && (channel === 'sms' ? Boolean(c.sms_consent && c.phone) : Boolean(c.email_consent && c.email))); }
