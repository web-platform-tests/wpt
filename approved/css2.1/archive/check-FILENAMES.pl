#!/usr/bin/perl -w
# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Test Suite FILENAMES checker
# input in STDIN should be contents of FILENAMES file to check
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

# read the sections in from the web
my %sectionURIs;
my %sectionTitles;
my %sectionCodes;
my $page = get('http://www.w3.org/TR/CSS21/') or die "$0: couldn't contact www.w3.org\n";
$page =~ s/\x{D}\x{A}|\x{A}\{D}|\x{D}|\x{A}/\n/gos; # normalize newlines
$page =~ m/name="toc"/gos; # skip past the minitoc
while ($page =~ m/<a href="[^"]+" class="tocxref">(?:Appendix )?([A-Z]?[0-9.]+) .+?<\/a>/gos) {
    my $section = $1;
    my $code = '';
    foreach (split(/\./, $section)) {
        $code .= length($_) < 2 ? "0$_" : "$_";
    }
    $sectionURIs{$code} = 1;
}

my %groups;
while (defined($_ = <>)) {
    next if m/^#/os;
    unless (m/^([^ ]+) ([^ ]+)( [^ ]+)*[\n\r]+$/os) {
        print "$0:$.: invalid syntax\n";
        next;
    }
    my $input = $1;
    my $filename = $2;
    my $extraSections = $3;

    unless ($filename =~ m/^t([0-9A-Z]+)-(.+)-([0-9]+)-[a-f](?:-[a-zA-Z0-9]+)?\.xht$/os) {
        print "$0:$.: invalid filename ('$filename')\n";
        next;
    }
    print "$0:$.: filename longer than 31 characters\n" if length($filename) > 31;
    my $section = $1;
    my $name = $2;
    my $num = $3;

    $groups{"$section-$name"} += 1;
    my $n = $groups{"$section-$name"};
    $n = "0$n" if $n < 10;
    print "$0:$.: 't$section-$name-$num' unexpected (expected 't$section-name-$n' first)\n" if $groups{"$section-$name"} < $num+1;
    print "$0:$.: 't$section-$name-$num' duplicate\n" if $groups{"$section-$name"} > $num+1;

    my @sections = ($section, defined $extraSections ? split(' ', $extraSections) : ());
    foreach (@sections) {
        print "$0:$.: invalid section '$_'\n" unless exists $sectionURIs{$_};
    }
}

