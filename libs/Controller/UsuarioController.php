<?php

/** @package    Certificados FAROL::Controller */
/** import supporting libraries */
require_once("AppBaseController.php");
require_once("Model/Usuario.php");

/**
 * UsuarioController is the controller class for the Usuario object.  The
 * controller is responsible for processing input from the user, reading/updating
 * the model as necessary and displaying the appropriate view.
 *
 * @package Certificados FAROL::Controller
 * @author ClassBuilder
 * @version 1.0
 */
class UsuarioController extends AppBaseController 
{

    /**
     * Override here for any controller-specific functionality
     *
     * @inheritdocs
     */
    protected function Init() {
        parent::Init();
		
		// TODO: add controller-wide bootstrap code
		
		// DO SOME CUSTOM AUTHENTICATION FOR THIS PAGE
		// Requer permissão de acesso
		$this->RequirePermission(Usuario::$P_ADMIN,
				'SecureExample.LoginForm',
				'Autentique-se para acessar esta página',
				'Você não possui permissão para acessar essa página ou sua sessão expirou');
    }
	
	/**
     * Displays a list view of Usuario objects
     */
    public function ListView() {			
        $this->Render();
    }

    /**
     * API Method queries for Usuario records and render as JSON
     */
    public function Query() {
        try {
            $criteria = new UsuarioCriteria();
			
			$criteria->IdUsuario_GreaterThan = 1; // para não lista o usuario Master

            // TODO: this will limit results based on all properties included in the filter list 
            $filter = RequestUtil::Get('filter');
            if ($filter)
                $criteria->AddFilter(
                        new CriteriaFilter('Nome,Email,Login,TipoUsuario'
                        , '%' . $filter . '%')
                );

            // TODO: this is generic query filtering based only on criteria properties
            foreach (array_keys($_REQUEST) as $prop) {
                $prop_normal = ucfirst($prop);
                $prop_equals = $prop_normal . '_Equals';

                if (property_exists($criteria, $prop_normal)) {
                    $criteria->$prop_normal = RequestUtil::Get($prop);
                } elseif (property_exists($criteria, $prop_equals)) {
                    // this is a convenience so that the _Equals suffix is not needed
                    $criteria->$prop_equals = RequestUtil::Get($prop);
                }
            }

            $output = new stdClass();

            // if a sort order was specified then specify in the criteria
            $output->orderBy = RequestUtil::Get('orderBy');
            $output->orderDesc = RequestUtil::Get('orderDesc') != '';
            if ($output->orderBy)
                $criteria->SetOrder($output->orderBy, $output->orderDesc);

            $page = RequestUtil::Get('page');

            if ($page != '') {
                // if page is specified, use this instead (at the expense of one extra count query)
                $pagesize = $this->GetDefaultPageSize();

                $usuarios = $this->Phreezer->Query('Usuario', $criteria)->GetDataPage($page, $pagesize);
                $output->rows = $usuarios->ToObjectArray(true, $this->SimpleObjectParams());
                $output->totalResults = $usuarios->TotalResults;
                $output->totalPages = $usuarios->TotalPages;
                $output->pageSize = $usuarios->PageSize;
                $output->currentPage = $usuarios->CurrentPage;
            } else {
                // return all results
                $usuarios = $this->Phreezer->Query('Usuario', $criteria);
                $output->rows = $usuarios->ToObjectArray(true, $this->SimpleObjectParams());
                $output->totalResults = count($output->rows);
                $output->totalPages = 1;
                $output->pageSize = $output->totalResults;
                $output->currentPage = 1;
            }


            $this->RenderJSON($output, $this->JSONPCallback());
        } catch (Exception $ex) {
            $this->RenderExceptionJSON($ex);
        }
    }

    /**
     * API Method retrieves a single Usuario record and render as JSON
     */
    public function Read() {
        try {
            $pk = $this->GetRouter()->GetUrlParam('idUsuario');
            $usuario = $this->Phreezer->Get('Usuario', $pk);
            $this->RenderJSON($usuario, $this->JSONPCallback(), true, $this->SimpleObjectParams());
        } catch (Exception $ex) {
            $this->RenderExceptionJSON($ex);
        }
    }

    /**
     * API Method inserts a new Usuario record and render response as JSON
     */
    public function Create() {
        try {

            $json = json_decode(RequestUtil::GetBody());

            if (!$json) {
                throw new Exception('The request body does not contain valid JSON');
            }

            $usuario = new Usuario($this->Phreezer);

            // TODO: any fields that should not be inserted by the user should be commented out
            // this is an auto-increment.  uncomment if updating is allowed
            // $usuario->IdUsuario = $this->SafeGetVal($json, 'idUsuario');

            $usuario->Nome = $this->SafeGetVal($json, 'nome');
            $usuario->Email = $this->SafeGetVal($json, 'email');
            $usuario->Login = $this->SafeGetVal($json, 'login');
            $usuario->Senha = $this->SafeGetVal($json, 'senha');
			$usuario->ConfirmarSenha = $this->SafeGetVal($json, 'confirmarSenha');
            
			//converte a string do tipo de usuario para o formato do banco
            $usuario->TipoUsuario = ($this->SafeGetVal($json, 'tipoUsuario', $usuario->TipoUsuario) == 'admin') ? 1 : 0;

            $usuario->Validate();
            $errors = $usuario->GetValidationErrors();

            if (count($errors) > 0) {
                $this->RenderErrorJSON('Verifique erros no preenchimento do formulário', $errors);
            } else {
                $usuario->Save();
                $this->RenderJSON($usuario, $this->JSONPCallback(), true, $this->SimpleObjectParams());
            }
        } catch (Exception $ex) {
			$this->StartObserving();
            $this->RenderExceptionJSON($ex);
        }
    }

    /**
     * API Method updates an existing Usuario record and render response as JSON
     */
    public function Update() {
        try {

            $json = json_decode(RequestUtil::GetBody());

            if (!$json) {
                throw new Exception('The request body does not contain valid JSON');
            }

            $pk = $this->GetRouter()->GetUrlParam('idUsuario');
            $usuario = $this->Phreezer->Get('Usuario', $pk);

            // TODO: any fields that should not be updated by the user should be commented out
            // this is a primary key.  uncomment if updating is allowed
            // $usuario->IdUsuario = $this->SafeGetVal($json, 'idUsuario', $usuario->IdUsuario);

            $usuario->Nome = $this->SafeGetVal($json, 'nome', $usuario->Nome);
            $usuario->Email = $this->SafeGetVal($json, 'email', $usuario->Email);
            $usuario->Login = $this->SafeGetVal($json, 'login', $usuario->Login);
            
			$senha = $this->SafeGetVal($json, 'senha', $usuario->Senha);
			if($senha != ''){ $usuario->Senha = $senha; }
			
			$usuario->ConfirmarSenha = $this->SafeGetVal($json, 'confirmarSenha');
			
			//converte a string do tipo de usuario para o formato do banco
            $usuario->TipoUsuario = ($this->SafeGetVal($json, 'tipoUsuario', $usuario->TipoUsuario) == 'admin') ? 1 : 0;

            $usuario->Validate();
            $errors = $usuario->GetValidationErrors();

            if (count($errors) > 0) {
                $this->RenderErrorJSON('Verifique erros no preenchimento do formulário', $errors);
            } else {
				
				//Substitui o nome do usuário se estiver logado ali em cima no header e editá-lo
				if($usuario->IdUsuario == $this->GetCurrentUser()->IdUsuario)
					$_SESSION['nomeUser'] = $usuario->Nome;
				
                $usuario->Save();
                $this->RenderJSON($usuario, $this->JSONPCallback(), true, $this->SimpleObjectParams());
            }
        } catch (Exception $ex) {			
            $this->RenderExceptionJSON($ex);
        }
    }

    /**
     * API Method deletes an existing Usuario record and render response as JSON
     */
    public function Delete() {
        try {

            // TODO: if a soft delete is prefered, change this to update the deleted flag instead of hard-deleting

            $pk = $this->GetRouter()->GetUrlParam('idUsuario');
            $usuario = $this->Phreezer->Get('Usuario', $pk);
		
		    //Verifica se existem certificados emitidos pelo usuario, senao existerem, permite a exclusao
			require_once("Model/Certificado.php");
			$criteria = new CertificadoCriteria();
			$criteria->IdUsuario_Equals = $pk;			
			try {
				$certificados = $this->Phreezer->GetByCriteria("Certificado", $criteria);	
				throw new Exception('Não é possível excluir um usúario do sistema que possui certificados emitidos por ele');
			} catch(NotFoundException $nfex){
				$usuario->Delete();
			}

            $output = new stdClass();

            $this->RenderJSON($output,$this->JSONPCallback());
        } catch (Exception $ex) {
            $this->RenderExceptionJSON($ex);
        }
    }

}

?>
