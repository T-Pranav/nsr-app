# regenerate patches/xport.js (feed mill) from the farm app's export code
s=open('src/index.html').read()
a=s.find('function xTitle(');b=s.find('/* ================= SOP')
blk=s[a:b]
i=blk.find('function xTables(');j=blk.find('function xClean(');blk=blk[:i]+blk[j:]
i=blk.find('function xPdf(');j=blk.find('function xCsv(');blk=blk[:i]+blk[j:]
old=open('patches/xport.js').read()
shim=old[:old.find('function xTitle(')];end=old[old.find('\nwindow.FMX='):]
open('patches/xport.js','w').write(shim+blk+end)
print('xport',len(blk))
