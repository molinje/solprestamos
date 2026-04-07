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
        Porcentaje: "",

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
               (oP.NAME1  && oP.NAME1.toLowerCase().indexOf(sQueryLower)  !== -1) ||
               (oP.NAME2  && oP.NAME2.toLowerCase().indexOf(sQueryLower)  !== -1);
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

      var sTitulo      = oItem.getText();
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
      oViewModel.setProperty("/programaNIT",         oPrograma.NIT);
      oViewModel.setProperty("/programaTitulo",      oPrograma.TITULO);
      oViewModel.setProperty("/programaUniversidad", oPrograma.NAME1);
      oViewModel.setProperty("/programaCarrera",     oPrograma.NAME2);
      oViewModel.setProperty("/programaBusqueda",    oPrograma.TITULO + " — " + oPrograma.NAME1);
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

      if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
        oViewModel.setProperty("/valorPrestamo", 0);
        oViewModel.setProperty("/ValorPagar", 0);
        oViewModel.setProperty("/ValorCuota", 0);
        return;
      }

      oViewModel.setProperty("/valorPrestamo", Math.round(fValorSolicitado));

      oViewModel.setProperty("/ValorPagar", Math.round(fValorPagar));

      if ((fValorPagar > 0 && iNumeroCuotas > 0 ) && ( fValorPagar > iNumeroCuotas)) {
        var fValorCuota = Math.round(fValorPagar / iNumeroCuotas);
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
          "prestamos.ccb.org.solprestamos.view.IdentifCodeudorVHelp",
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

    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});
