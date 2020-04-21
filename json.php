<?php
include "db.php";

$data = get_approved_hellos();

$json = json_encode($data,JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);

header('Content-type: application/json');
echo $json;
?>