<?php
require('../../extras/Uploader.php');
require_once('../../../../configuracao_servidor.php');

// Directory where we're storing uploaded images
// Remember to set correct permissions or it won't work
//$upload_dir = dirname(__FILE__) . '/upload_files/';

//$upload_dir = $_SERVER['DOCUMENT_ROOT'] . '/tcc/images/uploads/logos/';

ini_set('post_max_size', '64M');
  ini_set('upload_max_filesize', '64M');

//Path para o endereco base do servidor
if ($_SERVER["REMOTE_ADDR"] == '127.0.0.1'){
	$server_root = $_SERVER["DOCUMENT_ROOT"].'/tcc/'; 
} else {
	$server_root = $pasta_upload; // vem do arquivo de configuracao do servidor
}

$upload_dir = $server_root . '/images/uploads/logos/';

$uploader = new FileUpload('uploadfile');

$novo_nome = md5(uniqid(rand(), true)).'.'.$uploader->getExtension();
$uploader->newFileName = $novo_nome;

// Handle the upload
$result = $uploader->handleUpload($upload_dir);

if (!$result) {
  exit(json_encode(array('success' => false, 'msg' => $uploader->getErrorMsg())));  
}

require_once($server_root . '/libs/Model/Miniatura.php');		

$pasta = $upload_dir;
$img_name = $novo_nome;

createthumb($pasta.$img_name, $pasta.'small/'.$img_name, 320,320,false, true, false);
createthumb($pasta.$img_name, $pasta.'medium/'.$img_name, 720,720,false, true, false);
createthumb($pasta.$img_name, $pasta.'large/'.$img_name, 1000,1000,false, true, false);

echo json_encode(array('success' => true, 'img' => $uploader->newFileName));
