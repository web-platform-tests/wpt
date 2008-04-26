#!/usr/bin/perl -w

# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Test Suite Indexer
# Version 1.0
#
# Copyright (c) 2007 by Elika J. Etemad
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
use indexer;

indexer::init("http://www.w3.org/TR/CSS21/", "data/section-index.xht", "CSS Test: ");

foreach my $file (@ARGV) {
    $file =~ m/^tests\/(.+)\.xht$/os;
    my $root = $1;
    indexer::index($file, $root);
}

indexer::saveCreditsData("data/contributors.data");

indexer::saveSectionIndex("tests/by-section.xht");

indexer::saveTestData("data/testinfo.data");
