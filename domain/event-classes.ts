import { z } from 'zod';

const price = z.number().int().min(1).max(10000000);
export const eventClassesSchema = z.object({
  classes: z.array(z.object({ name: z.string().trim().min(1).max(100), price })).min(1).max(100),
  passPrice: price.nullable(),
}).superRefine(({ classes, passPrice }, context) => {
  if (new Set(classes.map(entry => entry.name.toLowerCase())).size !== classes.length) {
    context.addIssue({ code: 'custom', message: 'Give each class a different name.' });
  }
  if (passPrice !== null && passPrice >= classes.reduce((total, entry) => total + entry.price, 0)) {
    context.addIssue({ code: 'custom', message: 'Price the Unlimited pass below the total of the individual classes.' });
  }
});
export type EventClasses = z.infer<typeof eventClassesSchema>;
