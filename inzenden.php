<?php

include "db.php";

function handle_post_var($var) {
	if (isset($_POST[$var])) {
		return addslashes(urldecode($_POST[$var]));
	}
	else {
		return '';
	}
}


function get_post_data() {
	$name = handle_post_var('submitter');
	$group = handle_post_var('group');
	$text = handle_post_var('text');
	$ip = $_SERVER['REMOTE_ADDR'];
	$user_agent = $_SERVER['HTTP_USER_AGENT'];

	$record = array(
		'timestamp'	=> time(),
		'text'		=> $text,
		'name' 		=> $name,
		'group' 	=> $group,
		'drawing' 	=> '',
		'status' 	=> 0,
		'ip' 		=> $ip,
		'user_agent' => $user_agent
	);
	return $record;
}


// MAIN

if ( isset( $_POST['submitter']) && isset( $_POST['group']) && isset( $_POST['text']) ) {
	$record = get_post_data();
	save_to_database($record);
}
else {
	echo header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found"); 
}
?>