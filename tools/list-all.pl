#!/usr/bin/perl
# Print all files by filename and highlight duplicates
# Prints HTML unless '-dump' is sent as an argument on the command line,
# in which case it prints a tab-separated database

use Template;

$top = $ARGV[-1] || 'source';

@files = `find $top -type f ! -iwholename '*svn*' ! -iwholename '*build-test*' ! -iwholename '*selectors3*'`;
foreach (@files) {
  chomp;
  m!^(?:\./)?((?:[^/]+/)*)([^/]+?)(\.[a-z]+)?$!;
  next if (m!/support/!);
  next if (m!\.css$!);
  next if (m!hixie!); # temporary
  next if (m!boland!);
  unless (exists $pairs{$2}) {
    $pairs{$2} = ["$1$2$3"];
  }
  else {
    push @{$pairs{$2}}, "$1$2$3";
  }
}

my $tt = Template->new({ INCLUDE_PATH => $libroot . '/templates' }) || die $tt->error(), "\n";

if ($ARGV[0] eq '-dump') {
  $tmpl = <<'EOM'
[%- FOREACH name = pairs.keys.sort %]
[%- FOREACH path = pairs.$name %]
[% name %]	[% path %]
[%- END %][% END %]
EOM
}
else {
  $tmpl = <<'EOM'
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN">
<html>
  <title>CSS Tests by Filename</title>
  <style type="text/css">
     table { table-layout: fixed; }
     .dup { background: yellow; }
     th, td { text-align: left; }
  </style>
<body>

<h1>CSS Tests by Filename</h1>

<table>
  <thead>
    <tr><th>Filename <th>Path</tr>
  </thead>
[%- FOREACH pair = pairs.pairs %]
  <tbody[% ' class="dup"' IF pair.value.size > 1 %]>
  [%- first = 1 %]
  [%- FOREACH path = pair.value %]
    <tr[%' class="support"' IF path.match('support') %]>
    [%- IF first %]
      <th rowspan="[% pair.value.size %]">[% pair.key %]
    [%- END %]
      <td><a href="[% path %]">[% path %]</a>
    [%- first = 0 %]
  [%- END %]
  </tbody>
[%- END %]
</table>
EOM
}

$tt->process(\$tmpl, { 'pairs' => \%pairs });
