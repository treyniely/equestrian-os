/** EO billing is currently a manual record; Stripe webhooks will become its source. */
export function customerStatus(billing:string):'active'|'inactive'{return billing==='current'?'active':'inactive'}
