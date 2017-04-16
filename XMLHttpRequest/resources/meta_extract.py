import os, glob, re
from BeautifulSoup import BeautifulSoup
import json
import pdb

def scandirs(path):
    paths = []
    for currentFile in glob.glob( os.path.join(path, '*') ):
        if not os.path.isdir(currentFile):
            paths.append(currentFile)
    return paths

files = scandirs('..')
testpath = 'http://w3c-test.org/XMLHttpRequest/'
output = []

for theFile in files:
    # skip files whose path contains 'support'
    if 'support' in theFile or 'helper' in theFile:
        continue
    # skip files that aren't (X)HTML
    fileName, fileExtension = os.path.splitext(theFile)
    if not fileExtension in ['.html', '.htm', '.xhtml']:
        continue
    # Skip files that match the pattern \d-\d.* - as in 001-1.htm, which is supposedly a supporting file for 001.htm
    if re.search(re.compile('\d+-\d+\.'), theFile):
        continue
    html = open(theFile).read(2022)
    parsed_html = BeautifulSoup(html)
    links = parsed_html.findChildren('link', attrs={'rel':'help'})
    for link in links:
        linkref = link.get('href')
        linkassertations = link.get('data-tested-assertations')
        if not linkassertations:
            print 'WARNING: could not find meta data in %s' % theFile
            continue
        linkassertations = linkassertations.split(' ')
        # { testURL:'foo.html', linkhref:'http://www.w3.org/TR/...', xpaths: ['following:x', 'following::x'] }
        output.append({"testURL": re.sub(re.compile('\.\.\\\\'), testpath, theFile), "linkhref":linkref, "xpaths": linkassertations})
open('test_assertation_map.json', 'w').write(json.dumps(output, indent=4, sort_keys=True))
print 'Wrote test_assertation_map.json'
