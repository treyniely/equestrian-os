const retentionMs = 60 * 24 * 60 * 60 * 1000;

// Keep definitions while any calendar or pricing record still resolves them by ID.
const unreferenced = `
  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.tenant=resources.tenant AND s.program=resources.id)
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.tenant=resources.tenant AND b.lesson=resources.id)
  AND NOT EXISTS (SELECT 1 FROM benefit_offerings b WHERE b.tenant=resources.tenant AND b.program=resources.id)
  AND NOT EXISTS (
    SELECT 1 FROM resources p, json_each(p.details,'$.buckets') bucket, json_each(bucket.value,'$.programs') item
    WHERE p.tenant=resources.tenant AND p.kind='plan' AND item.value=resources.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM billing_catalog c, json_each(c.snapshot,'$.buckets') bucket, json_each(bucket.value,'$.programs') item
    WHERE c.tenant=resources.tenant AND item.value=resources.id
  )`;

const removed = "kind='lesson' AND json_extract(details,'$.archived')=1";

export async function purgeRemovedOffering(db:D1Database, tenant:string, id:string) {
  const deleted = await db.prepare(`DELETE FROM resources WHERE tenant=? AND id=? AND ${removed} ${unreferenced} RETURNING id`)
    .bind(tenant,id).first();
  if (!deleted) throw Error('Only removed offerings without calendar or plan references can be permanently deleted.');
}

export async function expireRemovedOfferings(db:D1Database, tenant:string, now=Date.now()) {
  await db.batch([
    db.prepare(`UPDATE resources SET details=json_set(details,'$.removedAt',?)
      WHERE tenant=? AND ${removed} AND json_extract(details,'$.removedAt') IS NULL`).bind(now,tenant),
    db.prepare(`DELETE FROM resources WHERE tenant=? AND ${removed}
      AND json_extract(details,'$.removedAt')<=? ${unreferenced}`).bind(tenant,now-retentionMs),
  ]);
}
