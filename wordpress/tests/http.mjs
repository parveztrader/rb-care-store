import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'http://localhost:8096';
const report = [];
function check(condition, label) { assert.ok(condition,label); report.push(label); console.log('PASS: '+label); }
function cli(file) {
  const result = spawnSync('docker',['compose','run','--rm','cli','eval-file','/project/tests/'+file],{cwd:path.join(root,'dev'),encoding:'utf8',timeout:120000});
  if (result.stdout) console.log(result.stdout.trim());
  if (result.status !== 0) throw new Error(result.stderr || 'CLI integration failed.');
}
const fixturePath = path.join(root,'dev/private/http-fixture.json');
let fixture;
try {
  for (const route of ['/','/products/','/products/lg-7kg-front-load-washing-machine/','/sell/','/sell/track/','/community/','/cart/','/checkout/','/my-account/','/bulk/','/contact/','/faq/','/policies/warranty/']) {
    const response = await fetch(base+route); check(response.status===200,route+' renders');
    const html=await response.text();check(!html.includes('Fatal error') && !html.includes('Great things are on the horizon'),route+' has no fatal error or coming-soon blocker');
  }
  for (const route of ['/wp-json/wc/v3/orders','/wp-json/wp/v2/rb_seller_request','/api/checkout/confirm']) {
    const response=await fetch(base+route);check([401,403,404,405].includes(response.status),route+' is not anonymously accessible');
  }
  const origin = await fetch(base+'/wp-json/rb-care/v1/sell',{method:'POST',headers:{Origin:'https://example.invalid'}});
  check(origin.status===403,'cross-origin seller submission rejected');
  const form = new FormData();
  const input = {category:'Washing Machine',brand:'RBTEST',model:'Isolated Local Fixture',capacity:'7 kg',age:'1–3 years',condition:'Working well',description:'Automated test appliance with visible cosmetic marks.',repairs:'None specified.',name:'RB Care Test Customer',phone:'9876543210',city:'Lucknow',area:'Test locality',pincode:'226001',publishConsent:'1',contactConsent:'1',status:'PUBLISHED',teamPrice:'1'};
  for(const [key,value]of Object.entries(input))form.set(key,value);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  form.append('photos[]',new Blob([png],{type:'image/png'}),'test.png');
  const created=await fetch(base+'/wp-json/rb-care/v1/sell',{method:'POST',body:form});
  const data=await created.json();check(created.status===201,'multipart seller request saved');
  fixture={id:data.id,token:data.token};fs.writeFileSync(fixturePath,JSON.stringify(fixture));
  check(data.trackingUrl.includes('#'+fixture.id+':'),'tracking secret appears only in the receipt fragment');
  const noAuth=await fetch(base+'/wp-json/rb-care/v1/sell/'+fixture.id);check(noAuth.status===404,'tracking details require the bearer secret');
  const headers={Authorization:'Bearer '+fixture.token};
  const authorized=await fetch(base+'/wp-json/rb-care/v1/sell/'+fixture.id,{headers});
  const privateData=await authorized.json();check(authorized.status===200 && privateData.status==='NEW' && Number(privateData.teamPrice)===0,'customer cannot set the team price/status');
  check((authorized.headers.get('cache-control')||'').includes('no-store'),'tracking response disables caching');
  const photo=privateData.photos[0].url;
  check((await fetch(photo)).status===404,'unpublished photo is private');
  const privatePhoto=await fetch(photo,{headers});check(privatePhoto.status===200 && privatePhoto.headers.get('content-type')==='image/png','seller can fetch own private image');
  const communityBefore=await(await fetch(base+'/community/')).text();check(!communityBefore.includes('RBTEST'),'new request is absent from public community');
  const enquiry=new FormData();for(const [key,value]of Object.entries({kind:'bulk',name:'RB Care Test Customer',phone:'9876543210',city:'Lucknow',organisation:'Test organisation',quantity:'3',budget:'10000',categories:'Test washing machines',deliveryNeed:'Local testing only',contactConsent:'1'}))enquiry.set(key,value);
  const enquiryResponse=await fetch(base+'/wp-json/rb-care/v1/enquiry',{method:'POST',body:enquiry});
  const enquiryData=await enquiryResponse.json();check(enquiryResponse.status===201 && /^RBE-\d+$/.test(enquiryData.reference),'bulk enquiry is saved with a receipt');
  fixture.enquiryId=Number(enquiryData.reference.slice(4));fs.writeFileSync(fixturePath,JSON.stringify(fixture));
  cli('integration.php');
  const community=await(await fetch(base+'/community/?listing='+fixture.id)).text();
  const communityView=community.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
  check(communityView.includes('RBTEST') && communityView.includes('2,300'),'approved community listing shows the team price');
  for(const sensitive of [input.phone,input.name,input.area,input.pincode,fixture.token,'Team-approved local fixture'])check(!communityView.includes(sensitive),'community omits private '+(sensitive===fixture.token?'tracking secret':sensitive===input.phone?'phone':sensitive===input.name?'name':sensitive===input.area?'area':sensitive===input.pincode?'PIN':'owner note'));
  check((await fetch(photo)).status===200,'published consented photo is publicly accessible');
  check((await fetch(base+'/community/'+fixture.id+'/')).status===200,'legacy community detail URL is supported');
  console.log(report.length+' HTTP assertions passed.');
} finally {
  if(fixture){try{cli('cleanup.php');}catch(error){console.error('Fixture cleanup failed: '+error.message);} }
  fs.mkdirSync(path.join(root,'dev/reports'),{recursive:true});
  fs.writeFileSync(path.join(root,'dev/reports/http.json'),JSON.stringify({checkedAt:new Date().toISOString(),passed:report},null,2));
}
