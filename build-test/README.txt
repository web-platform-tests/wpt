CSS Test Suite Common Makefile
==============================
   
==============================
QUICK START
==============================
run make VERSION={VERSION_NAME}
e.g. 
	make VERSION=css2_1
	make VERSION=css3-color

==============================
BASIC PROCESS
==============================
1.  Test source files are copied from src directories (and possibly others 
	depending on make options and version. e.g. calling devel copies
	some unreviewed tests from the css svn repository to be included)

2.  The relevant CSS spec is accessed via HTTP (or a saved copy of the 
	spec data is used if DATASOURCE=file is passed to the makefile)

3.  Tests are converted to xhtml, html and xhtml1print formats using
	modules in lib/common/format

4.  the specManager (lib/common/specManager.pm and 
	lib/{VERSION_NAME}/{VERSION_NAME}_specManager.pm) creates appropriate 
	HTML output files to index the tests and organize according
	to chapter wherer appropriate.  

5.  Output is saved in dist/{VERSION_NAME}

==============================
Supporting Files
==============================
lib		perl modules used in the build
tools		scripts called by the Makefile
{VERSION_NAME}	data, source files and report templates for a spec version
common		data, rouces files and report templates common to all specs
css1		Old tests used in the css2_1 test build
templates	Template files used by Template Toolkit
tests		Temporary directory built and blown away by make files
devel		Templrary directory housing devel tests from devel builds

==============================
ADDING A NEW CSS3 MODULE
==============================
1.  Add a top level directory for the module name (e.g. css3-MODULE)
2.  Create css3-MODULE/src and populate it with test source files
3.  If your tests will have an extension other than xht, edit the 
	Makefile to set the TESTEXTENSION variable
4.  run make VERSION=css3-MODULE
5.  Visit dist/css3-MODULE

==============================
LICENSE
==============================
These tests are copyright by their respective author(s) and/or the
World Wide Web Consortium (W3C) as indicated.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

  1. Redistributions of source code must retain the above copyright
     notice, this list of conditions and the following disclaimer.
  2. Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in
     the documentation and/or other materials provided with the
     distribution.
  3. Neither the name of the World Wide Web Consortium (W3C) nor the
     names of its contributors may be used to endorse or promote
     products derived from this software without specific prior
     written permission.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.

CONTRIBUTE

If you want to contribute to this test suite, please read the guidelines
at http://csswg.inkedblade.net/test/css2.1/contribute

Since the built version of this test suite is released under both the
BSD 3-clause license (data/LICENSE-BSD) and the W3C Document License
(data/LICENSE-W3CD), you will need to send the following statement to
(preferably) public-css-testsuite@w3.org or (alternatively)
www-archive@w3.org:

  I agree to license under the BSD 3-clause license [1] all my
  contributions to the W3C CSS Test Suites.

  [1] http://www.opensource.org/licenses/bsd-license.php

  I also hereby grant to the W3C, a perpetual, non-exclusive,
  royalty-free, world-wide right and license under my copyrights
  in these contributions to copy, publish, use, modify, and to
  distribute my contributions under the W3C Document License [2],
  as well as a right and license of the same scope to any
  derivative works that are prepared by the W3C or contributors
  working on its behalf and that are based on or incorporating
  all or part of my contributions.

  [2] http://www.w3.org/Consortium/Legal/2002/copyright-documents-20021231

------------------------------------------------------------------------To follow ...
