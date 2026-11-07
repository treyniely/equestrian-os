export const messageRecipes = {
    bookingConfirmed: {label:'Booking confirmation', trigger:'After a lesson is booked', hours:0, subject:'Your lesson is booked', message:'Hi {{guardian}}, {{rider}} is booked for a lesson on {{lessonTime}} at {{barn}}.'},
    lessonReminder: {label:'Lesson reminder', trigger:'Before the lesson starts', hours:24, subject:'Your upcoming lesson', message:'Hi {{guardian}}, a quick reminder that {{rider}} has a lesson on {{lessonTime}} at {{barn}}.'},
    bookingRescheduled: {label:'Reschedule update', trigger:'After a lesson is rescheduled', hours:0, subject:'Your lesson has moved', message:'Hi {{guardian}}, {{rider}}’s lesson at {{barn}} has moved to {{lessonTime}}.'},
    bookingCanceled: {label:'Cancellation update', trigger:'After a lesson is canceled', hours:0, subject:'Your lesson was canceled', message:'Hi {{guardian}}, {{rider}}’s lesson on {{lessonTime}} at {{barn}} was canceled.'},
    membershipStarted: {label:'Paid membership confirmation', trigger:'After the first membership invoice is paid', hours:0, subject:'Your membership is ready', message:'Hi {{guardian}}, {{rider}}’s membership at {{barn}} is ready. Sign in to see available lesson credits.'},
    renewalReminder: {label:'Renewal reminder', trigger:'Before the expected renewal date', hours:168, subject:'Your membership is renewing soon', message:'Hi {{guardian}}, {{rider}}’s membership at {{barn}} is scheduled to renew on {{renewalDate}}.'},
    paymentFailed: {label:'Failed-payment follow-up', trigger:'After a renewal payment fails', hours:0, subject:'Please check your payment method', message:'Hi {{guardian}}, we couldn’t collect the renewal payment for {{rider}} at {{barn}}. Sign in to manage billing.'},
    paymentReceipt: {label:'Payment receipt', trigger:'After an invoice is paid', hours:0, subject:'Your payment receipt', message:'Hi {{guardian}}, your payment to {{barn}} was received. Sign in to view your invoice and payment details.'},
    cardExpiring: {label:'Card expiration reminder', trigger:'Before a saved card expires, when Stripe reports its expiry', hours:168, subject:'Please check your saved card', message:'Hi {{guardian}}, your saved payment card at {{barn}} is expiring soon. Sign in to securely update your payment method.'},
    resourceShared: {label:'New learning resource', trigger:'When you publish a resource and choose to notify its audience', hours:0, subject:'New learning material from {{barn}}', message:'Hi {{guardian}}, {{resourceTitle}} is ready in {{rider}}’s Learning Library at {{barn}}.'},
    campAnnouncement: {label:'Clinic or camp announcement', trigger:'After you choose a send time', hours:0, subject:'New dates at {{barn}}', message:'Hi {{guardian}}, registration is open for our next clinic or camp. Visit {{barn}}’s portal for details.'},
} as const;

export const messageFields={
    guardian:{label:'Guardian first name',fallback:'there'},
    rider:{label:'Rider first name',fallback:'your rider'},
    lessonTime:{label:'Lesson date and time',fallback:'the scheduled time'},
    barn:{label:'Barn name',fallback:'your academy'},
    resourceTitle:{label:'Learning resource title',fallback:'a new learning resource'},
    renewalDate:{label:'Renewal date',fallback:'your next billing date'},
} as const;
export type MessageField=keyof typeof messageFields;

export function renderMessage(text:string,values:Partial<Record<MessageField,string>>){
    return text.replace(/\{\{(\w+)\}\}/g,(token:string,key:MessageField)=>
        Object.hasOwn(messageFields,key)?values[key]?.trim()||messageFields[key].fallback:token);
}
