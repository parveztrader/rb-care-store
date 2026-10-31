import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'dev/private/admin-fixture.json'),'utf8'));
const base='http://localhost:8096';const passed=[];
function check(condition,label){assert.ok(condition,label);passed.push(label);console.log('PASS: '+label);}
async function session(user,password){
 const cookies=new Map();
 async function request(route,options={}){const headers=new Headers(options.headers);if(cookies.size)headers.set('Cookie',Array.from(cookies).map(([k,v])=>k+'='+v).join('; '));const response=await fetch(base+route,{...options,headers,redirect:'manual'});for(const line of response.headers.getSetCookie()){const first=line.split(';')[0];const at=first.indexOf('=');cookies.set(first.slice(0,at),first.slice(at+1));}return response;}
 await request('/wp-login.php');
 const response=await request('/wp-login.php',{method:'POST',body:new URLSearchParams({log:user,pwd:password,'wp-submit':'Log In',testcookie:'1',redirect_to:base+'/wp-admin/'})});
 check(response.status===302&&Array.from(cookies.keys()).some(k=>k.startsWith('wordpress_logged_in_')),user==='rb_admin'?'admin HTTP authentication':'customer HTTP authentication');
 return request;
}
const customer=await session(fixture.customerUser,fixture.customerPassword);
for(const route of ['/wp-admin/edit.php?post_type=product','/wp-admin/post.php?post='+fixture.productId+'&action=edit','/wp-admin/edit.php?post_type=rb_seller_request','/wp-admin/post.php?post='+fixture.sellerId+'&action=edit','/wp-admin/edit.php?post_type=rb_enquiry','/wp-admin/admin.php?page=wc-orders&action=edit&id='+fixture.orderId]){
 const response=await customer(route);check(route.includes('wc-orders')?response.status===403:[302,403].includes(response.status),'customer denied '+route.split('?')[0]+(route.includes('rb_seller_request')?' seller list':route.includes('rb_enquiry')?' enquiries':route.includes('wc-orders')?' orders (403)':route.includes('post='+fixture.sellerId)?' seller edit':route.includes('post='+fixture.productId)?' product edit':' products'));
}
const env=fs.readFileSync(path.join(root,'dev/.env'),'utf8');const password=env.match(/^ADMIN_PASSWORD=(.+)$/m)[1].trim();const admin=await session('rb_admin',password);
const orderAdminPage=await admin('/wp-admin/admin.php?page=wc-orders&action=edit&id='+fixture.orderId);const orderAdminHtml=await orderAdminPage.text();check(orderAdminPage.status===200&&orderAdminHtml.includes('admin-qa@example.invalid'),'authorized admin can still edit the order after the denial fix');
const invalid=await admin('/wp-admin/post.php',{method:'POST',body:new URLSearchParams({action:'editpost',post_ID:String(fixture.productId),post_type:'product',_wpnonce:'invalid',post_title:'Invalid nonce mutation attempt'})});
check(invalid.status===403,'invalid admin form nonce is rejected');
const adminPage=await(await admin('/wp-admin/')).text();
const heartbeatMatch=adminPage.match(/var heartbeatSettings\s*=\s*({[^;]+});/);
check(Boolean(heartbeatMatch),'native heartbeat nonce exists on dashboard');
const heartbeatSettings=JSON.parse(heartbeatMatch[1]);
const heartbeat=await admin('/wp-admin/admin-ajax.php',{method:'POST',body:new URLSearchParams({action:'heartbeat',_nonce:heartbeatSettings.nonce,screen_id:'dashboard','data[rbcare_requests]':'1',interval:'15'})});
const beat=await heartbeat.json();check(heartbeat.status===200&&typeof beat.rbcare_pending==='number','authenticated admin heartbeat returns seller-request count');
const privateResponse=await fetch(base+'/wp-json/rb-care/v1/sell/'+fixture.id,{headers:{Authorization:'Bearer '+fixture.token}});const data=await privateResponse.json();
const expected=process.argv[2]||'PUBLISHED';check(data.status===expected&&Number(data.teamPrice)===1800,'tracking reflects the admin-saved '+expected+' state and exact price');
const community=await(await fetch(base+'/community/?listing='+fixture.id)).text();const main=community.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]||'';
if(expected==='PUBLISHED'){check(main.includes('RBADMINQA')&&main.includes('1,800'),'admin-published listing renders the approved price');for(const secret of ['9765432189','RB Admin QA Customer','QA locality',fixture.token,'Admin QA team quote saved through WordPress.'])check(!main.includes(secret),'community excludes a private fixture value');}
else check(!main.includes('RBADMINQA'),'closed listing is removed from community');
const photo=data.photos[0].url;check((await fetch(photo)).status===(expected==='PUBLISHED'?200:404),'public photo access follows admin publication state');
const cli=spawnSync('docker',['compose','run','--rm','cli','eval-file','/project/tests/admin-verify.php',expected],{cwd:path.join(root,'dev'),encoding:'utf8',timeout:120000});if(cli.status!==0)throw Error(cli.stderr);const verification=JSON.parse(cli.stdout.trim().split('\n').find(line=>line.startsWith('{')));for(const label of verification.passed){passed.push(label);console.log('PASS: '+label);}
fs.mkdirSync(path.join(root,'dev/reports'),{recursive:true});fs.writeFileSync(path.join(root,'dev/reports/admin-'+expected.toLowerCase()+'.json'),JSON.stringify({checkedAt:new Date().toISOString(),passed},null,2));console.log(passed.length+' backend assertions passed.');
