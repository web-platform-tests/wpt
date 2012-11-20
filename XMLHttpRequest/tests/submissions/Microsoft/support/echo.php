<?php
    if (isset($_GET["content"]))
    {
        echo $_GET["content"];
    }
    else
    {
        echo file_get_contents("php://input");
    }    
?>
