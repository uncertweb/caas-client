<?php
$proxy_url = 'http://174.129.9.172/gi-caas/services/http-post-publish';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $proxy_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);
if (!$output)
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
header('Content-type: text/xml');
echo $response;