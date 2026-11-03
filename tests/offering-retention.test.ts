import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.ts';
import {expireRemovedOfferings,purgeRemovedOffering} from '../server/offering-retention.ts';

test('retention purges old unused offerings and keeps linked, recent and foreign records',async()=>{
  const {db}=fixture();
  const day=86400000;
  const now=Date.now();
  for (const [id,tenant,days] of [['old','a',61],['recent','a',59],['linked','a',61],['foreign','b',61]] as const) {
    await db.prepare("INSERT INTO resources VALUES(?,?,'lesson',?,?)").bind(id,tenant,id,JSON.stringify({archived:true,removedAt:now-days*day})).run();
  }
  await db.prepare("INSERT INTO sessions VALUES('session','a','linked',?,?,1,'canceled','request')").bind(now-day,now).run();
  await expireRemovedOfferings(db,'a',now);
  const rows=await db.prepare('SELECT id FROM resources ORDER BY id').all<{id:string}>();
  assert.deepEqual(rows.results.map(r=>r.id),['foreign','linked','recent']);
  await assert.rejects(purgeRemovedOffering(db,'a','linked'),/calendar or plan references/);
  await assert.rejects(purgeRemovedOffering(db,'a','foreign'),/calendar or plan references/);
  await purgeRemovedOffering(db,'a','recent');
  assert.equal(await db.prepare("SELECT id FROM resources WHERE id='recent'").first(),null);
});
