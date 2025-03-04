/**
 * View logic for Palestras
 */

/**
 * application logic specific to the Palestra listing page
 */
 
var page = {
	
	palestras: new model.PalestraCollection(),
	collectionView: null,
	palestra: null,
	palestrante: null,
	modelView: null,
	isInitialized: false,
	isInitializing: false,
	
	fetchParams: { filter: '', orderBy: '', orderDesc: '', page: 1 },
	fetchInProgress: false,
	dialogIsOpen: false,
	
	proprioEvento: 0,
	
	detalhes: false,
	excluir: null,
	qtdPalestras: 0,
	
	/**
	 *
	 */
	init: function() {
		// ensure initialization only occurs once
		if (page.isInitialized || page.isInitializing) return;
		page.isInitializing = true;

		if (!$.isReady && console) console.warn('page was initialized before dom is ready.  views may not render properly.');			
				
		//Abre atividade atual se tive na url
		idAtividade = window.location.pathname.match(/evento\/([0-9]+)\/atividades\/([0-9]+)/);
		
		//Abre atividade atual se tive na url sem ser parametro e sim lá na url do _app_config.php
		excluirURL = /excluir/.test(window.location.pathname);

		if(excluirURL === true && page.excluir === null){
			page.excluir = true;
		}
		
		if(idAtividade !== null){
			var palestraURL = new model.PalestraCollection();
			palestraURL.fetch({
				data: {
					idPalestra: idAtividade[2]
				},
				success: function(ev) {								
					if(idAtividade){
						var m = palestraURL.get(idAtividade[2]);
						page.showDetailDialog(m);
					}				
				},
				error: function(m, response) {
					console.log('Erro ao obter a atividade pelo Id na URL');
					console.log(response);
				}
			});		
		}		
				
		// make the new button clickable
		$("#newPalestraButton").click(function(e) {
			e.preventDefault();
			page.showDetailDialog();
		});

		// let the page know when the dialog is open
		$('#palestraDetailDialog').on('show',function() {
			page.dialogIsOpen = true;
		});

		// when the model dialog is closed, let page know and reset the model view
		$('#palestraDetailDialog').on('hidden',function() {
			$('#modelAlert').html('');
			page.dialogIsOpen = false;
			
			page.detalhes = false;
			page.excluir = false;
			
			window.history.pushState('Object', 'Atividades', base+idEvento[0]+'/atividades/');
		});
		
		// save the model when the save button is clicked
		$("#savePalestraButton").click(function(e) {
			e.preventDefault();
			page.updateModel();
		});

		// initialize the collection view
		this.collectionView = new view.CollectionView({
			el: $("#palestraCollectionContainer"),
			templateEl: $("#palestraCollectionTemplate"),
			collection: page.palestras
		});

		// initialize the search filter
		$('#filter').change(function(obj) {
			page.fetchParams.filter = $('#filter').val();
			page.fetchParams.page = 1;
			page.fetchPalestras(page.fetchParams);
		});
		
		// make the rows clickable ('rendered' is a custom event, not a standard backbone event)
		this.collectionView.on('rendered',function(){
			
			// Adiciona o atributo data-title nas tr da tabela para responsividade
			$( "table.collection tbody td" ).each(function(index){
				total = $( "table.collection thead th").length;
				titulo = $( "table.collection thead th").eq(index % total).text();
				
				$(this).attr('data-title',titulo); 
			}); 

			// attach click handler to the table rows for editing
			$('table.collection tbody tr').click(function(e) {
				e.preventDefault();
				var m = page.palestras.get(this.id);
				page.showDetailDialog(m);
			});

			//Ordenar pelo cadastro
			$('.ordemCadastro').click(function(e) {
 				e.preventDefault();
				var prop = this.id.replace('ordemCadastro_','');

				// toggle the ascending/descending before we change the sort prop
				page.fetchParams.orderDesc = (prop == page.fetchParams.orderBy && !page.fetchParams.orderDesc) ? '1' : '';
				page.fetchParams.orderBy = prop;
				page.fetchParams.page = 1;
 				page.fetchPalestras(page.fetchParams);
 			});
			
			// make the headers clickable for sorting
 			$('table.collection thead tr th').click(function(e) {
 				e.preventDefault();
				var prop = this.id.replace('header_','');

				// toggle the ascending/descending before we change the sort prop
				page.fetchParams.orderDesc = (prop == page.fetchParams.orderBy && !page.fetchParams.orderDesc) ? '1' : '';
				page.fetchParams.orderBy = prop;
				page.fetchParams.page = 1;
 				page.fetchPalestras(page.fetchParams);
 			});

			// attach click handlers to the pagination controls
			$('.pageButton').click(function(e) {
				e.preventDefault();
				page.fetchParams.page = this.id.substr(5);
				page.fetchPalestras(page.fetchParams);
			});
			
			page.isInitialized = true;
			page.isInitializing = false;
		});

		// backbone docs recommend bootstrapping data on initial page load, but we live by our own rules!
		this.fetchPalestras({ page: 1, orderBy: 'IdPalestra', orderDesc: 'up' });

		// initialize the model view
		this.modelView = new view.ModelView({
			el: $("#palestraModelContainer")
		});

		// tell the model view where it's template is located
		this.modelView.templateEl = $("#palestraModelTemplate");

		if (model.longPollDuration > 0)	{
			setInterval(function () {

				if (!page.dialogIsOpen)	{
					page.fetchPalestras(page.fetchParams,true);
				}

			}, model.longPollDuration);
		}
	},

	/**
	 * Fetch the collection data from the server
	 * @param object params passed through to collection.fetch
	 * @param bool true to hide the loading animation
	 */
	fetchPalestras: function(params, hideLoader) {
		// persist the params so that paging/sorting/filtering will play together nicely
		page.fetchParams = params;
		
		if(page.excluir === true){
			$('#alertaConfirmarExclusao').removeClass('hide');
		} else {
			$('#alertaConfirmarExclusao').addClass('hide');
		}
		
		//Filtra palestras pelo evento
		idEvento = window.location.pathname.match(/evento\/([0-9]+)/);
		if(idEvento){
			page.fetchParams.evento = idEvento[1];
		}
		
		if (page.fetchInProgress) {
			if (console) console.log('supressing fetch because it is already in progress');
		}

		page.fetchInProgress = true;

		if (!hideLoader) app.showProgress('loader');

		page.palestras.fetch({

			data: params,

			success: function(p) {
				
				
				//RETORNA A LISTA DE PALESTRANTES CADASTRADOS EM CADA PALESTRA	
						
				var palestranteCollection = new model.PalestraPalestranteCollection();	
				
				page.palestras.forEach(function(item,indexPalestrante){
					
					palestranteCollection.fetch({
						data : {
							'idPalestra': item.get('idPalestra'),
							orderBy: 'NomePalestrante'
						},
						success: function(c, response) {
		
							//preenche o campo correspondente na view com os nomes dos palestrantes
							if(response.totalResults > 0){
								
								//JUNTAR NOMES COM , E "e" no final
								var index;
								var nomes = '';
								var a = c.pluck('nomePalestrante');
								for (index = 0; index < a.length; ++index) {
									if(index === a.length-2)
										nomes += a[index] + ' e ';
									else if(index < a.length-1)
										nomes += a[index] + ', ';
									else
										nomes += a[index];
								}
	
								$('#'+item.get('idPalestra')+' .lista-palestrantes').text(nomes);
							}
						
						},
						error: function(model, response) {
							console.log('Erro ao buscar palestrantre para marcar no checkbox');
							console.log(response);
						}
					});	
					
				});
					
				
				if (page.palestras.collectionHasChanged) {
					// TODO: add any logic necessary if the collection has changed
					// the sync event will trigger the view to re-render				
						
					page.qtdPalestras = page.palestras.length;
					
					//pega o atributo proprioEvento da atividade (se for proprio evento um elemento)
					if(page.palestras.length > 0 && idEvento){
						page.proprioEvento = page.palestras.models[0].attributes.proprioEvento;
						idProprioEvento = page.palestras.models[0].id;
						
						//INSERE LINK DO PALESTRANTES E PARTICIPANTES NO BREADCRUMB QUANDO HAVER APENAS UMA PALESTRA OU SEJA O PROPRIO EVENTO
						$('#link-palestrantes-breadcrumb').attr('href','atividade/'+idProprioEvento+'/atividade/palestrantes/').parent().removeClass('hidden');
						$('#link-participantes-breadcrumb').attr('href','atividade/'+idProprioEvento+'/atividade/participantes/').parent().removeClass('hidden');
												
						//ser for proprio evento faz a magica de apagar elementos e ja mostrar tela de edicao
						
						$('.show-on-single').hide();
						if(page.proprioEvento == 1){
							$('.new-and-search-container, .remove-on-single').remove();
							$('.show-on-single').show();
							
							if(page.isInitializing){
								var m = page.palestras.get(idProprioEvento);
								page.showDetailDialog(m);
							}
						}
					}
				}

				app.hideProgress('loader');
				page.fetchInProgress = false;
			},

			error: function(m, r) {
				app.appendAlert(app.getErrorMessage(r), 'alert-error',0,'collectionAlert');
				app.hideProgress('loader');
				page.fetchInProgress = false;
			}

		});
	},

	/**
	 * show the dialog for editing a model
	 * @param model
	 */
	showDetailDialog: function(m) {
		// show the modal dialog
		$('#palestraDetailDialog').modal({ backdrop: 'static', show: true });

		// if a model was specified then that means a user is editing an existing record
		// if not, then the user is creating a new record
		page.palestra = m ? m : new model.PalestraModel();

		page.modelView.model = page.palestra;		
		
		if(page.excluir === false){
			$('#alertaConfirmarExclusao').addClass('hide');
		}
		
		if (page.palestra.id == null || page.palestra.id == '') {
			
			$('.titulo-modal').html('Cadastrar Atividade');
			$('.icone-acao-modal').addClass('icon-plus-sign');
			
			// this is a new record, there is no need to contact the server
			page.renderModelView(false);
		} else {

			$('.titulo-modal').html('Editar Atividade');
			$('.icone-acao-modal').removeClass('icon-plus-sign');
			app.showProgress('modelLoader');

			// fetch the model from the server so we are not updating stale data
			page.palestra.fetch({

				success: function(palestra) {
					// data returned from the server.  render the model view
					page.renderModelView(true);
					
					
					// adiciona a url do evento atual
					window.history.pushState('Object', 'Atividade '+palestra.get('nome'), base+'evento/'+palestra.get('idEvento')+'/atividades/'+palestra.get('idPalestra')+'/'+app.parseURL(palestra.get('nome'))+'/');
					
					
					$('.show-on-single').hide();		
					if(page.proprioEvento == 1){
						$('.remove-on-single').remove();
						$('.show-on-single').show();
					}
					
					$("#palestraDetailDialog a").not('.close, #cancelSavePalestraButton, #savePalestraButton').click(function(link) {
						link.preventDefault();
						page.updateModel($(this).attr('href'));
					});
		
					
					//Se existir pedido de exclusao
					if(page.excluir === true){
						$('#modalConfirmarExclusao').modal({
							
							width: '400px',
							backdropTemplate: '<div class="modal-backdrop red" />'
							
						});
						$('#modalConfirmarExclusao .modal-body p').html('<p>Tem certeza que deseja excluir a atividade</p><h4>'+page.palestra.get('nome')+'</h4>');
				
						$('#btnConfirmarExclusao').click(function(e){
							$(this).text('Excluindo...');
							
							page.deleteModel();
						});
					}
					
					
				},

				error: function(m, r) {
					app.appendAlert(app.getErrorMessage(r), 'alert-error',0,'modelAlert');
					app.hideProgress('modelLoader');
				}

			});
		}
	},

	/**
	 * Render the model template in the popup
	 * @param bool show the delete button
	 */
	renderModelView: function(showDeleteButton)	{
		page.modelView.render();
		if(!isMobile){ 	
			setTimeout(function(){
				$('.modal .modal-body input[type=text]').first().click().focus();
			}, 500); 
		}

		app.hideProgress('modelLoader');

		// initialize any special controls
		try {
			$('.date-picker')
				.datepicker({ language: 'pt-BR' })
				.on('changeDate', function(ev){
					$('.date-picker').datepicker('hide');
				});
		} catch (error) {
			// this happens if the datepicker input.value isn't a valid date
			if (console) console.log('datepicker error: '+error.message);
		}
		
		$('.timepicker-default').timepicker({ defaultTime: 'value' });

		// populate the dropdown options for idEvento
		// TODO: load only the selected value, then fetch all options when the drop-down is clicked
		// var idEventoValues = new model.EventoCollection();
		// idEventoValues.fetch({
			// success: function(c){
				// var dd = $('#idEvento');
				// dd.append('<option value=""></option>');
				// c.forEach(function(item,index) {
					// dd.append(app.getOptionHtml(
						// item.get('idEvento'),
						// item.get('nome'), // TODO: change fieldname if the dropdown doesn't show the desired column
						// page.palestra.get('idEvento') == item.get('idEvento')
					// ));
				// });
				
				// if (!app.browserSucks()) {
					// dd.combobox();
					// $('div.combobox-container + span.help-inline').hide(); // TODO: hack because combobox is making the inline help div have a height
				// }
			// },
			// error: function(collection,response,scope) {
				// app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');
			// }
		// });

		// populate the dropdown options for idModeloCertificado
		// TODO: load only the selected value, then fetch all options when the drop-down is clicked
		var idModeloCertificadoValues = new model.ModeloCertificadoCollection();
		idModeloCertificadoValues.fetch({
			success: function(c){
				var dd = $('#idModeloCertificado');
				dd.append('<option value=""></option>');
				c.forEach(function(item,index) {
					
					
					//HACK PARA SELECIONAR O PRIMEIRO ITEM DA LISTA CASO SEJA UM NOVO CADASTRO
					if(page.palestra.get('idModeloCertificado')){
						sel = page.palestra.get('idModeloCertificado') == item.get('idModeloCertificado');
					} else {
						sel = index == 0;
					}					
					
					dd.append(app.getOptionHtml(
						item.get('idModeloCertificado'),
						item.get('nome'), // TODO: change fieldname if the dropdown doesn't show the desired column
						sel // HACK TAMBEM
					));
				});
				
				if (!app.browserSucks()) {
					dd.combobox('refresh');
					$('div.combobox-container + span.help-inline').hide(); // TODO: hack because combobox is making the inline help div have a height
				}
				
				
				
				
				
				//JÁ INSERE A PALESTRA TEMPORÁRIA PARA QUE A SELEÇÃO DO PALESTRANTE FUNCIONE
				if(page.palestra.isNew()){
					page.palestra.save({
						'nome': '.',
						'data': '',
						'cargaHoraria': '00:00',
						'proprioEvento': $('input#proprioEvento').val(),
						'idEvento': $('#idEvento').val(),
						'idModeloCertificado': $('select#idModeloCertificado').val()
					}, {
						wait: true,
						success: function(){
							console.log('Inseriu a palestra temporária');
							
							page.detalhes = true;
							
							// if the collection was initally new then we need to add it to the collection now
							if (page.palestra.isNew()) { page.palestras.add(page.palestra) }
							
							//REMOVE A PALESTRA TEMPORÁRIA AO CLICAR EM CANCELAR OU FECHAR
							$('#palestraDetailDialog').on('hidden',function(e) {
								e.preventDefault();
								
								//se o nome for .
								if(page.palestra.get('nome') == '.'){
									page.deleteModel();
									console.log('Removeu a palestra temporária');
									
									if (model.reloadCollectionOnModelUpdate) {
										// re-fetch and render the collection after the model has been updated
										page.fetchPalestras(page.fetchParams,true);	
									}	
								}
							});
							
						},
						error: function(model,response,scope){
							console.log('Erro ao inserir palestra temporária');
							console.log(response);
						}
					});
				}
		
				
				
				
				
				
				
				
			},
			error: function(collection,response,scope) {
				app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');
			}
		});
		
		
		
		
		
		
		
		// POPULA O DROPDOWN COM O SELECT DE PALESTRANTES, além de gerenciar a inseração ou exclusão deles no banco
		
		$('#palestrantes').append('<option value="">Carregando palestrantes...</option>');
		
		var PalestranteValues = new model.PalestranteCollection();	
		PalestranteValues.fetch({
			data : {
				orderBy: 'Nome'
			},
			success: function(p){
				var dd = $('#palestrantes');
				dd.empty();
				//dd.append('<option value=""></option>');
					
				console.log(p);
				
				//SELECIONA PALESTRANTE QUE JÁ ESTÃO CADASTRADOS NA PALESTRA	
					
				var palestranteCollection = new model.PalestraPalestranteCollection();	
				
				p.forEach(function(item,indexPalestrante){

					palestranteCollection.fetch({
						data : {
							'idPalestra': page.palestra.get('idPalestra'),
							'idPalestrante': item.get('idPalestrante'),
							orderBy: 'NomePalestrante'
						},
						success: function(c, response) {
							
							//Se for palestra nova ele nao seleciona
							if((!page.palestra.isNew() || page.detalhes === true) && page.palestras.length > 0 && page.palestra.get('nome') !== '.'){
								
								c.every(function(pal,index) {
								
									$('.multiselect-loading').show();
										
									dd.multiselect('select', pal.get('idPalestrante'));

									
									//DESABILITA A EXCLUSÃO DO PALESTRANTE NA PALESTRA SE ELE JÁ POSSUIR CERTIFICADO PARA ELE (>0)
									if(pal.get('idPalestrante') === item.get('idPalestrante')){
										
										if(parseInt(pal.get('idCertificado')) > 0){
											  var input = $('input[value="' + pal.get('idPalestrante') + '"]');
											  input.prop('disabled', true);
											  input.parent().parent().addClass('disabled');
											    
											  input.parent('label').parent('a').parent('li').attr('title','Não é possível retirar esse palestrante, pois ele já recebeu um certificado por esta atividade');
										}
									}
			
								});

								//REMOVE ICONE DE CARREGANDO
								if(indexPalestrante == (p.length-1))
									$('.multiselect-loading').remove();
						
							} else {
								//remove se for nova
								$('.multiselect-loading').remove();
							}
							
						},
						error: function(model, response) {
							console.log('Erro ao buscar palestrantre para marcar no checkbox');
							console.log(response);
						}
					});	
					
					dd.append(app.getOptionHtml(
						item.get('idPalestrante'),
						item.get('nome') // TODO: change fieldname if the dropdown doesn't show the desired column
					));
				});
				
				//LARGURA DO MULTISELECT NO MOBILE
				larguraBtnMultiselect = 'auto';
				if($(window).width() <= 468){
					larguraBtnMultiselect = $(window).width()-40;
				}
				
				if (!app.browserSucks()) {
						//Gera o multiselect com as opções e suas ações quando checkadas ou não
						dd.multiselect({
							buttonClass: 'btn btn-primary margin-right-bigger-sm block-sm',
							enableFiltering: true,
							enableCaseInsensitiveFiltering: true,
							includeSelectAllOption: false,
							buttonWidth: larguraBtnMultiselect,
							disableIfEmpty: true,
							maxHeight: 200,
							numberDisplayed: 5,
							// Re-validate the multiselect field when it is changed
							onChange: function(element, checked) {
							
								page.palestrante = new model.PalestraPalestranteModel();	


								var dados = { 
											'idPalestrante': element.val(),
											'idPalestra': page.palestra.get('idPalestra')
											};									
								
								if(checked === true) {
										//SALVA O PALESTRANTE AO MARCa-LO NA LISTA
										page.palestrante.save(dados, {
											wait: true,
											success: function(palestrante){					
												console.log('O palestrante foi associado a essa palestra')				
											},
											error: function(model,response,scope){
												console.log('Erro ao salvar o palestrante na palestra.')
												console.log(response);
											}
										});
									
								}
								else if(checked === false) {

									if(confirm('Tem certeza que deseja retirar o palestrantre '+element.text()+' da atividade?')) {	
																
										//REMOVE O PALESTRANTE QUANDO DESMARCA NA LISTA (CUSTOM REPORTER, para selecionar os palestrantes pela palestra [ver em PalestraPalestranteReporter.php])	
										var palestranteCollection = new model.PalestraPalestranteCollection();												
										
										palestranteCollection.fetch({
											data: {
												idPalestra: dados.idPalestra,
												orderBy: 'NomePalestrante'
											},
											success: function(c, response) {
								
												c.forEach(function(item,index) {
													
													if(item.get('idPalestrante') == dados.idPalestrante){
														page.palestrante.id = item.id;																
														page.palestrante.destroy();		
														console.log('O palestrante '+item.get('idPalestrante')+'foi removido da palestra');
														console.log(page.palestrante);
													}															
													
												});
											},
											error: function(model, response) {
												console.log('Erro ao remover palestrante da palestra');
												console.log(response);
											},
											reset: true
										});
															
										
									}
									else {
										dd.multiselect('select', element.val());
									}
								}
								
							}
						});
						
					$('div.combobox-container + span.help-inline').hide(); // TODO: hack because combobox is making the inline help div have a height
				}
				

			},
			error: function(collection,response,scope) {
				app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');
			}
	});	
		
		
		
		
	
		
		
		
		
		

		//ser for proprio evento faz a magica de apagar elementos e ja mostrar tela de edicao
		if(page.proprioEvento == 1){
			$('.hide-on-single').hide();
			
			$('.titulo-modal, .titulo').html('Detalhes do evento ' + page.palestras.models[0].attributes.nomeEvento );
			$('.icone-acao-modal, .icone-acao').addClass('icon-plus-sign');
		}


		if (showDeleteButton) {
			// attach click handlers to the delete buttons

			$('#deletePalestraButton').click(function(e) {
				e.preventDefault();
				$('#confirmDeletePalestraContainer').show('fast').removeClass('hide');
			});
			
			$('#cancelDeletePalestraButton').click(function(e) {
				e.preventDefault();				
				$('#confirmDeletePalestraContainer').hide();
			});

			$('#confirmDeletePalestraButton').click(function(e) {
				e.preventDefault();
				page.deleteModel();
			});

		} else {
			// no point in initializing the click handlers if we don't show the button
			$('#deletePalestraButtonContainer').hide();
		}
	},

	/**
	 * update the model that is currently displayed in the dialog
	 */
	updateModel: function(linkClicado) {
		
		linkClicado = typeof linkClicado !== 'undefined' ? linkClicado : false;
		
		// reset any previous errors
		$('#modelAlert').html('');
		$('.control-group').removeClass('error');
		$('.help-inline').html('');

		// if this is new then on success we need to add it to the collection
		var isNew = page.palestra.isNew();
		
		//hack para nao cadastrar com cargar horaria igual a 00:00
		var cargaHorariaVal = $('input#cargaHoraria').val();
		if ($('input#cargaHoraria').val() == '00:00' || $('input#cargaHoraria').val() == '') {
			cargaHorariaVal = '10:11:12';
		}

		app.showProgress('modelLoader');
		
		console.log('LLOOOOOO',page.palestra.get('nomeEvento'));
		
		var nomePalestra = page.palestra.get('nomeEvento');
		if(parseInt(page.proprioEvento) === 0)//se não for proprio Evento
			nomePalestra = $('input#nome').val();
		
		page.palestra.save({
			'nome': nomePalestra,
			'data': $('input#data').val(),
			'cargaHoraria': cargaHorariaVal,
			'proprioEvento': $('input#proprioEvento').val(),
			'idEvento': $('#idEvento').val(),
			'idModeloCertificado': $('select#idModeloCertificado').val()
		}, {
			wait: true,
			success: function(){
				if(linkClicado === false)
					$('#palestraDetailDialog').modal('hide');
				else {
					document.location.href = linkClicado;
				}
				setTimeout("app.appendAlert('Palestra foi " + (isNew ? "inserida" : "editada") + " com sucesso','alert-success',3000,'collectionAlert')",500);
				app.hideProgress('modelLoader');
				
				page.excluir = false;	
				
				// if the collection was initally new then we need to add it to the collection now
				if (isNew) { page.palestras.add(page.palestra) }

				if (model.reloadCollectionOnModelUpdate) {
					// re-fetch and render the collection after the model has been updated
					page.fetchPalestras(page.fetchParams,true);	
				}		
			
				$('table.collection tr#'+page.palestra.id).addClass('modificou-item');	
		},
			error: function(model,response,scope){

				app.hideProgress('modelLoader');

				app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');

				try {
					var json = $.parseJSON(response.responseText);

					if (json.errors) {
						$.each(json.errors, function(key, value) {
							$('#'+key+'InputContainer').addClass('error');
							$('#'+key+'InputContainer span.help-inline').html(value);
							$('#'+key+'InputContainer span.help-inline').show();
						});
					}
				} catch (e2) {
					if (console) console.log('error parsing server response: '+e2.message);
				}
			}
		});
	},

	/**
	 * delete the model that is currently displayed in the dialog
	 */
	deleteModel: function()	{
		// reset any previous errors
		$('#modelAlert').html('');

		app.showProgress('modelLoader');
		
		
			//EXCLUI A RELAÇÃO COM PALESTRANTES ASSOCIADOS ANTES DE APAGAR A PALESTRA
						
			var palestranteCollection = new model.PalestraPalestranteCollection();	
				
			palestranteCollection.fetch({
				data : {
					'idPalestra': page.palestra.get('idPalestra')
				},
				success: function(c, response) {
					
					//VALIDA SE HÁ CERTIFICADO EMITIDO PARA O PALESTRANTE, SE HOUVER O SISTEMA NÃO DEIXA EXCLUIR
					var temCertificado = false;
					c.some(function(pal){
						if(parseInt(pal.get('idCertificado')) > 0){
							temCertificado = true;
							return false;
						}
					});									
								
					
					//REMOVE AS RELAÇÕES COM O PALESTRANTE, caso possua palestrantes, E DEPOIS REMOVE A PALESTRA, caso não possua certificado, senão joga um erro
	
					if(c.length > 0){
						var qtd = 1;
						c.forEach(function(pal){
							
							if(temCertificado === false){
							
								page.palestrante = new model.PalestraPalestranteModel();
								page.palestrante.id = pal.id;
								
								page.palestrante.destroy();
						
							}
							
							if(qtd === c.length){
								removerPalestra();
							}
							qtd++;
							
						});
					} else {
						removerPalestra();
					}
					
					//REMOVE A PALESTRA
					function removerPalestra(){
						
						page.palestra.destroy({
							wait: true,
							success: function(p){
								$('#palestraDetailDialog').modal('hide');
								setTimeout("app.appendAlert('A atividade foi excluida','alert-success',3000,'collectionAlert')",500);
								app.hideProgress('modelLoader');
								
								if(parseInt(page.proprioEvento) === 1){
									page.excluir = false;	
									
									$('#btnConfirmarExclusao').text('Redirecionando...');
									
									//window.event.returnValue = false;
									document.location.href = base+'evento/'+idEvento[1]+'/evento/excluir/';										
								} 
								
								if (model.reloadCollectionOnModelUpdate) {
									// re-fetch and render the collection after the model has been updated
									page.fetchPalestras(page.fetchParams,true);
								}	
								
							},
							error: function(model,response,scope) {
								app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');
								app.hideProgress('modelLoader');
								
								$('.modal').addClass('animated shake').delay(1000).queue(function(){
									$(this).removeClass("animated shake").dequeue();
								});
					
							},
							complete: function(model,response,scope){
								
								//Remove Dialogo caso tenha redicionado para exclusão
								if(page.excluir == true){
									$('#modalConfirmarExclusao .modal-body p').text('Excluida com sucesso! Aguarde...');
									
									$('#btnConfirmarExclusao').text('Sim');
									$('#modalConfirmarExclusao').modal('hide');
								}
								
							}
						});
					
					}
				
				},
				error: function(model, response) {
					console.log('Erro ao remover a relação do palestrante ao excluir a palestra');
					console.log(response);
					page.excluir = false;
				}
			});	
						
	}
};

