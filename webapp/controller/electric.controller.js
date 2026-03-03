sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"prestamos/ccb/org/solprestamos/util/BackendService"
], function (Controller, JSONModel, MessageBox, MessageToast, BackendService) {
	"use strict";

	return Controller.extend("prestamos.ccb.org.solprestamos.controller.electric", {

		onInit: function () {
			this._oBackendService = new BackendService();
			this._wizard = this.byId("wizardelectric");

			// Modelo de datos para la vista Movilidad Eléctrica
			var oViewModel = new JSONModel({
				// Configuración de moneda
				moneda: "COP",

				// Valores monetarios
				montoMaximo: 0,
				valorSolicitado: 0,
				valorPrestamo: 0,
				valorCuota: 0,

				// Configuración de cuotas
				selectedCuotas: "",
				numeroCuotas: 0,
				tasaInteres: 0.015,

				// Estados de validación
				cuotasValueState: "None",
				cuotasValueStateText: "",
				valorValueState: "None",
				valorValueStateText: "",

				// Propiedades de cálculo expuestas para bindings de la vista
				ValorCuotaMelectric: 0,
				ValorPrestamoMelectric: 0,
				ValorDescPrimasMelectric: 0,

				// Control del botón Crear
				solicitudEnabled: true
			});

			this.getView().setModel(oViewModel, "movelectricView");

			// Obtener monto máximo desde los datos globales del usuario (tipo "02" = Movilidad Eléctrica)
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oUserData = oGlobalModel.getProperty("/userData");
			if (oUserData && oUserData.LIST_PREST && oUserData.LIST_PREST.item) {
				var aPrestamosList = Array.isArray(oUserData.LIST_PREST.item)
					? oUserData.LIST_PREST.item
					: [oUserData.LIST_PREST.item];
				var oPrestamo = aPrestamosList.find(function (item) { return item.TIPO === "02"; });
				if (oPrestamo && oPrestamo.MONTO_MAXIMO) {
					oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamo.MONTO_MAXIMO));
				}
			}
		},

		/**
		 * Evento cuando cambia el número de cuotas
		 */
		onCuotasChange: function (oEvent) {
			var oViewModel = this.getView().getModel("movelectricView");
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
		 * Evento cuando cambia el valor solicitado
		 */
		onValorSolicitadoChange: function (oEvent) {
			var oViewModel = this.getView().getModel("movelectricView");
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
		 * Calcula el valor del préstamo y la cuota mensual (sistema francés)
		 * @private
		 */
		_calcularValorPrestamo: function () {
			var oViewModel = this.getView().getModel("movelectricView");

			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
			var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;
			var fTasaInteres = oViewModel.getProperty("/tasaInteres") || 0;

			if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
				oViewModel.setProperty("/valorPrestamo", 0);
				oViewModel.setProperty("/valorCuota", 0);
				oViewModel.setProperty("/ValorPrestamoMelectric", 0);
				oViewModel.setProperty("/ValorCuotaMelectric", 0);
				return;
			}

			var fValorPrestamo = fValorSolicitado;
			var fValorCuota;

			if (fTasaInteres > 0) {
				// Fórmula francesa de amortización
				var numerador = fTasaInteres * Math.pow(1 + fTasaInteres, iNumeroCuotas);
				var denominador = Math.pow(1 + fTasaInteres, iNumeroCuotas) - 1;
				fValorCuota = fValorPrestamo * (numerador / denominador);
			} else {
				fValorCuota = fValorPrestamo / iNumeroCuotas;
			}

			fValorPrestamo = Math.round(fValorPrestamo);
			fValorCuota = Math.round(fValorCuota);

			oViewModel.setProperty("/valorPrestamo", fValorPrestamo);
			oViewModel.setProperty("/valorCuota", fValorCuota);
			oViewModel.setProperty("/ValorPrestamoMelectric", fValorPrestamo);
			oViewModel.setProperty("/ValorCuotaMelectric", fValorCuota);

			MessageToast.show("Cuota mensual: " + this._formatCurrency(fValorCuota, "COP"));
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

		/**
		 * Valida el Step 1 antes de avanzar
		 */
		onValidateStep1: function () {
			var oViewModel = this.getView().getModel("movelectricView");
			var bValid = true;
			var aErrorMessages = [];

			// Limpiar estados anteriores
			oViewModel.setProperty("/cuotasValueState", "None");
			oViewModel.setProperty("/cuotasValueStateText", "");
			oViewModel.setProperty("/valorValueState", "None");
			oViewModel.setProperty("/valorValueStateText", "");

			// Validar cuotas
			var sSelectedCuotas = oViewModel.getProperty("/selectedCuotas");
			if (!sSelectedCuotas || sSelectedCuotas === "") {
				oViewModel.setProperty("/cuotasValueState", "Error");
				oViewModel.setProperty("/cuotasValueStateText", "Debe seleccionar el número de cuotas");
				aErrorMessages.push("• Cuotas");
				bValid = false;
			}

			// Validar valor solicitado
			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
			if (!fValorSolicitado || fValorSolicitado <= 0) {
				oViewModel.setProperty("/valorValueState", "Error");
				oViewModel.setProperty("/valorValueStateText", "Debe ingresar un valor válido");
				aErrorMessages.push("• Valor solicitado");
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

			var oWizard = this.byId("wizardelectric");
			var oStep1 = this.byId("stepelectric01");
			oStep1.setValidated(true);
			oWizard.nextStep();

			MessageToast.show("Paso 1 completado correctamente");
		},

		onWizardComplete: function () {
			MessageToast.show("Wizard completado");
		},

		/**
		 * Crea la solicitud de Préstamo Movilidad Eléctrica
		 */
		onCrearSolicitud: function () {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oUserData = oGlobalModel.getProperty("/userData");

			var dataSolic = {
				DARBT: 0,
				PERNR: "",
				DBTCU: "COP",
				ZCODEX: "",
				ZNUCEX: "",
				ZDIREX: "",
				ZTELEX: "",
				ZMOCA: "",
				ZVALSO: "",
				ZNUCUCA: ""
			};

			if (oUserData && oUserData.PERNR != undefined) {
				dataSolic.PERNR = oUserData.PERNR;
			} else {
				MessageBox.error("No se identificó número de personal para el usuario actual");
				return;
			}

			var that = this;
			var oViewModel = this.getView().getModel("movelectricView");
			var oData = oViewModel.getData();

			if (oData.valorPrestamo > 0) {
				dataSolic.DARBT = oData.valorPrestamo;
				dataSolic.ZVALSO = oData.valorPrestamo;
			} else {
				MessageBox.error("Por favor registre el valor a solicitar");
				return;
			}

			if (oData.numeroCuotas > 0) {
				dataSolic.ZNUCUCA = oData.numeroCuotas;
			} else {
				MessageBox.error("Por favor registre el número de cuotas");
				return;
			}

			oViewModel.setProperty("/solicitudEnabled", false);

			var dataService = {
				"n0:ZCOHCMFM_0045GUARDARPRESTAMO": {
					"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
					"IV_PRESTAMO": dataSolic
				}
			};

			that._oBackendService.guardarSolPrestamo(dataService)
				.then(function (oResponse) {
					oViewModel.setProperty("/solicitudEnabled", true);

					var message_success = "";
					if (oResponse["n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse"].EV_SUCCESS == "X") {
						message_success = oResponse["n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse"].EV_MESSAGE;
					} else {
						message_success = "Solicitud de Préstamo Movilidad Eléctrica creada exitosamente.";
					}

					MessageBox.success(message_success, {
						details: "Monto: " + that._formatCurrency(oData.valorPrestamo, oData.moneda) +
							"\nCuotas: " + oData.numeroCuotas +
							"\nValor Cuota: " + that._formatCurrency(oData.valorCuota, oData.moneda),
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
		},

		onNavBack: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteViewini");
		}
	});
});
