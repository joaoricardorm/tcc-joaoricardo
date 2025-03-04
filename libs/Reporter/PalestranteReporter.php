<?php
/** @package    Tcc::Reporter */

/** import supporting libraries */
require_once("verysimple/Phreeze/Reporter.php");

/**
 * This is an example Reporter based on the Palestrante object.  The reporter object
 * allows you to run arbitrary queries that return data which may or may not fith within
 * the data access API.  This can include aggregate data or subsets of data.
 *
 * Note that Reporters are read-only and cannot be used for saving data.
 *
 * @package Tcc::Model::DAO
 * @author ClassBuilder
 * @version 1.0
 */
class PalestranteReporter extends Reporter
{

	// the properties in this class must match the columns returned by GetCustomQuery().
	// 'CustomFieldExample' is an example that is not part of the `palestrante` table

	public $IdPalestrante;
	public $Nome;
	public $Email;
	public $Cpf;
	public $Cargo;
	public $ImagemAssinatura;

	/*
	* GetCustomQuery returns a fully formed SQL statement.  The result columns
	* must match with the properties of this reporter object.
	*
	* @see Reporter::GetCustomQuery
	* @param Criteria $criteria
	* @return string SQL statement
	*/
	static function GetCustomQuery($criteria)
	{
		
		$sql = "select
			`palestrante`.`id_palestrante` as IdPalestrante
			,`palestrante`.`nome` as Nome
			,`palestrante`.`email` as Email
			,`palestrante`.`cpf` as Cpf
			,`palestrante`.`cargo` as Cargo
			,`palestrante`.`imagem_assinatura` as ImagemAssinatura
		from `palestrante` ";
		
		
		if($criteria->IdPalestra_Equals){
			$sql .= " inner join palestra_palestrante on `palestra_palestrante`.`id_palestrante` = `palestrante`.`id_palestrante` ";
		}
		
		// the criteria can be used or you can write your own custom logic.
		// be sure to escape any user input with $criteria->Escape()
		$sql .= $criteria->GetWhere();
		$sql .= $criteria->GetOrder();
		
		if($criteria->OrdemLouca){
			$sql .= ' order by '. $criteria->Escape($criteria->OrdemLouca); 
		}

		return $sql;
	}
	
	/*
	* GetCustomCountQuery returns a fully formed SQL statement that will count
	* the results.  This query must return the correct number of results that
	* GetCustomQuery would, given the same criteria
	*
	* @see Reporter::GetCustomCountQuery
	* @param Criteria $criteria
	* @return string SQL statement
	*/
	static function GetCustomCountQuery($criteria)
	{
		//$sql = "select count(1) as counter from `palestrante`";

		// the criteria can be used or you can write your own custom logic.
		// be sure to escape any user input with $criteria->Escape()
		//$sql .= $criteria->GetWhere();
		
		
		
		
		
		
		$sql = "select count(1) as counter from `palestrante`";
		
		
		if($criteria->IdPalestra_Equals){
			$sql .= " inner join palestra_palestrante on `palestra_palestrante`.`id_palestrante` = `palestrante`.`id_palestrante` ";
		}
		
		// the criteria can be used or you can write your own custom logic.
		// be sure to escape any user input with $criteria->Escape()
		$sql .= $criteria->GetWhere();
		$sql .= $criteria->GetOrder();
		
		if($criteria->OrdemLouca){
			$sql .= ' order by '. $criteria->Escape($criteria->OrdemLouca); 
		}
		
		
		
		

		return $sql;
	}
}

?>