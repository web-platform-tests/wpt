#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Spec processor to get section numbers and anchors
# no input.
# output in sections.dat.
# Version 1.0
#
# Copyright (c) 2004 by Ian Hickson
# Modified for cssom-view by Peter Linss
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
my $specURI = 'http://www.w3.org/TR/cssom-view/';
my $page = get($specURI);
$page =~ s/\x{D}\x{A}|\x{A}\{D}|\x{D}|\x{A}/\n/gos; # normalize newlines

# remove everything except the toc
$page =~ s/.*<!--begin-toc-->//os;
$page =~ s/<!--end-toc-->.*//os;

while ($page =~ m/<a[\s]+href=[\'\"]?([^\"\']+)[\'\"]?><span[\s]+class=[\'\"]?secno[\'\"]?>([A-Z]?[0-9.]+)[\s]+<\/span>(.+?)<\/a>/gos) {
    my $uri = "$specURI$1";
    my $section = $2;
    my $title = $3;
    $title =~ s/&nbsp;/ /gos;
    $title =~ s/<[^>]+>//gos;
    $title =~ s/\n/ /gos;
    $title =~ s/ +/ /gos;
    print "$uri\t$section\t$title\n";
}
