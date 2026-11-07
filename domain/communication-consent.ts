import {z} from 'zod';

export const operationalPreferenceSchema=z.object({
    lessonEmail:z.boolean(),lessonSms:z.boolean(),scheduleEmail:z.boolean(),scheduleSms:z.boolean(),
}).strict();
export type OperationalPreferences= z.infer<typeof operationalPreferenceSchema>;
export const defaultOperationalPreferences:OperationalPreferences={lessonEmail:false,lessonSms:false,scheduleEmail:false,scheduleSms:false};
export const operationalConsentWording={
    lessonEmail:'I agree to receive lesson confirmations and reminders by email from this academy.',
    lessonSms:'I agree to receive lesson confirmations and reminders by text from this academy. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe when texting is enabled.',
    scheduleEmail:'I agree to receive lesson reschedule and cancellation updates by email from this academy.',
    scheduleSms:'I agree to receive lesson reschedule and cancellation updates by text from this academy. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe when texting is enabled.',
} as const;
export type OperationalPreferenceKey=keyof OperationalPreferences;
export function parseOperationalPreferences(value:unknown):OperationalPreferences{
    const parsed=operationalPreferenceSchema.safeParse(value);
    return parsed.success?parsed.data:{...defaultOperationalPreferences};
}
export function operationalConsentEntries(preferences:OperationalPreferences){
    return (Object.keys(preferences) as OperationalPreferenceKey[]).map(key=>({
        key,channel:key.endsWith('Sms')?'sms':'email',purpose:key.startsWith('lesson')?'lesson':'schedule',
        granted:preferences[key],wording:operationalConsentWording[key],
    }));
}
