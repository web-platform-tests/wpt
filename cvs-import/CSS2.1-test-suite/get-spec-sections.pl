#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Spec processor to get section numbers and anchors
# no input.
# output in sections.dat.
# Version 1.0
#
# Copyright (c) 2004 by Ian Hickson
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
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307
# USA

use strict;
use utf8;
use LWP::Simple;

# read the page in from the web
my $page = get('http://www.w3.org/TR/CSS21/');
$page =~ s/\x{D}\x{A}|\x{A}\{D}|\x{D}|\x{A}/\n/gos; # normalize newlines

$page =~ m/name="toc"/gos; # skip past the minitoc
while ($page =~ m/<a href="([^"]+)" class="tocxref">(Appendix )?([A-Z]?[0-9.]+) (.+?)<\/a>/gos) {
    my $uri = "http://www.w3.org/TR/CSS21/$1";
    my $section = $3;
    my $title = $4;
    $section =~ s/\.$//gos;
    my $code = '';
    foreach (split(/\./, $section)) {
        $code .= length($_) < 2 ? "0$_" : "$_";
    }
    $title =~ s/&nbsp;/ /gos;
    $title =~ s/<[^>]+>//gos;
    print "$code $uri $section $title\n";
}
