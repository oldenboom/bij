<?php
include "config.php";

define("STATUS_NEW",0);
define("STATUS_OK",1);
define("STATUS_NOTOK",2);

$db = new mysqli($host,$user,$password,$db);
if ($db->connect_error) {
  die("Cannot connect to MySQL database: ". $db->connect_error);
}
$sql_result = $db->query("SHOW TABLES LIKE 'hello';");
if ($sql_result->num_rows == 0) {
  // Need to create table
  $sql = "
    CREATE TABLE `$table` (
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
      `timestamp` int(11) DEFAULT NULL,
      `text` char(200) DEFAULT NULL,
      `name` char(30) DEFAULT NULL,
      `group` char(6) DEFAULT NULL,
      `drawing` char(30) DEFAULT NULL,
      `status` int(11) DEFAULT NULL,
      `ip` char(45) DEFAULT NULL,
      `user_agent` text DEFAULT NULL,
      PRIMARY KEY (`id`),
      KEY `group_idx` (`group`),
      KEY `status_idx` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  ";
  $db->query($sql);
}


function get_hellos($status = NULL, $ordering = NULL) {
  global $db,$table;

  $sql = "SELECT * FROM `$table` ";
  if ($status) $sql .= " WHERE $status == $status";
  if ($ordering) $sql .= "ORDER BY $ordering";

  $sql_result = $db->query($sql);
  $data = [];
  while ($row = $sql_result->fetch_object()) {
    $record = [
        'id'  => $row->id,
        'timestamp'     => $row->timestamp,
        'text'          => $row->text,
        'submitter'     => $row->name,
        'group'         => $row->group,
        'drawing'       => $row->drawing,
        'status'        => $row->status,
        'ip'            => $row->ip,
        'browser_agent' => $row->browser_agent
    ];
    $data[] = $record;
  }
  return $data;
}


function get_approved_hellos() {
  return get_hellos(STATUS_OK);
}


function save_to_database($record) {
  global $db;

  $timestamp  = $record['timestamp'] ? intval($record['timestamp'],10) : time();
  $text       = real_escape_string($record['timestamp']);
  $name       = real_escape_string($record['submitter']);
  $group      = real_escape_string($record['group']);
  $drawing    = $record['drawing'] ? real_escape_string($record['drawing']) : '';
  $status     = $record['status'] ? intval($record['status'],10) : 0;
  $ip         = $record['ip'] ? real_escape_string($record['ip']) : '';
  $browser_agent = $record['browser_agent'] ? real_escape_string($record['browser_agent']) : '';



  $sql = sprintf("INSERT INTO `%s` SET (`timestamp`,`text`,`name`,`group`,`drawing`,`status`,`ip`,`browser_agent`) VALUES (%d,'%s','%s','%s','%s',%d,'%s','%s'",$timestamp,$text,$name,$group,$drawing,$status,$ip,$browser_agent);
}

?>