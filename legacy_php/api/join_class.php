<?php
// join_class.php - Backward Compatibility Shim
// This file captures requests from users who haven't refreshed the dashboard
// and forwards them to the new class_api.php

$_POST['action'] = 'join_class';
require_once 'class_api.php';
?>
