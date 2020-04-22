<?php

include "db.php";

session_start();

function handle_post_var($var) {
	if (isset($_POST[$var])) {
		return addslashes(urldecode($_POST[$var]));
	}
	else {
		return '';
	}
}


function get_post_data() {
	$id = handle_post_var('id');
	$status = handle_post_var('status');
	$ip = $_SERVER['REMOTE_ADDR'];
	$user_agent = $_SERVER['HTTP_USER_AGENT'];

	$record = array(
		'id'		 => $id,
		'status'	 => $status,
		'ip' 		 => $ip,
		'user_agent' => $user_agent
	);
	return $record;
}


function check_csrf() {
	$retValue = false;
	if (isset($_POST['csrf']) && $_SESSION['token'] == $_POST['csrf']) {
		if (time() >= $_SESSION['token-expire']) {
			$retValue = ['response' => 'expired'];
		}
		else {
			$retValue = true;
		}
	}
	return $retValue;
}


// MAIN

$csrf = check_csrf();

if ($csrf !== false) {
	// valid csrf token, although maybe expired
	if ( $csrf === true && isset( $_POST['id']) && isset( $_POST['status']))  {
		$result = set_status(intval($_POST['id']),intval($_POST['status']));
		$retValue = ['response' => $result];
	}
	else {
		$retValue = $csrf;
	}

	header('Content-type: application/json');
	$json = json_encode($retValue,JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	echo $json;
}
else {
	echo header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found"); 
}


?>