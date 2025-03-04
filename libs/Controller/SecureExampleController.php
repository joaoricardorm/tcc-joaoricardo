﻿<?php
/** @package Cargo::Controller */

/** import supporting libraries */
require_once("AppBaseController.php");
require_once("Model/Usuario.php");

/**
 * SecureExampleController is a sample controller to demonstrate
 * one approach to authentication in a Phreeze app
 *
 * @package Cargo::Controller
 * @author ClassBuilder
 * @version 1.0
 */
class SecureExampleController extends AppBaseController
{
	public $paginaLoginRedirect;
	
	/**
	 * Override here for any controller-specific functionality
	 */
	protected function Init() 
	{
		parent::Init();

		$this->paginaLoginRedirect = $this->Context->Get('paginaLoginRedirect');
		
		// TODO: add controller-wide bootstrap code
	}
	
	/**
	 * This page requires ExampleUser::$PERMISSION_USER to view
	 */
	public function UserPage()
	{
		$this->RequirePermission(Usuario::$P_USUARIO, 
				'SecureExample.LoginForm', 
				'Login is required to access the secure user page',
				'You do not have permission to access the secure user page');
		
		$this->Assign("currentUser", $this->GetCurrentUser());
		
		$this->Assign('page','userpage');
		$this->Render("SecureExample");
	}
	
	/**
	 * This page requires ExampleUser::$PERMISSION_ADMIN to view
	 */
	public function AdminPage()
	{
		$this->RequirePermission(Usuario::$P_ADMIN, 
				'SecureExample.LoginForm', 
				'Login is required to access the admin page',
				'Admin permission is required to access the admin page');
		
		$this->Assign("currentUser", $this->GetCurrentUser());
		
		$this->Assign('page','adminpage');
		$this->Render("SecureExample");
	}
	
	/**
	 * Display the login form
	 */
	public function LoginForm()
	{
		$this->Assign("currentUser", $this->GetCurrentUser());
		
		$this->Assign('page','login');
		$this->Render("SecureExample");
	}	
	
	/**
	 * Process the login, create the user session and then redirect to 
	 * the appropriate page
	 */
	public function Login()
	{
		$user = new Usuario($this->Phreezer);
		
		if ($user->Login(RequestUtil::Get('username'), RequestUtil::Get('password')))
		{
			// login success			
			$this->SetCurrentUser($user);
			$_SESSION['nomeUser'] = $this->GetCurrentUser()->Nome;
			
			//se existir uma pagina na url, senão manda para pagina padrao
			if($this->paginaLoginRedirect)
				$pagina = $this->paginaLoginRedirect;
			elseif($this->GetCurrentUser()->TipoUsuario != '')
				$pagina = 'Default.Home';
			
			//$pagina = ;
			
			$this->Redirect($pagina);
		}
		else
		{
			// login failed
			$this->Redirect('SecureExample.LoginForm','Combinação de usuário ou senha incorretos');
		}
	}
	
	/**
	 * Clear the user session and redirect to the login page
	 */
	public function Logout()
	{
		$this->ClearCurrentUser();
		unset($_SESSION['nomeUser']);
		$this->Redirect("SecureExample.LoginForm","You are now logged out");
	}

}
?>