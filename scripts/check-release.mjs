import {readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const tests=readdirSync('tests').filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f);
for(const args of [['node_modules/typescript/bin/tsc','--noEmit','--pretty','false'],['--experimental-strip-types','--test',...tests],['scripts/run-framework.mjs','build']]){const result=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});if(result.status!==0)process.exit(result.status??1)}
console.log('Automated release checks passed. Record visual/interaction verification separately in the release notes.');
