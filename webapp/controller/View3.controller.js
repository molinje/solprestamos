sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/ListItem"
], function (Controller, JSONModel, MessageBox, MessageToast, ListItem) {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.View3", {
    onInit: function () {
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
        DescuentoPrimas: "NO",
        Porcentaje: "",

        // Estados de validación
        valorValueState: "None",
        valorValueStateText: "",
        cuotasValueState: "None",
        cuotasValueStateText: "",

        // Otros
        tieneCodeudor: -1,
        numeroDocumento: "",
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
      this.byId("selectProgPregado").removeAllSuggestionItems();
      oViewModel.setProperty("/programaBusqueda", "");
      oViewModel.setProperty("/programaTitulo", "");
      oViewModel.setProperty("/programaUniversidad", "");
      oViewModel.setProperty("/programaCarrera", "");
      oViewModel.setProperty("/programaNIT", "");
    },

    /**
     * Filtra programasPregrado mientras el usuario escribe en el buscador.
     * Crea los items manualmente para evitar desfases de índice con binding dinámico.
     * Busca coincidencias en TITULO, NAME1 y NAME2 (case-insensitive, contiene).
     */
    onSuggestPrograma: function (oEvent) {
      var sQuery = oEvent.getParameter("suggestValue");
      var oInput = oEvent.getSource();
      var oViewModel = this.getView().getModel("educaView");
      var aProgramas = oViewModel.getProperty("/programasPregrado") || [];

      // Limpiar items anteriores antes de agregar los nuevos
      oInput.removeAllSuggestionItems();

      if (!sQuery || sQuery.trim() === "") {
        return;
      }

      var sQueryLower = sQuery.trim().toLowerCase();
      aProgramas
        .filter(function (oP) {
          return (oP.TITULO && oP.TITULO.toLowerCase().indexOf(sQueryLower) !== -1) ||
                 (oP.NAME1  && oP.NAME1.toLowerCase().indexOf(sQueryLower)  !== -1) ||
                 (oP.NAME2  && oP.NAME2.toLowerCase().indexOf(sQueryLower)  !== -1);
        })
        .forEach(function (oP) {
          oInput.addSuggestionItem(new ListItem({
            key: oP.NIT,
            text: oP.TITULO,
            additionalText: oP.NAME1
          }));
        });
    },

    /**
     * Rellena los inputs de solo lectura con los datos del programa seleccionado.
     */
    onProgramaSeleccionado: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (!oItem) { return; }

      var sNIT = oItem.getKey();
      var oViewModel = this.getView().getModel("educaView");
      var aProgramas = oViewModel.getProperty("/programasPregrado") || [];

      var oPrograma = aProgramas.find(function (oP) { return oP.NIT === sNIT; });
      if (!oPrograma) { return; }

      oViewModel.setProperty("/programaNIT",        oPrograma.NIT);
      oViewModel.setProperty("/programaTitulo",     oPrograma.TITULO);
      oViewModel.setProperty("/programaUniversidad", oPrograma.NAME1);
      oViewModel.setProperty("/programaCarrera",    oPrograma.NAME2);
      // Mostrar en el input de búsqueda el texto seleccionado
      oViewModel.setProperty("/programaBusqueda",   oPrograma.TITULO + " — " + oPrograma.NAME1);
    },

    /**
     * Evento cuando cambia el valor solicitado
     */
    onValorSolicitadoChange: function (oEvent) {
      var oViewModel = this.getView().getModel("educaView");

      var sValue = oEvent.getParameter("value");
      var fValorSolicitado = this._parseMoneyValue(sValue);

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

      this._calcularValorPrestamo();
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

      if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
        oViewModel.setProperty("/valorPrestamo", 0);
        oViewModel.setProperty("/ValorPagar", 0);
        oViewModel.setProperty("/ValorCuota", 0);
        return;
      }

      var fValorCuota = Math.round(fValorSolicitado / iNumeroCuotas);

      oViewModel.setProperty("/valorPrestamo", Math.round(fValorSolicitado));
      oViewModel.setProperty("/ValorPagar", Math.round(fValorSolicitado));
      oViewModel.setProperty("/ValorCuota", fValorCuota);

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

    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});
