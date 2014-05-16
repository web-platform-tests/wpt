#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-#
#
# CSS1 Test Case to CSS2.1 Test Case Convertor
#
# Copyright (c) 2003 by Ian Hickson
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA

# run this with the following command:
# mkdir css1 && cat css1-file-list.txt | xargs -n 1 perl ./convert-css1-to-css21.pl 

use strict;
use LWP::Simple;
use FileHandle;
use IPC::Open2;

if (@ARGV != 1) {
    print STDERR "Pass a single argument, a URI to convert.\n";
    exit 1;
}

my $name = shift; # read argument
print "$name\n"; # print it to stdout

# read the page in from the web
my $page = get($name);
$page =~ s/\x{D}\x{A}|\x{A}\{D}|\x{D}/\x{A}/gos;

# "parse" it
$page =~ m~  <title>CSS1\ Test\ Suite:\ [0-9.]+ \ (.+)</title>
             .+
             <style\ type="text/css">(.+)</style>
             .+
         (?: <pre>.+</pre> .*? <hr> \s*
           | <body> )
             (.+?)                                                                \n*
             <table\ border(?:="1")?\ cellspacing="0"\ cellpadding="3"\ class="tabletest"> \s*
             <tr>                                                                 \s*
             <td\ colspan="2"\ bgcolor="silver">                                  \s*
             <strong>TABLE\ Testing\ Section</strong></td>                        \s*
             </tr>                                                                \s*
             <tr>                                                                 \s*
             <td\ bgcolor="silver">&nbsp;</td>                                    \s*
             <td>                                                                 \s*
             (.+?)                                                                \n*
             </td>                                                                \s*
             </tr>                                                                \s*
             </table>                                                             \s*
             </body>                                                              \s*
             </html>                                                              \s* $
          ~xios or die "FAILED: file is not in the expected format\n";
my $title = $1;
my $stylesheet = $2;
my $content1 = $3;
my $content2 = $4;

if ($content1 ne $content2) {
    warn "test sections in test file do not match\n";
    #print "--------------------\n$content1\n--------------------\n$content2\n--------------------\n";
}

# convert to xhtml
open2(*TidyOut, *TidyIn, '/home/ianh/bin/tidy/bin/tidy -i -n -asxhtml -q -config tidy.cfg');
print TidyIn "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><title></title>$content1";
close(TidyIn);
$/ = undef; # read everything in at once, not one line at a time
my $content = <TidyOut>;

# indent stylesheet and content
$stylesheet =~ s/^(?!\n)/\n/gos;
$stylesheet =~ s/\n$//gos;
$stylesheet =~ s/\n/\n   /go;
$content =~ s/^(?!\n)/\n/gos;
$content =~ s/\n$//gos;
$content =~ s/\n/\n  /go;

# open output file
$name =~ s|^.*/||os; # use the last part of the URL's path as the filename
$name =~ s|\.html?$|.xml|os; # replace the extension with .xml
open FILE, ">css1/$name" or die "couldn't open 'css1/$name': $!\n";

# output first draft of test
print FILE <<eof;
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
 <head>
  <title>CSS 2.1 Test Suite: $title</title>
  <style type="text/css"><![CDATA[$stylesheet
  ]]></style>
 </head>
 <body>$content
 </body>
</html>
eof

close FILE;
