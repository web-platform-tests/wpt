<?php
while (!file_exists("csp-report." . $_GET["test"] . ".txt")) {
    usleep(10000);
    // file_exists() caches results, we want to invalidate the cache.
    clearstatcache();
}

echo "<html><body>\n";
echo "CSP report received:";
$reportFile = fopen("csp-report." . $_GET["test"] . ".txt", 'r');
while ($line = fgets($reportFile)) {
    echo "<br>";
    echo trim($line);
}
fclose($reportFile);
unlink("csp-report." . $_GET["test"] . ".txt");
echo "<script>";
echo "if (window.testRunner)";
echo "    testRunner.notifyDone();";
echo "</script>";
echo "</body></html>";
?>
