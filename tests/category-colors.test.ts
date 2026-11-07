import test from 'node:test';import assert from 'node:assert/strict';import {categoryPalette,categoryColors} from '../domain/category-colors.ts';import {contrastRatio} from '../domain/branding.ts';
test('category text meets 4.5:1 contrast across every shared label background',()=>{for(const [name,colors] of Object.entries(categoryPalette))assert.ok(contrastRatio(colors.ink,colors.background)>=4.5,name+' must remain readable');for(const name of ['Beginner','Intermediate','Advanced','Red','Yellow','Rainbow','Red / Yellow','Custom academy level']){const c=categoryColors('level',name);assert.ok(contrastRatio(c.ink,c.background)>=4.5)}});

test('academy level appearance reaches the family directory and can change without renaming the level',async()=>{
    const {fixture}=await import('./helpers.ts');
    const {applyAction,readWorkspace}=await import('../server/workspace.ts');
    const {portalState}=await import('../server/portal.ts');
    const {db}=fixture();
    const raw={action:'resource',kind:'level',name:'Bronze riders',levelAppearance:{tone:'bronze',icon:'medal'}};
    await applyAction(db,'academy',raw);
    const level=(await readWorkspace(db,'academy')).resources.find((r:{kind:string})=>r.kind==='level')!;
    await assert.rejects(applyAction(db,'academy',raw),/already exists/);
    await applyAction(db,'academy',{...raw,id:level.id,levelAppearance:{tone:'gold',icon:'shield'}});
    const portal=await portalState(db,'academy',{userId:'family',email:'family@example.invalid'});
    assert.deepEqual(portal.directory.find(r=>r.id===level.id)?.details.levelAppearance,{tone:'gold',icon:'shield'});
    await assert.rejects(applyAction(db,'academy',{...raw,id:level.id,name:'Renamed'}),/assignments/);
});
