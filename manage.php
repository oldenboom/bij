<?php 
session_start();

if (time() >= intval($_SESSION['token-expire'])) {
	session_unset();
	session_destroy();
	session_start();
}

require "db.php";

$status_values = array (
	0 => 'Nieuw',
	1 => 'Accoord',
	2 => 'Afgewezen'
);

if(empty($_SESSION['token'])) {
	$length =32;
	if (version_compare(phpversion(), '7.0.0', '<')) {
	    $_SESSION['token'] = substr(base_convert(sha1(uniqid(mt_rand())), 16, 36), 0, $length); 
	}
	else {
		$_SESSION['token'] = bin2hex(random_bytes(32));
	}
	$_SESSION['token-expire'] = time() + 3600;
}

?><html>
<head>
	<style>
		body { font: 15px Helvetica, Arial, sans-serif; }
		.grid-container { 
			display:inline-grid; 
			grid-template-columns: auto auto auto auto auto auto;
			grid-row-gap: 15px;
		}
		.grid-item {
			padding: 10px;
			background-color: #efefef;
		}



	</style>
	<style>
		<?php // switch-field learned from: https://thestizmedia.com/radio-buttons-as-toggle-buttons-with-css/ ?>
		.switch-field {
			display: flex;
			margin-bottom: 36px;
			overflow: hidden;
		}

		.switch-field input {
			position: absolute !important;
			clip: rect(0, 0, 0, 0);
			height: 1px;
			width: 1px;
			border: 0;
			overflow: hidden;
		}

		.switch-field label {
			background-color: #e4e4e4;
			color: rgba(0, 0, 0, 0.6);
			font-size: 14px;
			line-height: 1;
			text-align: center;
			padding: 8px 16px;
			margin-right: -1px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px rgba(255, 255, 255, 0.1);
			transition: all 0.1s ease-in-out;
		}

		.switch-field label:hover {
			cursor: pointer;
		}

		.switch-field input.new:checked + label {
			background-color: #ffd700;
			box-shadow: none;
		}

		.switch-field input.ok:checked + label {
			background-color: #a5dc86;
			box-shadow: none;
		}

		.switch-field input.notok:checked + label {
			background-color: #fa8072;
			box-shadow: none;
		}

		.switch-field label:first-of-type {
			border-radius: 4px 0 0 4px;
		}

		.switch-field label:last-of-type {
			border-radius: 0 4px 4px 0;
		}

	</style>
</head>
<body>

<script>
	function statusChange(radio) {
		let status = parseInt(radio.value);
		let id = parseInt(radio.name.substring(7));
		let xhttp = new XMLHttpRequest();
		xhttp.open("POST", "status.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.onloadend = function() {
        	if (this.status != 200) {
        		alert('Something went wrong while saving the status change. Try to reload the page.');
        	}
        	else {
	        	console.log(this);
	        	console.log(xhttp);
	        }
        }
        let csrf = '<?php echo $_SESSION['token']; ?>';
        let request = "id=" + id + "&status=" + status + "&csrf=" + csrf;
        xhttp.send(request);
	}
</script>


<div class="grid-container">
	<?php
	$data = get_hellos(NULL,'id desc');
	foreach($data as $record) { 
		$field_id = $record['id']; ?>
		<div class='grid-item'><?php echo strftime('%d-%m-%y %k:%M',$record['timestamp']); ?></div>
		<div class='grid-item'><?php echo $record['submitter']; ?></div>
		<div class='grid-item'><?php echo $record['group']; ?></div>
		<div class='grid-item'><?php echo $record['text']; ?></div>
		<div class='grid-item'><?php echo empty($record['drawing']) ? 'geen' : $record['drawing']; ?></div>
		<div class='grid-item'>
			<div class="switch-field">
				<input type="radio" 
					id="status-new_<?php echo $field_id;?>" 
					class="new"
					name="status_<?php echo $field_id;?>" 
					value="<?php echo STATUS_NEW; ?>" 
					<?php echo $record['status'] == STATUS_NEW ? 'checked':''; ?> 
					onclick="statusChange(this)"
				/>
				<label for="status-new_<?php echo $field_id;?>">Nieuw</label>
				<input type="radio" 
					id="status-ok_<?php echo $field_id;?>"
					class="ok" 
					name="status_<?php echo $field_id;?>" 
					value="<?php echo STATUS_OK; ?>" 
					<?php echo $record['status'] ==STATUS_OK ? 'checked':''; ?> 
					onclick="statusChange(this)"
				/>				
				<label for="status-ok_<?php echo $field_id;?>">OK</label>
				<input type="radio" 
					id="status-notok_<?php echo $field_id;?>" 
					class="notok"
					name="status_<?php echo $field_id;?>" 
					value="<?php echo STATUS_NOTOK; ?>" 
					<?php echo $record['status'] == STATUS_NOTOK ? 'checked':''; ?> 
					onclick="statusChange(this)"
				/>
				<label for="status-notok_<?php echo $field_id;?>">Niet OK</label>
			</div>
		</div>
		<?php
	} ?>
</div>
</body>
</html>