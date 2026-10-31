import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'dev/private/admin-fixture.json');
const fixture=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
if(fixture.finished){console.log('Backend fixtures were already cleaned up.');process.exit(0);}
const result=spawnSync('docker',['compose','run','--rm','cli','eval-file','/project/tests/admin-cleanup.php'],{cwd:path.join(root,'dev'),encoding:'utf8',timeout:120000});
if(result.status!==0)throw Error(result.stderr);console.log(result.stdout.trim());fixture.finished=true;fs.writeFileSync(file,JSON.stringify(fixture,null,2));
