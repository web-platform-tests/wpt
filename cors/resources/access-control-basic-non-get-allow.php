<?PHP

if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") {
    header("Content-Type: text/plain");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: PUT");
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} elseif ($_SERVER['REQUEST_METHOD'] == "PUT") {
    header("Content-Type: text/plain");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);

    echo "PASS: Cross-domain access allowed.\n";
    $request_body = @file_get_contents('php://input');
    echo $request_body ;
} else {
    header("Content-Type: text/plain");
    echo "Wrong method: " . $_SERVER['REQUEST_METHOD'] . "\n";
}

?>
