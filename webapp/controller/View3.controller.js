sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/ListItem",
  "prestamos/ccb/org/solprestamos/util/BackendService"
], function (Controller, JSONModel, MessageBox, MessageToast, ListItem, BackendService) {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.View3", {
    onInit: function () {
      this._oBackendService = new BackendService();

      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var programasPregrado = oGlobalModel ? oGlobalModel.getProperty("/gt_pregrado") : [];


      var oUserData = oGlobalModel ? oGlobalModel.getProperty("/userData") : null;
      var oPrestamoSeleccionado = oGlobalModel ? oGlobalModel.getProperty("/prestamoSeleccionado") : null;

      var oViewModel = new JSONModel({
        // Datos del usuario / préstamo
        employeeNumber: oUserData ? oUserData.PERNR : "",
        idPrestamo: oPrestamoSeleccionado ? oPrestamoSeleccionado.PrestamoId : "",

        // Valores monetarios
        montoMaximo: 0,
        tasaInteres: 0,
        valorSolicitado: 0,
        valorPrestamo: 0,
        ValorPagar: 0,
        ValorCuota: 0,
        valorTotalPrimas: 0,

        // Condonación
        valorCondonado: 0,
        porcCondonado: 0,
        porcPrestamo: 0,

        // Configuración de moneda
        moneda: "COP",              // Código de moneda (Peso Colombiano)

        // Cuotas
        NCuotas: "",
        numeroCuotas: 0,

        // Campos del formulario educativo
        tipoEducacion: "",
        Nivel: "",
        Periodicidad: "",
        OrigenU: "",
        DescuentoPrimas: "",
        SelectedPrimas: "NO_APLICA",
        PorcentajePrima: "",

        // Estados de validación
        valorValueState: "None",
        valorValueStateText: "",
        cuotasValueState: "None",
        cuotasValueStateText: "",

        // Codeudor
        tieneCodeudor: -1,
        mostrarCCB: false,
        mostrarExterno: false,
        nombreCodeudor: "",
        cedulaCodeudor: "",
        numeroEmpleadoCodeudor: "",
        direccionCodeudor: "",
        telefonoCodeudor: "",

        // Otros
        solicitudEnabled: true,
        adjuntos: [],
        programasPregrado: programasPregrado,

        // Buscador de programa pregrado
        programaBusqueda: "",
        programaTitulo: "",
        programaUniversidad: "",
        programaCarrera: "",
        programaNIT: ""
      });

      this.getView().setModel(oViewModel, "educaView");

      // Modelo para la colección de primas a descontar
      var oPrimasModel = new JSONModel({ items: [] });
      this.getView().setModel(oPrimasModel, "listprimas3");

      this._wizard = this.byId("wizardEduca");

      // Suscribirse al evento de ruta
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteView3").attachPatternMatched(this._onRouteMatched, this);
    },

    /**
     * Se ejecuta cada vez que el router navega a RouteView3.
     * Lee el préstamo seleccionado desde globalData.
     * @private
     */
    _onRouteMatched: function () {
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
      var oViewModel = this.getView().getModel("educaView");

      if (oPrestamoSeleccionado && oPrestamoSeleccionado.MontoMaximo) {
        oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo.replace(/\./g, "")));
      }

      // Limpiar campos calculados al navegar
      oViewModel.setProperty("/valorSolicitado", 0);
      oViewModel.setProperty("/valorPrestamo", 0);
      oViewModel.setProperty("/ValorPagar", 0);
      oViewModel.setProperty("/ValorCuota", 0);
      oViewModel.setProperty("/NCuotas", "");
      oViewModel.setProperty("/numeroCuotas", 0);
      oViewModel.setProperty("/valorValueState", "None");
      oViewModel.setProperty("/valorValueStateText", "");
      oViewModel.setProperty("/cuotasValueState", "None");
      oViewModel.setProperty("/cuotasValueStateText", "");

      // Refrescar programasPregrado desde globalData (por si cargó después del onInit)
      var aProgramas = oGlobalModel.getProperty("/gt_pregrado");
      if (aProgramas) {
        oViewModel.setProperty("/programasPregrado", aProgramas);
      }
      // Limpiar primas al navegar
      this.getView().getModel("listprimas3").setProperty("/items", []);
      oViewModel.setProperty("/SelectedPrimas", "NO_APLICA");

      // Limpiar selección previa y sugerencias del input
      this._aUltimosFiltrados = [];
      this.byId("selectProgPregado").removeAllSuggestionItems();
      oViewModel.setProperty("/programaBusqueda", "");
      oViewModel.setProperty("/programaTitulo", "");
      oViewModel.setProperty("/programaUniversidad", "");
      oViewModel.setProperty("/programaCarrera", "");
      oViewModel.setProperty("/programaNIT", "");
    },

    /**
     * Filtra programasPregrado mientras el usuario escribe en el buscador.
     *
     * IMPORTANTE: cuando el usuario navega con flechas, UI5 copia el texto del item
     * resaltado al input y vuelve a disparar 'suggest'. En ese caso NO debemos
     * reconstruir la lista (hacerlo resetea la navegación al primer item).
     * Detectamos esto comprobando si el query coincide exactamente con el texto
     * de algún item ya presente en el popup.
     */
    onSuggestPrograma: function (oEvent) {
      var sQuery = oEvent.getParameter("suggestValue");
      var oInput = oEvent.getSource();

      // Si el query coincide con un item existente => usuario navegando, no escribiendo
      var bNavegando = oInput.getSuggestionItems().some(function (oItem) {
        return oItem.getText() === sQuery;
      });
      if (bNavegando) { return; }

      oInput.removeAllSuggestionItems();
      this._aUltimosFiltrados = [];

      if (!sQuery || sQuery.trim() === "") { return; }

      var oViewModel = this.getView().getModel("educaView");
      var aProgramas = oViewModel.getProperty("/programasPregrado") || [];
      var sQueryLower = sQuery.trim().toLowerCase();

      this._aUltimosFiltrados = aProgramas.filter(function (oP) {
        return (oP.TITULO && oP.TITULO.toLowerCase().indexOf(sQueryLower) !== -1) ||
          (oP.NAME1 && oP.NAME1.toLowerCase().indexOf(sQueryLower) !== -1) ||
          (oP.NAME2 && oP.NAME2.toLowerCase().indexOf(sQueryLower) !== -1);
      });

      this._aUltimosFiltrados.forEach(function (oP) {
        oInput.addSuggestionItem(new ListItem({
          key: oP.NIT,
          text: oP.TITULO,
          additionalText: oP.NAME1
        }));
      });
    },

    /**
     * Rellena los inputs de solo lectura con los datos del programa seleccionado.
     * Busca primero por TITULO+NAME1 (más específico) y cae en TITULO solo como fallback.
     * No depende de getKey() que puede ser inconsistente con items creados dinámicamente.
     */
    onProgramaSeleccionado: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (!oItem) { return; }

      var sTitulo = oItem.getText();
      var sUniversidad = oItem.getAdditionalText ? oItem.getAdditionalText() : "";

      // Buscar en el último conjunto filtrado (scope reducido = más rápido y exacto)
      var aCandidatos = this._aUltimosFiltrados && this._aUltimosFiltrados.length
        ? this._aUltimosFiltrados
        : (this.getView().getModel("educaView").getProperty("/programasPregrado") || []);

      var oPrograma = aCandidatos.find(function (oP) {
        return oP.TITULO === sTitulo && oP.NAME1 === sUniversidad;
      });
      // Fallback: solo por TITULO
      if (!oPrograma) {
        oPrograma = aCandidatos.find(function (oP) { return oP.TITULO === sTitulo; });
      }
      if (!oPrograma) { return; }

      var oViewModel = this.getView().getModel("educaView");
      oViewModel.setProperty("/programaNIT", oPrograma.NIT);
      oViewModel.setProperty("/programaTitulo", oPrograma.TITULO);
      oViewModel.setProperty("/programaUniversidad", oPrograma.NAME1);
      oViewModel.setProperty("/programaCarrera", oPrograma.NAME2);
      oViewModel.setProperty("/programaBusqueda", oPrograma.TITULO + " — " + oPrograma.NAME1);
    },

    /**
     * Evento cuando cambia el valor solicitado
     */
    onValorSolicitadoChange: function (oEvent) {

      var that = this;
      var oViewModel = this.getView().getModel("educaView");

      var sValue = oEvent.getParameter("value");
      var fValorSolicitado = this._parseMoneyValue(sValue);
      var tipoEducacion = oViewModel.getProperty("/tipoEducacion");
      var nivelestudios = oViewModel.getProperty("/Nivel");


      oViewModel.setProperty("/valorSolicitado", fValorSolicitado);

      // Validar que no exceda el monto máximo
      var fMontoMaximo = oViewModel.getProperty("/montoMaximo");
      if (fMontoMaximo > 0 && fValorSolicitado > fMontoMaximo) {
        MessageBox.warning(
          "El valor solicitado excede el monto máximo permitido de " +
          this._formatCurrency(fMontoMaximo, "COP"),
          { title: "Valor Excedido" }
        );
        oViewModel.setProperty("/valorSolicitado", fMontoMaximo);
        // Actualizar el input visualmente
        this.byId("inputValorSolicitado").setValue(fMontoMaximo);
        return;
      }

      // Limpiar error si había
      if (fValorSolicitado > 0) {
        oViewModel.setProperty("/valorValueState", "None");
        oViewModel.setProperty("/valorValueStateText", "");
      }




      if (fValorSolicitado && tipoEducacion && nivelestudios) {

        var dataCondonado = {
          "TIPO_ESTUDIO": tipoEducacion,
          "SEMESTRE": nivelestudios,
          "VALOR": fValorSolicitado
        };



        this._oBackendService.getValorCondonado(dataCondonado)
          .then(function (oResponse) {
            var porcCondonado = "";
            var porcPrestamo = "";

            var oResult = oResponse["n0:ZCOHCMF_VALOR_CONDONADOResponse"] &&
              oResponse["n0:ZCOHCMF_VALOR_CONDONADOResponse"].RESPONSE;
            if (oResult) {
              porcCondonado = parseFloat(oResult.PORCENTAJE_CONDONADO ? oResult.PORCENTAJE_CONDONADO.trim() : "0").toFixed(2);
              porcPrestamo = parseFloat(oResult.PORCENTAJE_PRESTAMO ? oResult.PORCENTAJE_PRESTAMO.trim() : "0").toFixed(2);

              oViewModel.setProperty("/porcCondonado", porcCondonado);
              oViewModel.setProperty("/porcPrestamo", porcPrestamo);

              oViewModel.setProperty("/valorCondonado", oResult.VALOR_CONDONADO);
              that._calcularValorPrestamo();
              MessageToast.show("Valor condonado calculado correctamente.");
            } else {
              MessageBox.error("No se obtuvo respuesta del servicio de condonación.", { title: "Error" });
            }
          })
          .catch(function (oError) {
            MessageBox.error(
              "Error al consultar el valor condonado: " + (oError.message || oError.statusText || "Error desconocido"),
              { title: "Error de condonación" }
            );
            that._calcularValorPrestamo();
          });
      }


    },

    /**
     * Evento cuando cambian las cuotas
     */
    onCuotasChange: function (oEvent) {
      var oViewModel = this.getView().getModel("educaView");
      var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

      oViewModel.setProperty("/NCuotas", sSelectedKey);
      oViewModel.setProperty("/numeroCuotas", parseInt(sSelectedKey));

      // Limpiar error si había
      if (sSelectedKey) {
        oViewModel.setProperty("/cuotasValueState", "None");
        oViewModel.setProperty("/cuotasValueStateText", "");
      }

      this._calcularValorPrestamo();
    },

    /**
     * Calcula valorPrestamo, ValorPagar y ValorCuota a partir del valor solicitado y número de cuotas.
     * Sin intereses (igual que préstamos de calamidad y computador).
     * @private
     */
    _calcularValorPrestamo: function () {
      var oViewModel = this.getView().getModel("educaView");

      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
      var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;
      var fValorCondonado = oViewModel.getProperty("/valorCondonado") || 0;
      var fValorPagar = fValorSolicitado - fValorCondonado;
      var valorTotalPrimas = oViewModel.getProperty("/valorTotalPrimas") || 0;


      if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
        oViewModel.setProperty("/valorPrestamo", 0);
        oViewModel.setProperty("/ValorPagar", 0);
        oViewModel.setProperty("/ValorCuota", 0);
        return;
      }

      oViewModel.setProperty("/valorPrestamo", Math.round(fValorSolicitado));

      oViewModel.setProperty("/ValorPagar", Math.round(fValorPagar));

      if ((fValorPagar > 0 && iNumeroCuotas > 0) && (fValorPagar > iNumeroCuotas)) {
        var fValorCuota = Math.round((fValorPagar - valorTotalPrimas) / iNumeroCuotas) > 0 ? Math.round((fValorPagar - valorTotalPrimas) / iNumeroCuotas) : 0;
        oViewModel.setProperty("/ValorCuota", fValorCuota);
      }


      MessageToast.show("Cuota: " + this._formatCurrency(fValorCuota, "COP"));
    },

    /**
     * Parsea un valor monetario (con formato) a número
     * @private
     */
    _parseMoneyValue: function (sValue) {
      if (!sValue) {
        return 0;
      }
      var sCleanValue = sValue.toString()
        .replace(/COP/g, "")
        .replace(/\$/g, "")
        .replace(/\./g, "")
        .replace(/,/g, "")
        .replace(/\s/g, "")
        .trim();

      var fValue = parseFloat(sCleanValue);
      return isNaN(fValue) ? 0 : fValue;
    },

    /**
     * Formatea un valor como moneda
     * @private
     */
    _formatCurrency: function (fValue, sCurrency) {
      var oFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
        currencyCode: true,
        maxFractionDigits: 0
      });
      return oFormat.format(fValue, sCurrency);
    },

    /**
     * Muestra u oculta los campos del codeudor según si es empleado CCB o externo.
     * index 0 = "Sí" (empleado CCB), index 1 = "No" (externo)
     */
    onCodeudorTypeSelect3: function (oEvent) {
      var iIndex = oEvent.getParameter("selectedIndex");
      var oViewModel = this.getView().getModel("educaView");

      oViewModel.setProperty("/mostrarCCB", iIndex === 0);
      oViewModel.setProperty("/mostrarExterno", iIndex === 1);

      if (iIndex === 0) {
        oViewModel.setProperty("/nombreCodeudor", "");
        oViewModel.setProperty("/cedulaCodeudor", "");
        oViewModel.setProperty("/direccionCodeudor", "");
        oViewModel.setProperty("/telefonoCodeudor", "");
      } else {
        oViewModel.setProperty("/nombreCodeudor", "");
        oViewModel.setProperty("/numeroEmpleadoCodeudor", "");
        oViewModel.setProperty("/cedulaCodeudor", "");
      }
      this.onStepCodeudorActivate3();
    },

    /**
     * Valida o invalida el step02 según si el codeudor tiene datos completos.
     */
    onStepCodeudorActivate3: function () {
      var oViewModel = this.getView().getModel("educaView");
      var sNombre = oViewModel.getProperty("/nombreCodeudor");
      var sCedula = oViewModel.getProperty("/cedulaCodeudor");

      if ((sNombre && sNombre.trim() !== "") && (sCedula && sCedula.trim() !== "")) {
        this._wizard.validateStep(this.byId("step02"));
      } else {
        this._wizard.invalidateStep(this.byId("step02"));
      }
    },

    /**
     * Abre el diálogo de ayuda para buscar un colaborador CCB.
     */
    onIdentificacionValueHelp3: function () {
      var sIdentificacion = String(this.byId("inputIdentificacion3").getValue()).trim();
      var oColaborador = this._oBackendService.Get_colaborador(sIdentificacion);
      var oViewModel = this.getView().getModel("educaView");

      if (oColaborador !== undefined) {
        oViewModel.setProperty("/Codeudores", oColaborador);
      }

      if (this._oDialogCodeudor3 === undefined) {
        this._oDialogCodeudor3 = sap.ui.xmlfragment(
          this.getView().getId(),
          "prestamos.ccb.org.solprestamos.view.IdentifCodeudorVHelpEduca",
          this
        );
        this.getView().addDependent(this._oDialogCodeudor3);
      }
      this._oDialogCodeudor3.open();
    },

    /**
     * Selecciona un colaborador de la tabla del diálogo y lo carga en el modelo.
     */
    onCodeudorSelect: function (oEvent) {
      var documento = oEvent.getSource().getBindingContext("educaView").getObject().PERID;
      var nombre = oEvent.getSource().getBindingContext("educaView").getObject().ENAME;
      var numeroEmpleado = oEvent.getSource().getBindingContext("educaView").getObject().PERNR;
      var oViewModel = this.getView().getModel("educaView");

      if (oViewModel !== undefined) {
        oViewModel.setProperty("/nombreCodeudor", nombre);
        oViewModel.setProperty("/numeroEmpleadoCodeudor", numeroEmpleado);
        oViewModel.setProperty("/cedulaCodeudor", documento);
        this._wizard.validateStep(this.byId("step02"));
        MessageToast.show("Codeudor seleccionado: " + nombre);
      }
      if (this._oDialogCodeudor3) {
        this._oDialogCodeudor3.close();
      }
    },

    /**
     * Cierra el diálogo de búsqueda de codeudor.
     */
    onCloseIdentifCodeudorVHelp: function () {
      if (this._oDialogCodeudor3) {
        this._oDialogCodeudor3.close();
      }
    },

    onCrearSolicitud: function () {
      var that = this;
      var oViewModel = this.getView().getModel("educaView");
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
      var iIndexCod = oViewModel.getProperty("/tieneCodeudor");

      // Validar campos obligatorios
      if (!oViewModel.getProperty("/valorSolicitado") || oViewModel.getProperty("/valorSolicitado") <= 0) {
        MessageBox.error("Por favor ingrese un valor solicitado válido.", { title: "Error de validación" });
        return;
      }
      if (!oViewModel.getProperty("/numeroCuotas") || oViewModel.getProperty("/numeroCuotas") <= 0) {
        MessageBox.error("Por favor seleccione un número de cuotas válido.", { title: "Error de validación" });
        return;
      }

      var oPayload = {

        PERNR: "",
        BEGDA: new Date().toISOString().slice(0, 10),
        ENDDA: "9999-12-31",
        DBTCU: "",
        ZWAERS: "COP",
        SUBTY: "",
        DARBT: "",
        DATBW: new Date().toISOString().slice(0, 10),
        ZNUEXT: "",
        ZNOEXT: "",
        ZFORP1: "",
        ZFORPE: "",
        ZTIEPE: "",
        ZVALPE: "",
        ZVALPEE: "",
        ZPORPEE: "",
        ZPORPEC: "",
        ZVALPEC: "",
        ZNUCUPE: "",
        ZVALCOPE: "",
        ZVALSO: "",
        ZVALREPE: "",
        ZNOTITU: "",
        ZNOMFOR: "",
        ZINCIN: "",
        ZINCEX: "",
        ZCODEX: "",
        ZNUCEX: "",
        ZDIREX: "",
        ZTELEX: "" 
      };

      var lv_EmployeeNumber = oViewModel.getProperty("/employeeNumber");
      var lv_IdPrestamo = oViewModel.getProperty("/idPrestamo");
      var lv_ValorPrestamo = oViewModel.getProperty("/valorPrestamo");
      var lv_ValorCuota = oViewModel.getProperty("/ValorCuota");
      var lv_Periodicidad = oViewModel.getProperty("/Periodicidad");
      var lv_OrigenU = oViewModel.getProperty("/OrigenU");
      var lv_DescuentoPrimas = oViewModel.getProperty("/DescuentoPrimas");
      var lv_Porcentaje = oViewModel.getProperty("/PorcentajePrima");
      var lv_ProgramaNIT = oViewModel.getProperty("/programaNIT");
      var lv_ProgramaTitulo = oViewModel.getProperty("/programaTitulo");
      var lv_ProgramaUniversidad = oViewModel.getProperty("/programaUniversidad");
      var lv_ProgramaCarrera = oViewModel.getProperty("/programaCarrera");
      var lv_TieneCodeudor = oViewModel.getProperty("/mostrarCCB") ? "Sí" : (oViewModel.getProperty("/mostrarExterno") ? "No" : "N/A");

      var lv_CedulaCodeudor = oViewModel.getProperty("/cedulaCodeudor");
      var lv_DireccionCodeudor = oViewModel.getProperty("/direccionCodeudor");
      var lv_TelefonoCodeudor = oViewModel.getProperty("/telefonoCodeudor");

      var lv_PERNR = oViewModel.getProperty("/employeeNumber");
      var lv_SUBTY = oPrestamoSeleccionado.PrestamoId;
      var lv_DARBT = oViewModel.getProperty("/valorSolicitado");
      //var lv_DATBW = new Date().toISOString().slice(0, 10);
      var lv_DBTCU = oViewModel.getProperty("/moneda");
      var lv_ZNUEXT = oViewModel.getProperty("/numeroEmpleadoCodeudor");
      var lv_ZNOEXT = oViewModel.getProperty("/nombreCodeudor");
      var lv_ZFORP1 = oViewModel.getProperty("/Nivel");
      var lv_ZFORPE = oViewModel.getProperty("/Nivel");
      var lv_ZTIEPE = oViewModel.getProperty("/tipoEducacion");
      var lv_ZVALPE = oViewModel.getProperty("/valorSolicitado");
      var lv_ZVALPEE = oViewModel.getProperty("/ValorPagar");
      var lv_ZPORPEE = oViewModel.getProperty("/porcPrestamo");
      var lv_ZPORPEC = oViewModel.getProperty("/porcCondonado");
      var lv_ZVALPEC = oViewModel.getProperty("/valorCondonado");
      var lv_ZNUCUPE = oViewModel.getProperty("/numeroCuotas");
      var lv_ZVALCOPE = oViewModel.getProperty("/valorCondonado");
      var lv_ZVALREPE = oViewModel.getProperty("/ValorPagar");
      var lv_ZNOTITU = oViewModel.getProperty("/programaTitulo");
      var lv_ZNOMFOR = oViewModel.getProperty("/programaTitulo");

      if (lv_PERNR && lv_PERNR.trim() !== "") {
        oPayload.PERNR = lv_PERNR;
      } else {

        MessageBox.error(
          "No se identifico numero de personal para el usuario actual"
        );
        return;
      }

      if (lv_SUBTY && lv_SUBTY.trim() !== "") {
        oPayload.SUBTY = lv_SUBTY;
      } else {

        MessageBox.error(
          "No se identifico el tipo de prestamo seleccionado"
        );
        return;
      }

      if (lv_DARBT && lv_DARBT > 0) {
        //oPayload.DARBT =  lv_DARBT;
        oPayload.DARBT = (parseFloat(lv_DARBT) / 100).toFixed(2);
        oPayload.ZVALSO = (parseFloat(lv_DARBT) / 100).toFixed(2);
      } else {

        MessageBox.error(
          "El valor solicitado debe ser mayor a cero"
        );
        return;
      }

      if (lv_DBTCU && lv_DBTCU.trim() !== "") {
        oPayload.DBTCU = lv_DBTCU;
      } else {

        MessageBox.error(
          "No se identifico la moneda para el préstamo"
        );
        return;
      }

      if (iIndexCod == 1) {


        if (lv_ZNOEXT == "" || lv_CedulaCodeudor == "" || lv_DireccionCodeudor == "" || lv_TelefonoCodeudor == "") {

          MessageBox.error(
            "Por favor complete todos los datos del codeudor externo para continuar"
          );
          return;

        } else {
          oPayload.ZINCEX = "X";

          oPayload.ZCODEX = lv_ZNOEXT;
          oPayload.ZNUCEX = lv_CedulaCodeudor;
          oPayload.ZDIREX = lv_DireccionCodeudor;
          oPayload.ZTELEX = lv_TelefonoCodeudor;

        }
      }

      // Se selecciono codeudor interno  
			if (iIndexCod == 0) {

				if (lv_ZNUEXT == "" || lv_ZNUEXT == undefined) {

					MessageBox.error(
						"Por favor seleccione un codeudor  para continuar"
					);
					return;

				} else {
					oPayload.ZINCIN = "X";

					oPayload.ZNUEXT = lv_ZNUEXT;

				}

			}

      if (lv_ZFORP1 && lv_ZFORP1.trim() !== "") {
        oPayload.ZFORP1 = lv_ZFORP1;
        oPayload.ZFORPE = lv_ZFORPE;
      } else {

        MessageBox.error(
          "No se identifico el nivel de estudios seleccionado"
        );
        return;
      }

      if(lv_ZTIEPE && lv_ZTIEPE.trim() !== "") {
        oPayload.ZTIEPE = lv_ZTIEPE;
      } else {

        MessageBox.error(
          "No se identifico el tipo de educación seleccionado"
        );
        return;
      }

      if (lv_ZVALPE && lv_ZVALPE > 0) {
        oPayload.ZVALPE = lv_ZVALPE;
      } else {

        MessageBox.error(
          "El valor solicitado debe ser mayor a cero"
        );
        return;
      }

      if (lv_ZNUCUPE && lv_ZNUCUPE > 0) {
        oPayload.ZNUCUPE = lv_ZNUCUPE;
      } else {

        MessageBox.error(
          "El número de cuotas debe ser mayor a cero"
        );
        return;
      }

      if (lv_ZNOTITU && lv_ZNOTITU.trim() !== "") {
        oPayload.ZNOTITU = lv_ZNOTITU;
      } else {

        MessageBox.error(
          "No se identifico el programa académico seleccionado"
        );
        return;
      }

      if (lv_ZNOMFOR && lv_ZNOMFOR.trim() !== "") {
        oPayload.ZNOMFOR = lv_ZNOMFOR;
      } else {

        MessageBox.error(
          "No se identifico el programa académico seleccionado"
        );
         return;
      } 

      if (lv_ZVALPEE && lv_ZVALPEE > 0) {
        oPayload.ZVALPEE = lv_ZVALPEE;
      } else {

        MessageBox.error(
          "No se ha determinado el valor a pagar"
        );
         return;
      }

      if (lv_ZPORPEE && lv_ZPORPEE > 0) {
        oPayload.ZPORPEE = lv_ZPORPEE;
      }

      if (lv_ZPORPEC && lv_ZPORPEC > 0) {
        oPayload.ZPORPEC = lv_ZPORPEC;
      }

      if (lv_ZVALPEC && lv_ZVALPEC > 0) {
        oPayload.ZVALPEC = (parseFloat(lv_ZVALPEC) / 100).toFixed(2);
      }

      if (lv_ZVALCOPE && lv_ZVALCOPE > 0) {
        oPayload.ZVALCOPE = (parseFloat(lv_ZVALCOPE) / 100).toFixed(2);
      }

      if (lv_ZVALREPE && lv_ZVALREPE > 0) {
        oPayload.ZVALREPE = (parseFloat(lv_ZVALREPE) / 100).toFixed(2);
      }


      var dataService = {
				"n0:ZCOHCMFM_0045GUARDARPRESTAMO": {
					"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
					"IV_PRESTAMO":
						oPayload

				}
			};

			var validateDataService = {
				"n0:ZCOHCMFM_VALIDACIONES": {
					"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
					"GT_PRESTAMOS":
						oPayload

				}
			};

      this._oBackendService.validarSolPrestamo(validateDataService)
				.then(function (oValidResponse) {
					var oValidResult = oValidResponse["n0:ZCOHCMFM_VALIDACIONESResponse"];

					/*
					if (!oValidResult || oValidResult.EV_SUCCESS !== "X") {
						oViewModel.setProperty("/solicitudEnabled", true);
						MessageBox.error(
							(oValidResult && oValidResult.EV_MESSAGE) || "La solicitud no pasó las validaciones.",
							{ title: "Validación fallida" }
						);
						return;
					}
					*/

					//that._oBackendService.guardarPrestamo(dataService)
					that._oBackendService.guardarSolPrestamo(dataService)
						.then(function (oResponse) {
							oViewModel.setProperty("/solicitudEnabled", true);

							var message_success = "";
							// validamos si el servicio nos retorno un mensaje de éxito para mostrarlo,
							// de lo contrario mostramos un mensaje genérico de éxito
							if (oResponse["n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse"].EV_SUCCESS == "X") {

								message_success = oResponse['n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse'].EV_MESSAGE;

								// Extraer el número de solicitud del mensaje (ej: 'Registro guardado correctamente 8000000026')
								var oMatch = message_success.match(/(\d+)$/);
								var sIdSolicitud = oMatch ? oMatch[1] : "";
                /*
								var adjuntosPayload = that.Guardar_adjuntosFrom_idSol(sIdSolicitud);

								if (adjuntosPayload.BIN_SOPORTE_CALAMIDAD.length > 0) {
									var oAdjuntosServiceData = {
										"n0:ZCOHCMFM_GUARDAR_PROCPASIT45": {
											"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
											"PDF_DOCUMENTOS": {
												"item": [
													{
														"UUID": sIdSolicitud,
														"BIN_SOPORTE_CALAMIDAD": adjuntosPayload.BIN_SOPORTE_CALAMIDAD,
														"FILE_NAME_SOPORTE_CALAMIDAD": adjuntosPayload.FILE_NAME_SOPORTE_CALAMIDAD

													}
												]
											}
										}
									};
								}
               


								if (oAdjuntosServiceData != undefined) {
									that._oBackendService.guardarPDFsToSolPrestamo(oAdjuntosServiceData);
								}

                */

							} else {

								message_success = "Solicitud de Préstamo Calamidad creada exitosamente.";

							}

							MessageBox.success(message_success, {
								details: "Monto: " + that._formatCurrency(oPayload.DARBT , oPayload.DBTCU ) +
									"\nCuotas: " + oPayload.ZNUCUPE +
									"\nValor Cuota: " + that._formatCurrency(lv_ValorCuota, oPayload.DBTCU),
								onClose: function () {
									that.onNavBack();
								}
							});
						})
						.catch(function (oError) {
							oViewModel.setProperty("/solicitudEnabled", true);
							MessageBox.error(
								"Error al guardar la solicitud: " + (oError.message || oError.statusText || "Error desconocido"),
								{ title: "Error al guardar" }
							);
						});
				})
				.catch(function (oError) {
					oViewModel.setProperty("/solicitudEnabled", true);
					MessageBox.error(
						"Error al validar la solicitud: " + (oError.message || oError.statusText || "Error desconocido"),
						{ title: "Error de validación" }
					);
				});


      // Aquí se construiría el payload para crear la solicitud de préstamo

    },

    /**
     * Evento cuando cambia la selección de Primas y Bonificaciones
     */
    onChangePrimas3: function (oEvent) {
      var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      var oViewModel = this.getView().getModel("educaView");
      oViewModel.setProperty("/SelectedPrimas", sSelectedKey);

      // Limpiar tabla si se deselecciona
      if (sSelectedKey !== "DESCONTAR_PRIMAS") {
        this.getView().getModel("listprimas3").setProperty("/items", []);
      }
    },

    /**
     * Agrega un registro a la colección listprimas3 llamando al servicio de primas
     */
    onAddPrimas3: function () {
      var that = this;
      var oViewModel = this.getView().getModel("educaView");

      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
      var fValorPagar = oViewModel.getProperty("/ValorPagar");
      var employeenumber = oViewModel.getProperty("/employeeNumber");
      var idPrestamo = oViewModel.getProperty("/idPrestamo");
      var moneda = oViewModel.getProperty("/moneda");
      var porcentajePrima = oViewModel.getProperty("/PorcentajePrima");

      var oViewModelPrimas = this.getView().getModel("listprimas3");
      var aPrimas = oViewModelPrimas.getProperty("/items") || [];
      var NoPrimas = aPrimas.length + 1;

      var dataPrima = {
        "EMPLEADO": employeenumber,
        "VALOR_PRESTAMO": String(fValorPagar),
        "CANTIDAD_PRIMAS": String(NoPrimas),
        "TIPO_PRESTAMO": idPrestamo,
        "PORCENTAJE": porcentajePrima
      };

      this._oBackendService.Add_PrimaService(dataPrima)
        .then(function (oResponse) {
          var aItems = oResponse["n0:ZCOHCMF_PRIMAS_PRESTAMOSResponse"]
            .RESPONSE_INFO_PRIMA.item;
          if (!aItems) {
            MessageToast.show("No se encontraron primas para los datos ingresados");
            return;
          }

          if (!Array.isArray(aItems)) {
            aItems = [aItems];
          }

          var fTotalPrimas = 0;
          var iIdx = 0;
          while (iIdx < aItems.length) {
            var fValorPrima = parseFloat(aItems[iIdx].VALOR_PRIMA) || 0;
            var iValorEntero = Math.trunc(fValorPrima);
            aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
            aItems[iIdx].MONEDA_PRIMA = moneda;
            fTotalPrimas = fTotalPrimas + fValorPrima;
            iIdx = iIdx + 1;
          }

          oViewModel.setProperty("/valorTotalPrimas", fTotalPrimas);
          oViewModel.setProperty("/primasADescontar", aItems);
          that.getView().getModel("listprimas3").setProperty("/items", aItems);


           that._calcularValorPrestamo();         
        
        })
        .catch(function (oError) {
          MessageBox.error(
            "Error al consultar primas: " + (oError.message || oError.statusText || "Error desconocido"),
            { title: "Error" }
          );
        });
    },

    /**
     * Elimina el último registro de la tabla de primas
     */
    onReducePrimas3: function () {
      var that = this;
      var oViewModel = this.getView().getModel("educaView");

      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
      var fValorPagar = oViewModel.getProperty("/ValorPagar");
      var employeenumber = oViewModel.getProperty("/employeeNumber");
      var idPrestamo = oViewModel.getProperty("/idPrestamo");
      var moneda = oViewModel.getProperty("/moneda");
      var porcentajePrima = oViewModel.getProperty("/PorcentajePrima");

      var oViewModelPrimas = this.getView().getModel("listprimas3");
      var aPrimas = oViewModelPrimas.getProperty("/items") || [];
      var aTimes = aPrimas.length;

      if (aTimes === 0) {
        that._calcularValorPrestamo();   
        return;
      }

      if (aTimes === 1) {
        oViewModelPrimas.setProperty("/items", []);
        oViewModel.setProperty("/valorTotalPrimas", 0);
        oViewModel.setProperty("/primasADescontar", []);
        that._calcularValorPrestamo();   
        return;
      }

      var NoPrimas = aTimes - 1;
      var dataPrima = {
        "EMPLEADO": employeenumber,
        "VALOR_PRESTAMO": String(fValorPagar),
        "CANTIDAD_PRIMAS": String(NoPrimas),
        "TIPO_PRESTAMO": idPrestamo,
        "PORCENTAJE": porcentajePrima
      };

      this._oBackendService.Add_PrimaService(dataPrima)
        .then(function (oResponse) {
          var aItems = oResponse["n0:ZCOHCMF_PRIMAS_PRESTAMOSResponse"]
            .RESPONSE_INFO_PRIMA.item;
          if (!aItems) {
            MessageToast.show("No se encontraron primas para los datos ingresados");
            return;
          }

          if (!Array.isArray(aItems)) {
            aItems = [aItems];
          }

          var fTotalPrimas = 0;
          var iIdx = 0;
          while (iIdx < aItems.length) {
            var fValorPrima = parseFloat(aItems[iIdx].VALOR_PRIMA) || 0;
            var iValorEntero = Math.trunc(fValorPrima);
            aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
            aItems[iIdx].MONEDA_PRIMA = moneda;
            fTotalPrimas = fTotalPrimas + fValorPrima;
            iIdx = iIdx + 1;
          }

          oViewModel.setProperty("/valorTotalPrimas", fTotalPrimas);
          oViewModel.setProperty("/primasADescontar", aItems);
          that.getView().getModel("listprimas3").setProperty("/items", aItems);

          that._calcularValorPrestamo();   

        })
        .catch(function (oError) {
          MessageBox.error(
            "Error al consultar primas: " + (oError.message || oError.statusText || "Error desconocido"),
            { title: "Error" }
          );
        });
    },

    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});
