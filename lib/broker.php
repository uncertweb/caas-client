<?php
$proxy_url = 'http://174.129.9.172/component-library/services/opensearchgeo?' . $_SERVER['QUERY_STRING'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $proxy_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);
if (!$output || preg_match("/&fail=true/", $_SERVER['QUERY_STRING']) > 0)
{
  $response = json_encode(array(
    "Exception" => array("message" => "Error with request: " . curl_error($ch)),
    'URL' => $proxy_url
  ));
}
else
{
  $response = $output;
}
header('Content-type: application/atom+xml');
echo $response;