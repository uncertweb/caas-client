<?php
$proxy_url = 'http://174.129.9.172/component-library/services/cswiso?service=CSW&request=GetRecordById&outputschema=http://www.isotc211.org/2005/gmd&elementSetName=full&id=' . $_GET['id'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $proxy_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);

header('Content-type: text/xml');

// Remove unnecessary stylesheet
echo preg_replace('/<\?xml.*?>/i', '', $output);