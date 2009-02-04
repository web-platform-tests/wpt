#!/usr/bin/perl -w

# -*- Mode: perl; tab-width: 4; indent-tabs-mode: nil; -*-
#
# CSS2.1 Test Suite Indexer
# Version 1.0
#
# Copyright (c) 2007 by Elika J. Etemad
# Modified to use specManager Class by Tom Harms

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
use lib 'lib/common';
my $specVersion = shift || die "Missing Spec Version";;
my $dataSource = shift || 'file';
my $useAssertions = shift || 'false';
my $specManagerString;
my $commonSpecVersion = $specVersion;
if ($specVersion eq 'css2_1') {
    push @INC, "lib/$specVersion";
    $specManagerString = $specVersion . '_specManager';
    eval "require $specManagerString";
} else {
    push @INC, "lib/css3_common";
    require css3_common_specManager;
    $specManagerString = 'css3_common_specManager';
    $commonSpecVersion = 'css3_common';
}
my $specManager = new $specManagerString({specVersion=>$specVersion,
					  useAssertions=>$useAssertions});
$specManager->writeIndexFiles({dataSource=>$dataSource,
			       files=>\@ARGV});
$specManager->saveCreditsData("$specVersion/data/contributors.data");
$specManager->saveTestData("$specVersion/data/testinfo.data");

print "processed " . $specManager->{processedTests} . " tests\n";
print "Did not process " . $specManager->{notProcessedTests} . " tests\n";
print "Non-fatal errors below: \n\n";
my $errors = $specManager->{errors};
foreach (@$errors) {
    print "$_\n";
}

