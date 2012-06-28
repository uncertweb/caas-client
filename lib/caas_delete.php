<?php
class Proxy
{
  private $headers;

  private function setHeaders($ch, $header)
  {
    $this->headers[] = $header;
    return strlen($header);
  }

  public function send($opts)
  {
    $this->headers = array();
    $opts[CURLOPT_HEADERFUNCTION] = array($this, 'setHeaders');
    $ch = curl_init();
    curl_setopt_array($ch, $opts);
    return curl_exec($ch);
  }

  public function getHeaders()
  {
    return $this->headers;
  }
}

$proxy_url = 'http://174.129.9.172/uncertweb-gi-caas/services/rest/processes/' . $_GET['id'];
// $proxy_url = 'http://174.129.9.172/uncertweb-gi-caas/services/rest/processes';
// $proxy_url = 'http://localhost/~williamw/client/test/test_caas.php';
$opts = array(
  CURLOPT_URL => $proxy_url,
  CURLOPT_HEADERFUNCTION => array('setHeaders'),
  CURLOPT_HTTPHEADER => array('Content-Type: text/xml'),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => 'DELETE'
);

$proxy = new Proxy();

$output = $proxy->send($opts);

foreach ($proxy->getHeaders() as $header) {
  header($header);
}

echo $output;