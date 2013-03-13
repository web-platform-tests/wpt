<?php

	# The following MIME types are directly or indirectly treated as feeds by
	# browsers.
	$types = array('text/xml',
		'application/xml',
		'application/rss+xml',
		'application/atom+xml',
		'text/html'); # Yes, for real.

	if (in_array($_GET['type'],$types)) {
		header("Content-Type: ".$_GET['type'].";charset=utf-8");
	} else {
		echo "Please supply a content-type as a GET parameter, like this: rss.php?type=text/xml";
		die();
	}

	# PHP doesn't like stuff that starts with "<?"
	echo "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n";

?>
<rss version="2.0">

<channel>
<title>test</title>
<description>This is a description</description>
<link>http://www.example.com</link>
<lastBuildDate>Mon, 28 Aug 2006 11:12:55 -0400 </lastBuildDate>
<pubDate>Tue, 29 Aug 2006 09:00:00 -0400</pubDate>

<item>
<title>foobar</title>
<description>This is a story</description>
<link>http://www.example.com</link>
<guid isPermaLink="false"> 1102345</guid>
<pubDate>Tue, 29 Aug 2006 09:00:00 -0400</pubDate>
</item>

</channel>
</rss>
