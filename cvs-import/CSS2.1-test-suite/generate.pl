#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Test Suite Generator
# Version 1.0
#
# Copyright (c) 2003, 2004 by Ian Hickson
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
use lib 'lib';
use parser;
use format::xhtml1;
use format::html4;

foreach my $file (@ARGV) {
    $file =~ m/^tests\/(.+)\.xht$/os;
    my $root = $1;
    my $tree = parser::parse($file);
    save("dist/$root.xht", format::xhtml1::output($tree));
    save("dist/$root.htm", format::html4::output($tree));
    # XXX remember something about the tests
}

print "dist/.htaccess\n";
open(FILE, '>', 'dist/.htaccess') or die "dist/.htaccess: $!\n";
print FILE "AddType application/xhtml+xml .xht\n";
print FILE "AddType text/html .htm\n";
print FILE "AddType text/css .css\n";
print FILE "AddType image/png .png\n";
close(FILE);


sub save {
    my($filename, $data) = @_;
    return unless defined $data;
    print "$filename\n";
    open(FILE, '>', $filename) or die "$filename: $!\n";
    print FILE $data;
    close(FILE);
}
