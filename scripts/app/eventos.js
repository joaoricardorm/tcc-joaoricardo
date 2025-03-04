/**
 * View logic for Eventos
 */

/**
 * application logic specific to the Evento listing page
 */
var page = {

	eventos: new model.EventoCollection(),
	palestras: new model.PalestraCollection(),
	collectionView: null,
	evento: null,
	palestra: null,
	modelView: null,
	isInitialized: false,
	isInitializing: false,

	fetchParams: { filter: '', orderBy: '', orderDesc: '', page: 1 },
	fetchInProgress: false,
	dialogIsOpen: false,
	
	proprioEvento: 0,
	idDetalhesEvento: null,
	
	temCertificado: false,
	excluir: null,

	/**
	 *
	 */
	init: function() {
		// ensure initialization only occurs once
		if (page.isInitialized || page.isInitializing) return;
		page.isInitializing = true;

		if (!$.isReady && console) console.warn('page was initialized before dom is ready.  views may not render properly.');
		
		//Abre evento atual se tive na url
		idEvento = window.location.pathname.match(/evento\/([0-9]+)/);
		
		
		//Abre atividade atual se tive na url sem ser parametro e sim lá na url do _app_config.php
		excluirURL = /excluir/.test(window.location.pathname);

		if(excluirURL === true && page.excluir === null){
			page.excluir = true;
		}
		
		
		if(idEvento !== null){
			var eventoURL = new model.EventoCollection();
			eventoURL.fetch({
				data: {
					idEvento: idEvento[1]
				},
				success: function(ev) {								
					if(idEvento){
						var m = eventoURL.get(idEvento[1]);
						console.log(idEvento[1]);
						
						page.showDetailDialog(m);
					}
				},
				error: function(m, response) {
					console.log('Erro ao obter o evento pelo Id na URL');
					console.log(response);
				}
			});
		}
		
		
		
		
/*		
		
		
		// create pub-sub functionality
Backbone.pubSub = _.extend({}, Backbone.Events);

// view one needs to trigger an event in view2
View1 = Backbone.View.extend({ 

   triggerView2Event : function() { 
       Backbone.pubSub.trigger('view2event', { 'some' : 'data' } );
   })

});

// view two which changes based on the view2event

View2 = Backbone.View.extend({ 
  initialize: function() {
	Backbone.pubSub.on('view2event', this.onChange, this);
  },
  onChange : function() { 
     // update the view
  }
});

*/

		
		
		
		
		
		
		// make the new button clickable
		$("#newEventoButton").click(function(e) {
			e.preventDefault();
			page.showDetailDialog();
		});

		// let the page know when the dialog is open
		$('#eventoDetailDialog').on('show',function() {
			page.dialogIsOpen = true;
		});

		// when the model dialog is closed, let page know and reset the model view
		$('#eventoDetailDialog').on('hidden',function() {
			$('#modelAlert').html('');
			page.dialogIsOpen = false;
			
			page.excluir = false;
			
			window.history.pushState('Object', 'Eventos', base+'eventos/');
		});
		
		// save the model when the save button is clicked
		$("#saveEventoButton").bind('click', function(e) {			
			e.preventDefault();	
			
			$('#saveEventoButton span').html('Salvando...');
			$('#cancelSaveEventoButton').removeData('dismiss');
			
			page.updateModel();
		});

		// initialize the collection view
		this.collectionView = new view.CollectionView({
			el: $("#eventoCollectionContainer"),
			templateEl: $("#eventoCollectionTemplate"),
			collection: page.eventos
		});

		// initialize the search filter
		$('#filter').change(function(obj) {
			page.fetchParams.filter = $('#filter').val();
			page.fetchParams.page = 1;
			page.fetchEventos(page.fetchParams);
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
				var m = page.eventos.get(this.id);
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
 				page.fetchEventos(page.fetchParams);
 			});
			
			// make the headers clickable for sorting
 			$('table.collection thead tr th').click(function(e) {
 				e.preventDefault();
				var prop = this.id.replace('header_','');

				// toggle the ascending/descending before we change the sort prop
				page.fetchParams.orderDesc = (prop == page.fetchParams.orderBy && !page.fetchParams.orderDesc) ? '1' : '';
				page.fetchParams.orderBy = prop;
				page.fetchParams.page = 1;
 				page.fetchEventos(page.fetchParams);
 			});

			// attach click handlers to the pagination controls
			$('.pageButton').click(function(e) {
				e.preventDefault();
				page.fetchParams.page = this.id.substr(5);
				page.fetchEventos(page.fetchParams);
			});
			
			page.isInitialized = true;
			page.isInitializing = false;
		});

		// backbone docs recommend bootstrapping data on initial page load, but we live by our own rules!
		this.fetchEventos({ page: 1, orderBy: 'IdEvento', orderDesc: 'up' });

		// initialize the model view
		this.modelView = new view.ModelView({
			el: $("#eventoModelContainer")
		});

		// tell the model view where it's template is located
		this.modelView.templateEl = $("#eventoModelTemplate");

		if (model.longPollDuration > 0)	{
			setInterval(function () {

				if (!page.dialogIsOpen)	{
					page.fetchEventos(page.fetchParams,true);
				}

			}, model.longPollDuration);
		}
	},

	/**
	 * Fetch the collection data from the server
	 * @param object params passed through to collection.fetch
	 * @param bool true to hide the loading animation
	 */
	fetchEventos: function(params, hideLoader) {
		// persist the params so that paging/sorting/filtering will play together nicely
		page.fetchParams = params;

		if (page.fetchInProgress) {
			if (console) console.log('supressing fetch because it is already in progress');
		}

		page.fetchInProgress = true;

		if (!hideLoader) app.showProgress('loader');

		page.eventos.fetch({

			data: params,

			success: function() {

				if (page.eventos.collectionHasChanged) {
					// TODO: add any logic necessary if the collection has changed
					// the sync event will trigger the view to re-render					
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
		//restaura funcao do botao salvar e cancelar
		$('#saveEventoButton').confirmation('hide').confirmation('destroy');
		$('#saveEventoButton, #cancelSaveEventoButton').removeClass('disabled');
	
		// show the modal dialog
		$('#eventoDetailDialog').modal({ backdrop: 'static', show: true });

		// if a model was specified then that means a user is editing an existing record
		// if not, then the user is creating a new record
		page.evento = m ? m : new model.EventoModel();

		page.modelView.model = page.evento;

		if (page.evento.id == null || page.evento.id == '') {
			
			$('#titulo-modal').html('Cadastrar');
			$('#icone-acao-modal').addClass('icon-plus-sign');
			
			// this is a new record, there is no need to contact the server
			page.renderModelView(false);
		} else {
$('#titulo-modal').html('Editar');
$('#icone-acao-modal').removeClass('icon-plus-sign');
			app.showProgress('modelLoader');

			// fetch the model from the server so we are not updating stale data
			page.evento.fetch({

				success: function(evento) {
					// data returned from the server.  render the model view
					page.renderModelView(true);
					
					// adiciona a url do evento atual
					window.history.pushState('Object', 'Evento '+evento.get('nome'), base+'evento/'+evento.id+'/'+app.parseURL(evento.get('nome'))+'/');
					
					
					$("#eventoDetailDialog a").not('.close, #deleteEventoButton, #cancelDeleteEventoButton, #confirmDeleteEventoButton, #cancelSaveEventoButton, #saveEventoButton').click(function(link) {
						link.preventDefault();
						
						if($(this).attr('id') === 'saveEventoButton')
							$(this).attr('href','SALVAR-MODEL');
						
						page.updateModel($(this).attr('href'));
					});
					
					
					//Se existir pedido de exclusao
					if(page.excluir === true){
						app.appendAlert('Excluindo evento...', 'alert-error',0,'modelAlert');
						app.showProgress('modelLoader');	
						
						$('#eventoModelContainer').prepend('<div class="overlay-big-message">EXCLUINDO EVENTO</div>');
						
						page.deleteModel();
					}
					
					
					// busca palestra do evento para ver se e ele proprio ou nao
					page.palestras.fetch({
						data: {
							evento: evento.id
						},

						success: function(palestras) {	
							if(palestras.length > 0){
								page.proprioEvento = palestras.first().attributes.proprioEvento;
								page.idDetalhesEvento = palestras.first().attributes.idPalestra;
							} else {
								page.proprioEvento = 0;
							}
								
								//se for proprio evento faz a magica
								$('.show-on-single').hide();
								if(page.proprioEvento == 1){
									$('.remove-on-single').remove();
									$('.show-on-single').show();
								}
								
								//INSERE LINK DO PALESTRANTES E PARTICIPANTES NO BREADCRUMB QUANDO HAVER APENAS UMA PALESTRA OU SEJA O PROPRIO EVENTO
								$('#link-palestrantes-breadcrumb, #palestrantesButton').attr('href','atividade/'+page.idDetalhesEvento+'/atividade/palestrantes/').parent().removeClass('hidden');
								$('#link-participantes-breadcrumb, #participantesButton').attr('href','atividade/'+page.idDetalhesEvento+'/atividade/participantes/').parent().removeClass('hidden');
									
								
								console.log(page.idDetalhesEvento);
								
							
							
						},

						error: function(m, r) {
							console.log('Erro ao obter palestras');
						}
					});
					

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
				.datepicker({  format: 'dd/mm/yyyy', language: 'pt-BR' })
				.on('changeDate', function(ev){
					$('.date-picker').datepicker('hide');
				});
		} catch (error) {
			// this happens if the datepicker input.value isn't a valid date
			if (console) console.log('datepicker error: '+error.message);
		}
		
		$('.timepicker-default').timepicker({ format: 'dd/mm/yyyy', defaultTime: 'value' });


		if (showDeleteButton) {
			// attach click handlers to the delete buttons

			$('#deleteEventoButton').click(function(e) {
				e.preventDefault();
				$('#confirmDeleteEventoContainer').show('fast').removeClass('hide');
			});

			$('#cancelDeleteEventoButton').click(function(e) {
				e.preventDefault();
				$('#confirmDeleteEventoContainer').hide();
			});

			$('#confirmDeleteEventoButton').click(function(e) {
				e.preventDefault();
				page.deleteModel();
			});

		} else {
			// no point in initializing the click handlers if we don't show the button
			$('#deleteEventoButtonContainer').hide();
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
		var isNew = page.evento.isNew();

		app.showProgress('modelLoader');

		page.evento.save({

			'nome': $('input#nome').val(),
			'local': $('input#local').val(),
			'data': $('input#data').val(),
			'duracao': $('input#duracao').val()
		}, {
			wait: true,
			success: function(){
				
				if(!isNew){
					if(linkClicado === false)
						$('#eventoDetailDialog').modal('hide');
					else {
						document.location.href = linkClicado;
					}
				}
				
				//$('#eventoDetailDialog').modal('hide');
				setTimeout("app.appendAlert('Evento foi " + (isNew ? "inserido" : "editado") + " com sucesso','alert-success',3000,'collectionAlert')",500);
				app.hideProgress('modelLoader');

				// if the collection was initally new then we need to add it to the collection now
				if (isNew) { 
				
					page.eventos.add(page.evento);
					
					console.log('Eh novo?',isNew);

					//Apresenta opção se é apenas uma palestra ou possui outras dentro do evento
					$('#saveEventoButton').confirmation({
						placement: 'top', // How to position the confirmation - top | bottom | left | right
						trigger: 'manual', // How confirmation is triggered - click | hover | focus | manual
						target : '_self', // Default target value if `data-target` attribute isn't present.
						href   : 'evento/'+page.evento.id+'/atividades/', // Default href value if `data-href` attribute isn't present.
						title: 'Esse evento possui outras atividades (palestras)? Não é possível alterar essa configuração depois', // Default title value if `data-title` attribute isn't present
						btnOkLabel: 'Sim', // Default btnOkLabel value if `data-btnOkLabel` attribute isn't present.
						btnCancelLabel: 'Não', // Default btnCancelLabel value if `data-btnCancelLabel` attribute isn't present.
						btnCancelClass:  'btn-primary',
						singleton: false, // Set true to allow only one confirmation to show at a time.
						popout: false, // Set true to hide the confirmation when user clicks outside of it.
						//onConfirm: function(){ alert('sim!'); }, // Set event when click at confirm button
						onCancel: function(){
							
								//SALVA PALESTRA COM NOME DO EVENTO E JÁ MANDA PARA EDIÇÃO DELA
							
								page.palestra = new model.PalestraModel();
		
								//o modelo de certificado com id 1 não deve ser excluido do banco de dados!
								page.palestra.save({
									'nome': $('input#nome').val(),
									'data':  $('input#data').val(),
									'cargaHoraria': '00:00:00',
									'proprioEvento': 1,
									'idEvento': page.evento.id,
									'idModeloCertificado': 1
								}, {
									wait: true,
									success: function(palestra){							
										$('#saveEventoButton span').html('Redirecionando...');
										window.event.returnValue = false;
										document.location.href = './evento/'+page.evento.id+'/atividades/';
								},
									error: function(model,response,scope){
										console.log('Erro ao salvar palestra.');
								}
							});
							
							
						}	
					}); // Set event when click at cancel button
					
					$('#saveEventoButton').confirmation('show');
					
					$('#saveEventoButton, #cancelSaveEventoButton').unbind('click').addClass('disabled');
					
				} else {
					//Se não for novo evento ele esconde para somente atualizar
					$('#eventoDetailDialog').modal('hide');
				}

				if (model.reloadCollectionOnModelUpdate) {
					// re-fetch and render the collection after the model has been updated
					
					$('#saveEventoButton span').html('Salvar e continuar');
					
					page.fetchEventos(page.fetchParams,true);
				}
				
				$('table.collection tr#'+page.evento.id).addClass('modificou-item');	
		},
			error: function(model,response,scope){

				app.hideProgress('modelLoader');

				app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');
				
				$('#saveEventoButton span').html('Salvar e continuar');

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
					
			var palestras = new model.PalestraCollection();	
				
			palestras.fetch({
				data : {
					'idEvento': page.evento.get('idEvento')
				},
				success: function(palestras) {
					
					if(palestras.length > 0){
						app.appendAlert('Este evento possui detalhes ou atividades, portanto, para removê-lo é necessário excluir esses itens primeiro.', 'alert-error',0,'modelAlert');
						
						var link = 'evento/'+page.evento.id+'/atividades/excluir/';
						
						$('.modal-body .alert.alert-error').append('<br><a href="'+link+'" class="btn btn-danger btn-small">Clique aqui para excluir os detalhes ou atividades deste evento</a>');
						app.hideProgress('modelLoader');
						
						$('.overlay-big-message').remove();
						
						$('.modal').addClass('animated shake').delay(1000).queue(function(){
							$(this).removeClass("animated shake").dequeue();
						});
					} else { 
							
						
								
								
								
							// ENTÃO REMOVE O EVENTO PROPRIAMENTE DITO									
							page.evento.destroy({
								wait: true,
								success: function(){
									$('#eventoDetailDialog').modal('hide');
									setTimeout("app.appendAlert('O evento foi excluido','alert-success',3000,'collectionAlert')",500);
									app.hideProgress('modelLoader');
									
									page.excluir = false;
									
									if (model.reloadCollectionOnModelUpdate) {
										// re-fetch and render the collection after the model has been updated
										page.fetchEventos(page.fetchParams,true);
									}
								},
								error: function(model,response,scope) {
									app.appendAlert(app.getErrorMessage(response), 'alert-error',0,'modelAlert');
									app.hideProgress('modelLoader');
									
									$('.overlay-big-message').remove();
									
									$('.modal').addClass('animated shake').delay(1000).queue(function(){
										$(this).removeClass("animated shake").dequeue();
									});
								}
							});
							
					}
				
				},
				error: function(model, response) {
					console.log('Erro ao remover a as palestras do evento');
					console.log(response);
				}
			});	
			
			
			
			
		
	}
};

