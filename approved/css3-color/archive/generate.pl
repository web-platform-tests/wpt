#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Test Suite Generator
# Version 1.0
#
# Copyright (c) 2003, 2004 by Ian Hickson
# Modified for css3-color by L. David Baron
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
use lib '../CSS2.1-test-suite/lib';
use parser;
use format::xhtml1;
use format::html4;
use format::xhtml1print;

foreach my $file (@ARGV) {
    $file =~ m/^tests\/(.+)\.xht$/os;
    my $root = $1;
    my $tree = parser::parsefile($file);
    save("dist/xhtml1/$root.xht", format::xhtml1::output($tree));
    save("dist/html4/$root.htm", format::html4::output($tree));
    save("dist/xhtml1print/$root.xht", format::xhtml1print::output($tree,$root));
    # XXX remember something about the tests
}

sub save {
    my($filename, $data) = @_;
    return unless defined $data;
    print "$filename\n";
    open(FILE, '>:utf8', $filename) or die "$filename: $!\n";
    print FILE $data;
    close(FILE);
}
