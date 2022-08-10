//OVERWRITE OF NAVISION FUNCTIONS
function qJqGrid_loadData(grid, obj) {
	//ORIGINAL CODE
    if (obj.FirstRecordDisplayed == null)
        alert("FirstRecordDisplayed è nullo");
    $("#" + grid.id + "_situazionePaging").text("Visualizzate righe dalla " + obj.FirstRecordDisplayed + " alla " + obj.LastRecordDisplayed);
    $("#" + grid.id + "_firstRecord").val(obj.FirstRecordDisplayed);
    $("#" + grid.id + "_lastRecord").val(obj.LastRecordDisplayed);
    $("#" + grid.id + "_bookmarkKeyNext").val(obj.BookmarkKeyNext);
    $("#" + grid.id + "_bookmarkKeyPrev").val(obj.BookmarkKeyPrev);
    $("#" + grid.id + "_bookmarkKeyCurrent").val(obj.BookmarkKeyCurrent);
    $("#" + grid.id + "_bookmarkKeyAll").val(obj.BookmarkKeyAll);
    SetPagerButtonState(obj.HasPreviousPage, "#" + grid.id + "_btnPrev");
    SetPagerButtonState(obj.HasNextPage, "#" + grid.id + "_btnNext");
    $('#' + grid.id).jqGrid("resetSelection");
    $('#' + grid.id).clearGridData(true);
    $('#' + grid.id)[0].addJSONData(obj);

	//TECLA CODE
	var tableRappo=$('#'+teclaNavision.RAPPO_ID);
	if (tableRappo.length){	//se siamo nella lista dei rapportini
		teclaNavision.rappo.tableRappoAdjust(tableRappo,obj);
	}

	//ORIGINAL CODE
    obj = null;
    return;
}

function qJqGrid_firstPage(grid) {
	//ORIGINAL CODE
    var pagesize = grid.p.rowNum;

	//TECLA CODE
	if (grid.id===teclaNavision.RAPPO_ID){
		pagesize=teclaNavision.rappo.MAX_ROWS_NUMBER;	//aumento numero di righe
	}
	
	//ORIGINAL CODE
    var url = grid.p.ajaxUrl;
    if (grid.p.onBeforeNavigationReloadButton != null && grid.p.onBeforeNavigationReloadButton != undefined && grid.p.onBeforeNavigationReloadButton.length > 0) {
        eval(grid.p.onBeforeNavigationReloadButton);
    }
    qJqGrid_avviaRicerca(grid, url, 1, pagesize, "", "");
    return;
}


/************************************************************************
*****   TECLA NAVISION   ************************************************
************************************************************************/
var teclaNavision=teclaNavision || {};

teclaNavision.RAPPO_ID='listaRigheOdT';

//RAPPORTINI
teclaNavision.rappo=(function($,_window){
	//-----------------   private methods   -----------------
	var _R,
		_running=false,
		_tableRappo,	//jQuery variable of rapportini DOM table
		_data,	/*array of "rapportini" records retrieved from server
					ex:
						...
						{
							"Key":"32;fbBMAACJ/1JBUC0yMS80OTEyOQAAhxAn10;36466116100;",
							"Numero":"RAP-21/49129",
							"Riga":"10000",
							"PSPLineNo":"0",
							"GoBackOnSuccess":"False",
							"CopiaDaLineNo":"",
							"Data":"04/10/2021 00:00:00",
							"NrCommessa":"N219088",
							"CodiceFaseLavoro":"CONSULENZA",
							"DexFaseLavoro":"E+G AM",
							"CodiceFase":"002",
							"OreOrdinarie":"1.75",
							"OreStraordinarie":"0",
							"OreReperibilita":"0",
							"KmPercorsi":"0",
							"Targa":"",
							"LuogoPartenza":"",
							"LuogoDestinazine":"",
							"LuogoAttivita":"SmartWorking",
							"TipoTrasferta":"Italia",
							"Note":"ELEGANTB2B-1265 Geo-blocking translations store-checker",
							"LuogoAttivitaList":"System.Collections.Generic.Dictionary`2[System.String,System.String]",
							"TipoTrasfertaList":"System.Collections.Generic.Dictionary`2[System.String,System.String]",
							"TargheList":"",
							"ImportoSpese":"0",
							"BancaOre":"0",
							"OreTrasferta":"0",
							"AttivaBancaOre":"False",
							"AttivaOreTrasferta":"False",
							"EmptyField":"",
							"AttivaReqAbailability":"False",
							"ReqAbailabilityOre":"0",
							"FromTime_String":"",
							"ToTime_String":"",
							"FromTimeStra_String":"",
							"ToTimeStra_String":"",
							"FromTimeIntRep_String":"",
							"ToTimeIntRep_String":"",
							"FromTimeOrd_String":"00:00",
							"ToTimeOrd_String":"00:00"
						},
						...
				*/
	
		//COMPACT LAYOUT COLUMNS
		_compactHiddenColumns=[
			'FromTimeOrd_String',
			'ToTimeOrd_String',
			'FromTimeStra_String',
			'ToTimeStra_String',
//			'OreStraordinarie',	//questa serve per posizionarci il totale conteggio ore giornata
			'OreReperibilita',
			'ImportoSpese',
			'LuogoAttivita'
		],
	
		//ADD COLUMN NOTE
		_highlightText=function(text,textToHighlight){
			return text.replace(new RegExp('(^|\\s)(' + textToHighlight + ')(\\s|$)','ig'), '$1<span style="font-weight: bold;background: #ffffff;padding: 0px 5px;color: #000;">$2</span>$3');
		},
		
		//ADD COLUMN NOTE
		_addColumnNote=function(){
			//title
			$('#jqgh_'+teclaNavision.RAPPO_ID+'_EmptyField').prepend('Note');
			var colsTitle=$('[id="'+teclaNavision.RAPPO_ID+'_EmptyField"]'),
				totWidth=0,
				col;
				colNoteRemoved=0;
			for (var i=0;i<colsTitle.length;i++){
				col=$(colsTitle[i]);
				totWidth+=col.width();
			}
			$(colsTitle[0])
			.width(totWidth);
			for (var i=1;i<colsTitle.length;i++){
				$(colsTitle[i]).remove();
				colNoteRemoved++;
			}
		
			//rows
			var rows=_tableRappo.find('tr');
			rows.each(function(index){
				var row=$(this),
					rowId=row.attr('id'),
					colsEmpty=row.find('[aria-describedby="'+teclaNavision.RAPPO_ID+'_EmptyField"]'),
					col,
					note='',
					luogo='';
					
				//first fake row (used for width, I presume)
				if (row.hasClass('jqgfirstrow')){
					colsEmpty=row.find('td');
					
					$(colsEmpty[(colsEmpty.length - colNoteRemoved)-1])
					.width(totWidth);
					for (var i=0;i<=colNoteRemoved;i++){
						$(colsEmpty[colsEmpty.length - i])
//						.remove();
						.hide();
					}

				//row rapportino
				}else{
					//find the "Note" and "Luogo" value
					for (var i=0;i<_data.length;i++){
						if (_data[i].Riga==rowId){
							note=_data[i].Note;
							luogo=_data[i].LuogoAttivita;
							break;
						}
					}
					//update column
					for (var i=0;i<colsEmpty.length;i++){
						col=$(colsEmpty[i]);
						if (i===0){
							col.css({
								'background':'#d7dfeb',	//old color: #1d4f9c
								'text-align':'left',
								'white-space':'normal',
//								'color':'white',
								'font-weight':'bold'
							})
							.html(
								_highlightText(note,'[A-Z0-9]+-[0-9]+')	//highlight issue number; ex: from this "ELESAB2B-706 SE_eComm: admin account with ecommerce utilities" to this "<b>ELESAB2B-706</b> SE_eComm: admin account with ecommerce utilities"
							);
						}else{
							col.hide();
//							col.remove();
						}
					}
					$(colsEmpty[0])
					.width(totWidth);
					
					//add "Luogo" to "Vndere a cliente" column
					row.find('[aria-describedby="'+teclaNavision.RAPPO_ID+'_VendereACliente"]')
					.append(
						$('<div/>',{'class':'teclaLuogo','style':'float: right;background: '+(luogo==='SmartWorking' ? '#d7dfeb' : '#d0fcd0')+';padding: 5px;'})
						.append(
							luogo
						)
					);
				}
			});
/*TODO?
			//change colModel of jqGrid (we remove the deleted columns)
			var colModel=$('#'+teclaNavision.RAPPO_ID).jqGrid('getGridParam','colModel');
		$("#grid").jqGrid('setLabel', colModel[i]['name'], obj.columnNames[i]);
*/		

		},
	
		//TOTALIZE HOURS BY DAY
		_showTotalHours=function(){
			var rows=_tableRappo.find('tr:not(.jqgfirstrow)'),
				ggOld='',
				hoursTot=0,
				previousColHoursTot,
				totalizePreviousDay=function(hoursTotal,colHoursToUpdate){	//aggiorno il totale ore precedente
					var totEl=colHoursToUpdate.find('.totHours');
					if (!totEl.length){
						totEl=$('<div/>',{'class':'totHours','style':'font-weight:bold;font-size:16px;text-align: left;'})
								.appendTo(colHoursToUpdate);
					}
					
					totEl
					.html(hoursTotal)
					.css('color',hoursTotal>8 ? 'black' : hoursTotal===8 ? 'green' : 'red');
					colHoursToUpdate.parents('tr').css('border-bottom','3px solid #000');
				};

			rows.each(function(index){
				var row=$(this),
					cols=row.find('td'),
						colDay=cols.filter('[aria-describedby='+teclaNavision.RAPPO_ID+'_Data]'),
					colHours=cols.filter('[aria-describedby='+teclaNavision.RAPPO_ID+'_OreOrdinarie]'),
					gg=colDay.html(),
					hours=+colHours.html().replace(',','.'),
					isLastRow=rows.length==index+1,
					COL_POSITION_TOTAL_HOURS='[aria-describedby='+teclaNavision.RAPPO_ID+'_OreStraordinarie]';
//					COL_POSITION_TOTAL_HOURS='[aria-describedby='+teclaNavision.RAPPO_ID+'_FromTimeStra_String]';
					
				//AGGIORNAMENTO RIGHE PRECEDENTI
				if ((gg!==ggOld && ggOld) || isLastRow){
					if (gg!==ggOld && ggOld){
						totalizePreviousDay(hoursTot,previousColHoursTot);
						hoursTot=0;
					}
					if (isLastRow){
						hoursTot+=hours;
						previousColHoursTot=cols.filter(COL_POSITION_TOTAL_HOURS);
						totalizePreviousDay(hoursTot,previousColHoursTot);
					}
				}
				
				//IDENTIFICAZIONE RIGA ATTUALE
				if (gg===ggOld){
					if (!isLastRow){
						hoursTot+=hours;
					}

				}else{
					ggOld=gg;
					hoursTot=hours;	//conteggio nuovo totale ore
				}
				previousColHoursTot=cols.filter(COL_POSITION_TOTAL_HOURS);
				
				//MERGE COLUMN "Commessa" e "Fase"
				let mergeData={
					'CodiceFase':	'NrCommessa',
					'DexFaseLavoro':'DescCommessa',
				};
				for (var m in mergeData){
					cols.filter('[aria-describedby='+teclaNavision.RAPPO_ID+'_'+mergeData[m]+']')
					.append(
						$('<div/>',{'class':'teclaLayoutMerged','style':'float: right;background: #d7dfeb;padding: 5px;'})
						.append(
							cols.filter('[aria-describedby='+teclaNavision.RAPPO_ID+'_'+m+']').html()
						)
					);
				}
			});
		},

		//SET COMPACT\FULL MODE LAYOUT (on rapportini table)
		_tableLayoutMode=function(cb){
			/*Input parameters:
				cb		= [optional] callback function to be executed after layout change mode is applied
			*/
			//show\hide columns
			setTimeout(function(){
				if (_R.LAYOUT_MERGE){
					$('.teclaLayoutMerged').show();
				}else{
					$('.teclaLayoutMerged').hide();
				}
				
				setTimeout(function(){	//posticipato perchè l'istruzione "hideCol" va in errore
					//resize
					qJqGrid_resize(teclaNavision.RAPPO_ID);

					//adjust column Note width
					var widthContainer=$('#gview_'+teclaNavision.RAPPO_ID+' .ui-jqgrid-hdiv').width(),
						widthtable=$('#gview_'+teclaNavision.RAPPO_ID+' .ui-jqgrid-hbox').width(),
						addWidth=widthContainer-widthtable-17,	//"17" for vertical scrollbar
						newWidth,
						colNote;
					if (addWidth>0){
						colNote=$('#'+teclaNavision.RAPPO_ID+'_EmptyField');
						newWidth=colNote.width()+addWidth;
						colNote.width(newWidth);																	//title
						_tableRappo.find('tr.jqgfirstrow td:nth-child('+(colNote.index()+1)+')').width(newWidth);	//first fake row (used for width, I presume)
						$('[aria-describedby="'+teclaNavision.RAPPO_ID+'_EmptyField"]').width(newWidth);			//rows
					}
					
					//callback function
					if (typeof cb !=='undefined'){
						cb();
					}
				},0);
				$('#'+teclaNavision.RAPPO_ID).jqGrid(
					_R.LAYOUT_COMPACT ? 'hideCol' : 'showCol',
					_compactHiddenColumns
				);
				$('#'+teclaNavision.RAPPO_ID).jqGrid(
					_R.LAYOUT_MERGE ? 'hideCol' : 'showCol',
					[
						'CodiceFase',
						'DexFaseLavoro'
					]
				);
			},0);
		},

		//
		_setCookie=function(cname, cvalue, exdays){
			/*Input parameters:
				xxx		= [optional] xxx
			Return value:	
			*/
			const d = new Date();
			d.setTime(d.getTime() + (exdays*24*60*60*1000));
			let expires = "expires="+ d.toUTCString();
			document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
		},
		
		//
		_getCookie=function(cname){
			/*Input parameters:
				xxx		= [optional] xxx
			Return value:	
			*/
			let name = cname + "=";
			let decodedCookie = decodeURIComponent(document.cookie);
			let ca = decodedCookie.split(';');
			for(let i = 0; i <ca.length; i++) {
				let c = ca[i];
				while (c.charAt(0) == ' ') {
					c = c.substring(1);
				}
				if (c.indexOf(name) == 0) {
					return c.substring(name.length, c.length);
				}
			}
			return "";
		},

		//SHOW A MESSAGE
		_displayMessage=function(text,removeAfterMilliseconds){
			/*Input parameters:
				text						= text to be showed
				removeAfterMilliseconds		= [optional] number of milliseconds after which the message is removed
			Return value:	
			*/
			$('#teclaNavisionConfiguration')
			.prepend(
				$('<div/>',{
					'id':'teclaNavision_tempMessage'
				})
				.css({
					'display':				'none',
					'margin-bottom':		'50px',
					'background':			'#d7dfeb',
					'border-radius':		'16px',
					'padding':				'5px 10px',
					'color': 				'#d22020',
					'font-size':			'30px',
					'text-align':			'center'
				})
				.html(text)
			)
			$('#teclaNavision_tempMessage').show('slow');
			setTimeout(function(){
				$('#teclaNavision_tempMessage').hide('slow',function(){
					$('#teclaNavision_tempMessage').remove();
				});
			},removeAfterMilliseconds || 2000);
		},

		//
		_xxxxx2=function(xxx){
			/*Input parameters:
				xxx		= [optional] xxx
			Return value:	
			*/
/*TODO
*/
		};


		//INITIALIZATION
		$(document).ready(function(){
		
			//GET USER OPTIONS
			var userOptions=_getCookie('teclaNavisionOptions');
			userOptions=userOptions ? JSON.parse(userOptions) : {
				LAYOUT_COMPACT:true,
				LAYOUT_MERGE:true
			};
			
			//MESSAGE EXTRA FUNCTIONS ACTIVATED
			var leftContainer=$('#accordionMenu .ui-accordion-content').first()
				,options=$('<div/>')
					.css({
						'font-size': '12px',
						'padding': '2px 10px 2px 6px',
						'background': '#d7dfeb',
						'display': 'inline-block',
						'border-radius': '16px',
						'margin-right': '5px',
						'text-align': 'left'
					})
					.append(
						$('<div/>')
						.append('<input type="checkbox" id="teclaNavisionLayoutCompact" onclick="teclaNavision.rappo.tableRappoOptionsUpdate()"'+(userOptions.LAYOUT_COMPACT ? ' checked' : '')+'>')
						.append('<label for="teclaNavisionLayoutCompact">compact</label>')
					)
					.append(
						$('<div/>')
						.append('<input type="checkbox" id="teclaNavisionLayoutMerge" onclick="teclaNavision.rappo.tableRappoOptionsUpdate()"'+(userOptions.LAYOUT_MERGE ? ' checked' : '')+'>')
						.append('<label for="teclaNavisionLayoutMerge">merge</label>')
					)
				,message=$('<a/>',{
						'id':'teclaNavisionMessage',
						'target':'_blank',
						'href':'https://github.com/asamorini/navision.rappo'
					})
					.css({
						'-moz-transition':		'all 1s ease-in',
						'-webkit-transition':	'all 1s ease-in',
						'-o-transition':		'all 1s ease-in',
						'transition':			'all 1s ease-in',
						'background':			'#eeeeee',
						'border-radius':		'16px',
						'padding':				'5px 10px',
						'color': 				'#d22020',
						'font-size':			'12px'
					})
				,messageContainer=$('<div/>',{'id':'teclaNavisionConfiguration'})
					.css({
						'position':				'absolute',
						'-moz-transition':		'all 2s ease-out 0s',
						'-webkit-transition':	'all 2s ease-out 0s',
						'-o-transition':		'all 2s ease-out 0s',
						'transition':			'all 2s ease-out 0s',
						'right':				'10px',
						'bottom':				(leftContainer.height() - leftContainer.find('>a').last().position().top) - 30,	//posiziono sotto all'ultimo tasto del navigatore
						'text-align':			'right',
						'opacity':				'0'
					});
			leftContainer
			.append(
				messageContainer
				.append(options)
				.append(message.html('Tecla plugin enabled'))
			);
			//new button "Estrai dettagli" near "Visualizza consuntivi mensili"
			leftContainer.find('#menu2')
			.after(
				$('<div/>',{id:'teclaNavisionExtractDetails_container','style':'text-align: right;margin: 0 0 10px;display:none'})
				.append(
					$('<a/>',{
							'id':'teclaNavisionExtractDetails',
							'onclick':'teclaNavision.rappo.reportHoursApproved()',
							'style':'position: relative;'
									+'background: #e3a1a1;'
									+'border-radius: 16px;'
									+'padding: 3px 10px;'
					})
					.html('Estrai dettagli')
					.prepend($('<div/>',{'style':'position: absolute;'
												+'top: -2px;'
												+'left: -32px;'
												+'border-left: 1px solid #d32424;'
												+'border-bottom: 1px solid #d32424;'
												+'width: 30px;'
												+'height: 15px;'
												+'empty-cells: show;'
										}))
				)
			);
			$('#teclaNavisionExtractDetails_container').slideDown('slow');
			//"version" highlight effect: START
			message=$('#teclaNavisionMessage');
			messageContainer=message.parent('div');
			setTimeout(function(){
				message.css({'background':'#a3ede6'});
				messageContainer.css({'bottom':'10px','opacity':1});
				//"version" highlight effect: END
				setTimeout(function(){
					message.css({'color':'#d22020','background':'#eeeeee'});
				},1500);
			},200);
			
		});

	//-----------------   public methods   -----------------
	return{

		LAYOUT_COMPACT:true,
		LAYOUT_MERGE:true,	//merge columns "Commessa" e "Fase"
		MAX_ROWS_NUMBER:120,

		//ADJUST RAPPORTINI
		tableRappoAdjust:function(tableRappo,obj){
			/*Input parameters:
				tableRappo	= table rapportini
				obj			= JSON object with rapportini retrieved from server
			*/
			if (!obj || !obj.Oggetti){return;}
			console.log('tableRappoAdjust',obj);

			_R=teclaNavision.rappo;
			_tableRappo=tableRappo;
			
			//there is only one page of rows
			if ($('#'+teclaNavision.RAPPO_ID+'_btnPrev').is(':disabled')
			   && $('#'+teclaNavision.RAPPO_ID+'_btnNext').is(':disabled')){
				_data=obj.Oggetti;
				_addColumnNote(obj);
				_showTotalHours();
				_tableLayoutMode(
					function(){
						_tableRappo.show();
					}
				);
				
			//there are many pages of rows (so we retrieve all)
			}else{
				console.log('tableRappoAdjust many pages, so we retrieve morre rows',_R.MAX_ROWS_NUMBER);
				_tableRappo.hide();
				
				//set new total rows number per page
				listaRigheOdT.p.rowNum=_R.MAX_ROWS_NUMBER;

				//refresh
				qJqGrid_firstPage(listaRigheOdT);
			}
		},

		//UPDATED OPTIONS
		tableRappoOptionsUpdate:function(){
			teclaNavision.rappo.LAYOUT_COMPACT=$('#teclaNavisionLayoutCompact').is(":checked");
			teclaNavision.rappo.LAYOUT_MERGE=$('#teclaNavisionLayoutMerge').is(":checked");
			if (_R){
				_tableLayoutMode();
			}
			_setCookie('teclaNavisionOptions',JSON.stringify({
				LAYOUT_COMPACT:teclaNavision.rappo.LAYOUT_COMPACT,
				LAYOUT_MERGE:teclaNavision.rappo.LAYOUT_MERGE
			}),365);
		},
		
		//EXTRACT DETAILS DATA FROM VIEW "Visualizza consuntivi mensili"
		reportHoursApproved:function(){
			var days=$('#MainPanel .header-center img[src$="check.png"]');
				daysWithApprovedHours=[],
				getDayApprovedHours=function(pos){	//RETRIEVE APPROVED HOURS
					/*Input parameters:
						pos	= "daysWithApprovedHours" array index position to be filled with data extracted
					*/
					var jsonResult=daysWithApprovedHours[pos],
						day=jsonResult.day, //day to be extracted; ex: "01/07/2022"
						conlcudi=function(){
							var RESULT_ID='teclaNavision_approvedHours',
								container,
								styleBorder,
								table,
								el,d;
							//we need to get data for other days
							if (daysWithApprovedHours.length>pos+1){
								getDayApprovedHours(pos+1);	//get data for the next day
							//completed requested information
							}else{
							
								//OUTPUT
								container=$('#'+RESULT_ID);
								if (container.length){
									container.empty();
								}else{
									container=$('<div/>',{'id':RESULT_ID,'style':'width: 95%;margin-top: 20px;margin-left: auto;margin-right: auto;'})
												.appendTo('#MainPanel');
									container
									.append(
										$('<div/>',{'style':'font-size: 1.5em;font-weight: bold;text-align: center;color: #000;'})
										.html('Dati estratti')
									);
								}
								
								//JSON data
								container
								.append(
									$('<div/>',{'style':'font-weight: bold;'})
									.html('JSON dati estratti<br/>')
									.append(
										$('<textarea/>').html(JSON.stringify(daysWithApprovedHours))
									)
								);
								//days data details
								table=$('<table/>',{'style':'margin-top: 20px;'})
										.append(
											'<tr>'
												+'<th>Data</th>'
												+'<th>Commessa</th>'
												+'<th>Desc.Commessa</th>'
												+'<th>Fase</th>'
												+'<th>Ore</th>'
												+'<th>Straordinario</th>'
												+'<th>Note</th>'
											+'</tr>'
										);
								//for every day
								for (var i=0;i<daysWithApprovedHours.length;i++){
									el=daysWithApprovedHours[i];
									if (el.error){
										table.append(
											'<tr>'
												+'<td>'+el.day+'</td>'
												+'<td style="color:red">ERROR</td>'
												+'<td></td>'
												+'<td></td>'
												+'<td></td>'
												+'<td></td>'
												+'<td>'+el.error+'</td>'
											+'</tr>'
										);
									}else{
										d=el.data || [];
										//for every "rapportino"
										for (var k=0;k<d.length;k++){
											styleBorder='border:1px solid;'
														+(k===d.length-1 ? 'border-bottom:4px solid;' : '');
											table.append(
												'<tr>'
													+'<td style="'+styleBorder+'">'+el.day+'</td>'
													+'<td style="'+styleBorder+'">'+d[k].Commessa+'</td>'
													+'<td style="'+styleBorder+'white-space: nowrap;">'+d[k].Descrizione+'</td>'
													+'<td style="'+styleBorder+'">'+d[k].Fase+'</td>'
													+'<td style="'+styleBorder+'text-align: center;">'+d[k].OreOrdinarie+'</td>'
													+'<td style="'+styleBorder+'text-align: center;">'+d[k].OreStraordinarie+'</td>'
													+'<td style="'+styleBorder+'">'+(d[k].Note || '')+'</td>'
												+'</tr>'
											);
										}
									}
								}
								container.append(table);
								_displayMessage('Estrazione completata');
								_running=false;
							}
						};
					
					//replicate the call used by navision function "displayOreApprovate('01/07/2022')"
					$.ajax({
						type:	'POST',
						url:	'https://navisionweb.lutech.it/Consuntivo/GetOreApprovate',
						contentType:'application/x-www-form-urlencoded;charset=UTF-8',
						data:{
							'day': day,
							'numRecordIniziale':'1',
							'pageSize':'-1',
							'bookmarkKey':'',
							'bookmarkKeyAll':'',
							'username':$('#username').val()	//ex: 'andrea.samorini'
						},
						success:function(data){	//ex:	{"TotalRecors":"4","FirstRecordDisplayed":"1","LastRecordDisplayed":"4","HasPreviousPage":"false","HasNextPage":"false","CurrentPage":"1","Oggetti":[{"Risorsa":"3317","Data":"04/07/2022 00:00:00","Commessa":"N220563","Fase":"001","Descrizione":"ELESA: DM + AM/CR","Key":"12;qQAAAACHin9u10;55780817730;","OreOrdinarie":"0,5","OreStraordinarie":"0","OreReperibilita":"0","OreAssenze":"0","BancaOre":"0","OreTrasferta":"0","OreReqAvailability":"0","AttivaBancaOre":"False","AttivaOreTrasferta":"False","AttivaOreReqAvailability":"False","Note":"ELESADM-501 Pagine SKU: Valutazione SEO Indexing e Valutazione Google Shopping"},{"Risorsa":"3317","Data":"04/07/2022 00:00:00","Commessa":"N220563","Fase":"001","Descrizione":"ELESA: DM + AM/CR","Key":"12;qQAAAACHi39u10;55780817740;","OreOrdinarie":"2","OreStraordinarie":"0","OreReperibilita":"0","OreAssenze":"0","BancaOre":"0","OreTrasferta":"0","OreReqAvailability":"0","AttivaBancaOre":"False","AttivaOreTrasferta":"False","AttivaOreReqAvailability":"False","Note":"ELESA: allineamento situazione progetto, deploy, issue prioritarie, mail"},{"Risorsa":"3317","Data":"04/07/2022 00:00:00","Commessa":"N220563","Fase":"001","Descrizione":"ELESA: DM + AM/CR","Key":"12;qQAAAACHjH9u10;55780817750;","OreOrdinarie":"1,25","OreStraordinarie":"0","OreReperibilita":"0","OreAssenze":"0","BancaOre":"0","OreTrasferta":"0","OreReqAvailability":"0","AttivaBancaOre":"False","AttivaOreTrasferta":"False","AttivaOreReqAvailability":"False","Note":"ELESAB2B-1002 eComm_PDP: layout tabella Quotation-only per store non ecommerce"},{"Risorsa":"3317","Data":"04/07/2022 00:00:00","Commessa":"N220563","Fase":"001","Descrizione":"ELESA: DM + AM/CR","Key":"12;qQAAAACHjX9u10;55780817760;","OreOrdinarie":"4,25","OreStraordinarie":"0","OreReperibilita":"0","OreAssenze":"0","BancaOre":"0","OreTrasferta":"0","OreReqAvailability":"0","AttivaBancaOre":"False","AttivaOreTrasferta":"False","AttivaOreReqAvailability":"False","Note":"ELESAB2B-1087 eComm_PDP: Integrazione sviluppo NewPDP con gli altri sviluppi fatti nel frattempo (Recapcha, Svizzera, ...)"}]}
							try{
								data=JSON.parse(data);
							}catch(e){
								console.error('getDayApprovedHours: Error parsing data from server',data);
								jsonResult.error='Error parsing data from server<br><br>'+JSON.stringify(data);
								return conlcudi();
							}
							//save data
							jsonResult.data=data['Oggetti'] || [];	//save array with rows rapportini
							return conlcudi();
						},error:function(data){
							console.error('getDayApprovedHours: Error from server<br><br>'+data.statusText,data);
							jsonResult.error='Error from server '+data.statusText;
							return conlcudi();
						}
					});
				};
			
			if (_running){return;}
			_running=true;
			//check to be on the right page (this condition could be better)
			if ($('#dLegenda').length
			&& $('#dGriglia').length
			&& days.length
			){

				//for every day of this month
				days.each(function(index){
					var dayLink=$(this).parent(),				//ex: <a onclick="displayOreApprovate('01/07/2022');" href="#">
						day;

					if (dayLink.attr('onclick'))
					day=dayLink.attr('onclick') || '';
					if (day){
						day=day.split("'");	//ex: ["displayOreApprovate(","01/07/2022",");"]
						day=day[1] || '';	//ex: "01/07/2022"
						if (day){
							daysWithApprovedHours.push({
								day:day
							});
						}
					}
				});
				if (daysWithApprovedHours.length){
					getDayApprovedHours(0);	//get data for the first day
				}else{
					_displayMessage('Non ci sono giorni con ore approvate');
					_running=false;
				}
			}else{
				_displayMessage('Pagina non riconosciuta per l\'estrazione,<br>oppure non ci sono giorni approvati');
				_running=false;
			}
		},
		
		
		
		//
		xxx:function(name){
			/*Input parameters
				xxx	= 
			Return value:	
			*/
			return true;
		}
	};
})(jQuery,window);
