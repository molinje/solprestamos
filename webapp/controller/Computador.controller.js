sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "prestamos/ccb/org/solprestamos/util/BackendService"
], function (Controller, JSONModel, MessageBox, MessageToast, BackendService) {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.Computador", {
    onInit: function () {
      this._oBackendService = new BackendService();
      this._wizard = this.byId("wizardComputador");

      var oViewModel = new JSONModel({
        // Configuración de moneda
        moneda: "COP",

        // Valores monetarios
        montoMaximo: 0,
        valorSolicitado: 0,
        valorPrestamo: 0,
        valorCuota: 0,
        valorDescuentoPrimas: 0,

        // Configuración de cuotas
        selectedCuotas: "",
        numeroCuotas: 0,

        // Destino y descuentos
        selectedDestino: "",
        descuentoPrimas: "NO",

        // Estados de validación
        valorValueState: "None",
        valorValueStateText: "",
        cuotasValueState: "None",
        cuotasValueStateText: "",
        destinoValueState: "None",
        destinoValueStateText: "",

        // Control del botón Crear
        solicitudEnabled: true,

        // Total primas a descontar
        valorTotalPrimas: 0
      });
      this.getView().setModel(oViewModel, "compuView");

      var oPrimasModel = new JSONModel({ items: [] });
      this.getView().setModel(oPrimasModel, "listprimasCompu");

      // Suscribirse al evento de ruta: se dispara cada vez que se navega a esta vista
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteComputador").attachPatternMatched(this._onRouteMatched, this);
    },

    /**
     * Se ejecuta cada vez que el router navega a RouteComputador.
     * Lee el préstamo seleccionado desde globalData (guardado en Viewini).
     * @private
     */
    _onRouteMatched: function () {
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
      var oViewModel = this.getView().getModel("compuView");

      if (oPrestamoSeleccionado && oPrestamoSeleccionado.MontoMaximo) {
       //oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo));
        oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo.replace(/\./g, "")));
      }
    },

    /**
     * Evento cuando se activa el Step 1
     */
    onStep1Activate: function () {
      this._clearValidationStates();
    },

    /**
     * Valida el Step 1 antes de permitir avanzar
     */
    onValidateStep1: function () {
      var oViewModel = this.getView().getModel("compuView");
      var bValid = true;
      var aErrorMessages = [];

      this._clearValidationStates();

      // 1. Validar Valor Solicitado
      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
      if (!fValorSolicitado || fValorSolicitado <= 0) {
        oViewModel.setProperty("/valorValueState", "Error");
        oViewModel.setProperty("/valorValueStateText", "Debe ingresar un valor válido mayor a cero");
        aErrorMessages.push("• Valor Solicitado");
        bValid = false;
      }

      // 2. Validar Cuotas
      var sSelectedCuotas = oViewModel.getProperty("/selectedCuotas");
      if (!sSelectedCuotas || sSelectedCuotas === "") {
        oViewModel.setProperty("/cuotasValueState", "Error");
        oViewModel.setProperty("/cuotasValueStateText", "Debe seleccionar el número de cuotas");
        aErrorMessages.push("• Número de Cuotas");
        bValid = false;
      }

      // 3. Validar Destino
      var sSelectedDestino = oViewModel.getProperty("/selectedDestino");
      if (!sSelectedDestino || sSelectedDestino === "") {
        oViewModel.setProperty("/destinoValueState", "Error");
        oViewModel.setProperty("/destinoValueStateText", "Debe seleccionar el destino del préstamo");
        aErrorMessages.push("• Destino");
        bValid = false;
      }

      if (!bValid) {
        MessageBox.error(
          "Por favor complete los siguientes campos obligatorios:\n\n" +
          aErrorMessages.join("\n"),
          { title: "Campos Obligatorios", styleClass: "sapUiSizeCompact" }
        );
        return;
      }

      var oStep1 = this.byId("stepComput01");
      oStep1.setValidated(true);
      this._wizard.nextStep();

      MessageToast.show("Paso 1 completado correctamente");
    },

    /**
     * Limpia los estados de validación
     * @private
     */
    _clearValidationStates: function () {
      var oViewModel = this.getView().getModel("compuView");
      oViewModel.setProperty("/valorValueState", "None");
      oViewModel.setProperty("/valorValueStateText", "");
      oViewModel.setProperty("/cuotasValueState", "None");
      oViewModel.setProperty("/cuotasValueStateText", "");
      oViewModel.setProperty("/destinoValueState", "None");
      oViewModel.setProperty("/destinoValueStateText", "");
    },

    /**
     * Evento cuando cambia el valor solicitado
     */
    onValorSolicitadoChange: function (oEvent) {
      var oViewModel = this.getView().getModel("compuView");
      var sValue = oEvent.getParameter("value");
      var fValorSolicitado = this._parseMoneyValue(sValue);

      oViewModel.setProperty("/valorSolicitado", fValorSolicitado);

      var fMontoMaximo = oViewModel.getProperty("/montoMaximo");
      if (fMontoMaximo > 0 && fValorSolicitado > fMontoMaximo) {
        MessageBox.warning(
          "El valor solicitado excede el monto máximo permitido de " +
          this._formatCurrency(fMontoMaximo, "COP"),
          { title: "Valor Excedido" }
        );
        oViewModel.setProperty("/valorSolicitado", fMontoMaximo);
        return;
      }

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
      var oViewModel = this.getView().getModel("compuView");
      var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

      oViewModel.setProperty("/selectedCuotas", sSelectedKey);
      oViewModel.setProperty("/numeroCuotas", parseInt(sSelectedKey));

      if (sSelectedKey) {
        oViewModel.setProperty("/cuotasValueState", "None");
        oViewModel.setProperty("/cuotasValueStateText", "");
      }

      this._calcularValorPrestamo();
    },

    /**
     * Evento cuando cambia el destino
     */
    onDestinoChange: function (oEvent) {
      var oViewModel = this.getView().getModel("compuView");
      var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

      oViewModel.setProperty("/selectedDestino", sSelectedKey);

      if (sSelectedKey) {
        oViewModel.setProperty("/destinoValueState", "None");
        oViewModel.setProperty("/destinoValueStateText", "");
      }
    },

    /**
     * Calcula el valor de la cuota mensual dividiendo el monto total entre el número de cuotas (sin intereses)
     * @private
     */
    _calcularValorPrestamo: function () {
      var oViewModel = this.getView().getModel("compuView");

      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
      var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;

      if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
        oViewModel.setProperty("/valorPrestamo", 0);
        oViewModel.setProperty("/valorCuota", 0);
        oViewModel.setProperty("/valorDescuentoPrimas", 0);
        return;
      }

      var fValorCuota = Math.round(fValorSolicitado / iNumeroCuotas);

      oViewModel.setProperty("/valorPrestamo", Math.round(fValorSolicitado));
      oViewModel.setProperty("/valorCuota", fValorCuota);

      this._calcularDescuentoPrimas();

      MessageToast.show("Cuota mensual: " + this._formatCurrency(fValorCuota, "COP"));
    },

    /**
     * Calcula el valor de descuento en primas
     * @private
     */
    _calcularDescuentoPrimas: function () {
      var oViewModel = this.getView().getModel("compuView");
      var sDescuentoPrimas = oViewModel.getProperty("/descuentoPrimas");
      var fValorCuota = oViewModel.getProperty("/valorCuota") || 0;

      var fValorDescuento = (sDescuentoPrimas === "SI" && fValorCuota > 0) ? fValorCuota : 0;
      oViewModel.setProperty("/valorDescuentoPrimas", fValorDescuento);
    },

    /**
     * Parsea un valor monetario formateado a número
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
     * Formatea un número como moneda COP
     * @private
     */
    _formatCurrency: function (fValue, sCurrency) {
      var oFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
        currencyCode: true,
        maxFractionDigits: 0
      });
      return oFormat.format(fValue, sCurrency);
    },

    onWizardComplete: function () {
      MessageToast.show("Wizard completado");
    },

    /**
     * Carga de archivos completa
     */
    onUploadComplete: function () {
      MessageToast.show("Documento cargado exitosamente");
    },

    /**
     * Crea la solicitud de préstamo computador
     */
    onCrearSolicitud: function () {
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
      var oUserData = oGlobalModel.getProperty("/userData");

      var dataSolic = {
        SUBTY: "",
        DARBT: 0,
        PERNR: "",
        ENDDA: "9999-12-31",
        BEGDA: new Date().toISOString().slice(0, 10),
        DBTCU: "COP",
        ZWAERS: "COP",
        ZMOCA: "",
        ZVALSO: "",
        ZNUCUCA: "",
        NUM_COUTAS: 0,
        ZDESTINO: "",
        ZDESCPRIMAS: "",
        DATBW: new Date().toISOString().slice(0, 10)
      };

      if (oPrestamoSeleccionado.PrestamoId) {
				// tiene valor
				dataSolic.SUBTY = oPrestamoSeleccionado.PrestamoId;
			}

      if (oUserData && oUserData.PERNR != undefined) {
        dataSolic.PERNR = oUserData.PERNR;
      } else {
        MessageBox.error("No se identificó número de personal para el usuario actual");
        return;
      }

      var that = this;
      var oViewModel = this.getView().getModel("compuView");
      var oData = oViewModel.getData();

      if (oData.valorPrestamo > 0) {
       // dataSolic.DARBT = oData.valorPrestamo;
        //dataSolic.ZVALSO = oData.valorPrestamo;
        dataSolic.DARBT = (parseFloat(oData.valorPrestamo) / 100).toFixed(2);
				dataSolic.ZVALSO = (parseFloat(oData.valorPrestamo) / 100).toFixed(2);
      } else {
        MessageBox.error("Por favor registre el valor a solicitar");
        return;
      }

      if (oData.numeroCuotas > 0) {
        dataSolic.ZNUCUCA = oData.numeroCuotas;
        dataSolic.NUM_COUTAS = oData.numeroCuotas;
      } else {
        MessageBox.error("Por favor registre el número de cuotas");
        return;
      }

      if (!oData.selectedDestino || oData.selectedDestino === "") {
        MessageBox.error("Por favor seleccione el destino del préstamo");
        return;
      }

      dataSolic.ZDESTINO = oData.selectedDestino;
      dataSolic.ZDESCPRIMAS = oData.descuentoPrimas;

      oViewModel.setProperty("/solicitudEnabled", false);

      var dataService = {
        "n0:ZCOHCMFM_0045GUARDARPRESTAMO": {
          "-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
          "IV_PRESTAMO": dataSolic
        }
      };

      var validateDataService = {
        "n0:ZCOHCMFM_VALIDACIONES": {
          "-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
          "GT_PRESTAMOS": dataSolic
        }
      };

      that._oBackendService.validarSolPrestamo(validateDataService)
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
          that._oBackendService.guardarSolPrestamo(dataService)
            .then(function (oResponse) {
              oViewModel.setProperty("/solicitudEnabled", true);

              var message_success = "";
              if (oResponse["n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse"].EV_SUCCESS == "X") {
                message_success = oResponse["n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse"].EV_MESSAGE;
              } else {
                message_success = "Solicitud de Préstamo Computador creada exitosamente.";
              }

              MessageBox.success(message_success, {
                details: "Monto: " + that._formatCurrency(oData.valorPrestamo, oData.moneda) +
                  "\nCuotas: " + oData.numeroCuotas +
                  "\nValor Cuota: " + that._formatCurrency(oData.valorCuota, oData.moneda) +
                  "\nDestino: " + (oData.selectedDestino === "01" ? "Colaborador" : "Proveedor"),
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
    },

    /**
     * Agrega una prima consultando el servicio Add_PrimaService
     */
    onAddPrimas: function () {
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var oUserData = oGlobalModel.getProperty("/userData");
      var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");

      var oViewModel = this.getView().getModel("compuView");
      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
      var moneda = oViewModel.getProperty("/moneda");
      var employeenumber = oUserData ? oUserData.PERNR : "";
      var idPrestamo = oPrestamoSeleccionado ? oPrestamoSeleccionado.PrestamoId : "";

      var oViewModelPrimas = this.getView().getModel("listprimasCompu");
      var aPrimas = oViewModelPrimas.getProperty("/items") || [];
      var NoPrimas = aPrimas.length + 1;

      var dataPrima = {
        "EMPLEADO": employeenumber,
        "VALOR_PRESTAMO": String(fValorSolicitado),
        "CANTIDAD_PRIMAS": String(NoPrimas),
        "TIPO_PRESTAMO": idPrestamo,
        "PORCENTAJE": "50"
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
            var iValorEntero = Math.trunc(fValorPrima * 100);
            aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
            aItems[iIdx].MONEDA_PRIMA = moneda;
            fTotalPrimas = fTotalPrimas + fValorPrima;
            iIdx = iIdx + 1;
          }
          oViewModel.setProperty("/valorTotalPrimas", fTotalPrimas);
          oViewModel.setProperty("/primasADescontar", aItems);
          oViewModelPrimas.setProperty("/items", aItems);
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
    onReducePrimas: function () {
      var oViewModelPrimas = this.getView().getModel("listprimasCompu");
      var aPrimas = oViewModelPrimas.getProperty("/items") || [];
      if (aPrimas.length > 0) {
        aPrimas.pop();
        oViewModelPrimas.setProperty("/items", aPrimas);
      }
    },

    /**
     * Navega hacia atrás
     */
    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});
