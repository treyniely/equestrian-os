import {z} from 'zod';
export const ageBands=['Under 6','6–9','10–13','14–17','18+'] as const;
export const ridingExperience=['New to riding','A few lessons','Rides regularly','Experienced rider'] as const;
export const riderIntakeSchema=z.object({ageBand:z.enum(['',...ageBands]).optional(),experience:z.enum(['',...ridingExperience]).optional(),goals:z.string().trim().max(600).optional()});
export type RiderIntake=z.infer<typeof riderIntakeSchema>;
