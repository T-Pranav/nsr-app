"""Quick check before every deploy: open the built app with a pretend database and visit every page.
Stops the deploy if any page throws an error or comes up blank.  Run:  python3 tests/smoke.py [app-dir]"""
import sys,os,subprocess,time,shutil,tempfile
from playwright.sync_api import sync_playwright
here=os.path.dirname(os.path.abspath(__file__));app=sys.argv[1] if len(sys.argv)>1 else os.path.join(here,'..','app')
root=tempfile.mkdtemp();shutil.copytree(app,root+'/a')
open(root+'/a/firebase-config.js','w').write('window.FIREBASE_CONFIG={apiKey:"AIzaTEST",projectId:"nsr-test"};')
mock=open(os.path.join(here,'mockfb.js')).read();PORT=8799
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
bad=[]
try:
  with sync_playwright() as p:
    exe=os.environ.get('CHROME');b=p.chromium.launch(**({'executable_path':exe} if exe else {}))
    pg=b.new_page(viewport={'width':1280,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('https://www.gstatic.com/**',lambda r:r.fulfill(body=mock if 'app-compat' in r.request.url else '',content_type='text/javascript'))
    pg.route('https://cdnjs.cloudflare.com/**',lambda r:r.fulfill(body='',content_type='text/javascript'))
    base=f'http://localhost:{PORT}/a/'
    pg.goto(base);pg.wait_for_timeout(1500);pg.click('#langPick [data-lang="en"]');pg.wait_for_timeout(500);pg.click('#lgOwner');pg.wait_for_timeout(1200)
    views=pg.evaluate("Object.keys(NAVINFO)")
    for v in views:
      n=len(errs);pg.evaluate(f"location.hash='#{v}'");pg.wait_for_timeout(700)
      txt=pg.inner_text('#view') if pg.locator('#view').count() else ''
      if len(errs)>n:bad.append(f'layer {v}: '+errs[-1][:200])
      elif len(txt.strip())<10:bad.append(f'layer {v}: page is blank')
      print('layer',v,'ok' if len(errs)==n else 'ERROR')
    for path in ['feedmill/','vehicles/']:
      n=len(errs);pg.goto(base+path);pg.wait_for_timeout(2000)
      if len(errs)>n:bad.append(path+': '+errs[-1][:200])
      print(path,'ok' if len(errs)==n else 'ERROR')
    b.close()
finally:srv.kill();shutil.rmtree(root,ignore_errors=True)
if bad:print('\nSMOKE TEST FAILED:\n'+'\n'.join(bad));sys.exit(1)
print('\nall pages open without errors')
