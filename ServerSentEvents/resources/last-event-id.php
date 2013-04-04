<?php
  header("Content-Type: text/event-stream");
  $id = $_SERVER['HTTP_LAST_EVENT_ID'];

  if($id)
    echo "data: $id\n\n";
  else {
    echo "id: …\n";
    echo "retry: 200\n";
    echo "data: hello\n\n";
  }
?>

