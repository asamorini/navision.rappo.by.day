// ==UserScript==
// @name         Navision_Improver
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  making Navision a better tool
// @author       tuffo19
// @match        https://navisionweb.lutech.it/
// @icon         https://www.google.com/s2/favicons?domain=lutech.it
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var $ = window.jQuery;
    var HACKTXT = " ~~~Hacked by Tuffo19~~~";


    var timer = setInterval( function() {
    var pageTitle = $("#ViewBagTitle");

        if (pageTitle.html().indexOf(HACKTXT)=== -1){

            switch(pageTitle.html()){
                case 'Dettaglio Rapportino Tempi e Spese': dettaglio_rapportini_tempi(); break;
                case 'Visualizzazione ore approvate': visualizzazione_ore_approvate(); break;
                default: break;
            }
             pageTitle.append(HACKTXT);
        }
	}, 500);

  function dettaglio_rapportini_tempi(){
        console.log("pagina: Dettaglio rapportini");
        $(".ui-jqgrid-bdiv").css('height','auto');

        $("#btnBack").parent().append(
        '<button id="btnDettaglioRapportini" type="button" onclick="$.ajaxSetup({cache:true});$.getScript(\'https://asamorini.github.io/navision.rappo/src/js/navision.tot.by.day.js\');" '+
        'class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary" role="button" aria-disabled="false">'+
        '<span class="ui-button-icon-primary ui-icon ui-icon-refresh"></span><span class="ui-button-text">Mostra totale ore</span></button>')
    }

    function visualizzazione_ore_approvate(){
        console.log("pagina: Visualizzazione ore");
        $("#dateFrom").val("01/08/2021");
        //calcola today
        //$("#dateTo").val(new Date(Date.now()).toLocaleDateString('it-IT'));
        $("#dateTo").val("31/12/2025");
        listaOreApprovate.p.rowNum = 1200;
        $(".ui-jqgrid-bdiv").css('height','auto');

        $("#listaOreApprovate_btnFiltra").click();
    }


})();
