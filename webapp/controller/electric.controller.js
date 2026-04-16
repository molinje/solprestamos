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

				// Estados de validación
				cuotasValueState: "None",
				cuotasValueStateText: "",
				valorValueState: "None",
				valorValueStateText: "",

				// Propiedades de cálculo expuestas para bindings de la vista
				ValorCuotaMelectric: 0,
				ValorPrestamoMelectric: 0,
				ValorDescPrimasMelectric: 0,

				// Descuento en primas
				descuentoPrimas: "NO",

				// Total primas a descontar
				valorTotalPrimas: 0,

				// Control del botón Crear
				solicitudEnabled: true,

				// Opciones de cuotas (se construye dinámicamente en _onRouteMatched)
				CuotasCollection: []
			});

			this.getView().setModel(oViewModel, "movelectricView");

			var oPrimasModel = new JSONModel({ items: [] });
			this.getView().setModel(oPrimasModel, "listprimasElectric");

			// Suscribirse al evento de ruta: se dispara cada vez que se navega a esta vista
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("Routeelectric").attachPatternMatched(this._onRouteMatched, this);
		},

		/**
		 * Se ejecuta cada vez que el router navega a Routeelectric.
		 * Lee el préstamo seleccionado desde globalData (guardado en Viewini).
		 * @private
		 */
		_onRouteMatched: function () {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
			var oViewModel = this.getView().getModel("movelectricView");

			if (oPrestamoSeleccionado && oPrestamoSeleccionado.MontoMaximo) {
				//oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo));
				oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo.replace(/\./g, "")));
			}

			// Construir CuotasCollection dinámicamente según oPrestamoSeleccionado.Cuotas
			// El valor llega como string con ceros a la izquierda, ej: "0018" → 18 cuotas
			var iMaxCuotas = oPrestamoSeleccionado && oPrestamoSeleccionado.Cuotas
				? parseInt(oPrestamoSeleccionado.Cuotas, 10)
				: 12;
			var aCuotasCollection = [];
			for (var i = 1; i <= iMaxCuotas; i++) {
				aCuotasCollection.push({ CuotasId: String(i), Name: String(i) });
			}
			oViewModel.setProperty("/CuotasCollection", aCuotasCollection);
		},

		/**
		 * Reinicializa el modelo movelectricView con los valores iniciales del onInit.
		 */
		_resetMovelectricView: function () {
			var oViewModel = this.getView().getModel("movelectricView");
			oViewModel.setData({
				moneda: "COP",
				montoMaximo: 0,
				valorSolicitado: 0,
				valorPrestamo: 0,
				valorCuota: 0,
				selectedCuotas: "",
				numeroCuotas: 0,
				cuotasValueState: "None",
				cuotasValueStateText: "",
				valorValueState: "None",
				valorValueStateText: "",
				ValorCuotaMelectric: 0,
				ValorPrestamoMelectric: 0,
				ValorDescPrimasMelectric: 0,
				descuentoPrimas: "NO",
				valorTotalPrimas: 0,
				solicitudEnabled: true,
				CuotasCollection: []
			});
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
		 * Calcula el valor de la cuota mensual dividiendo el monto total entre el número de cuotas (sin intereses)
		 * @private
		 */
		_calcularValorPrestamo: function () {
			var oViewModel = this.getView().getModel("movelectricView");

			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
			var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;

			if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
				oViewModel.setProperty("/valorPrestamo", 0);
				oViewModel.setProperty("/valorCuota", 0);
				oViewModel.setProperty("/ValorPrestamoMelectric", 0);
				oViewModel.setProperty("/ValorCuotaMelectric", 0);
				return;
			}

			var fValorCuota = Math.round(fValorSolicitado / iNumeroCuotas);

			oViewModel.setProperty("/valorPrestamo", Math.round(fValorSolicitado));
			oViewModel.setProperty("/valorCuota", fValorCuota);
			oViewModel.setProperty("/ValorPrestamoMelectric", Math.round(fValorSolicitado));
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
			 var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
			var oUserData = oGlobalModel.getProperty("/userData");

			var dataSolic = {
				SUBTY: "",
				DARBT: 0,
				VALOR_POR_MES: 0,
				PERNR: "",
				ENDDA: "9999-12-31",
				//BEGDA: new Date().toISOString().slice(0, 10),
				DBTCU: "COP",
				ZWAERS: "COP",
				ZMOCA: "",
				ZVALSO: "",
				ZNUCUCA: "",
				NUM_COUTAS: 0,
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
			var oViewModel = this.getView().getModel("movelectricView");
			var oData = oViewModel.getData();

			if (oData.valorPrestamo > 0) {
				//dataSolic.DARBT = oData.valorPrestamo;
				//dataSolic.ZVALSO = oData.valorPrestamo;
				dataSolic.DARBT = (parseFloat(oData.valorPrestamo) / 100).toFixed(2);
				dataSolic.ZVALSO = (parseFloat(oData.valorPrestamo) / 100).toFixed(2);
				dataSolic.VALOR_POR_MES = (parseFloat(oData.valorCuota) / 100).toFixed(2) || "0.00";
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

					// Evaluar errores en RESPONSE.item — si algún registro tiene TYPE "E", detener y mostrar mensajes de error
					var aItems = oValidResult && oValidResult.RESPONSE && oValidResult.RESPONSE.item;
					if (!Array.isArray(aItems)) {
						aItems = aItems ? [aItems] : [];
					}
					var aErrores = aItems.filter(function (oItem) { return oItem.TYPE === "E"; });
					if (aErrores.length > 0) {
						oViewModel.setProperty("/solicitudEnabled", true);
						var sMensajes = aErrores.map(function (oItem) { return oItem.MESSAGE; }).join("\n");
						MessageBox.error(sMensajes, { title: "Validación fallida" });
						return;
					}

					that._oBackendService.guardarSolPrestamo(dataService)
						.then(function (oResponse) {
							oViewModel.setProperty("/solicitudEnabled", true);

							var oRespData = oResponse["n0:ZCOHCMFM_0045GUARDARPRESTAMOResponse"];
							var message_success = "";
							var sIdSolicitud = "";

							if (oRespData.EV_SUCCESS == "X") {
								message_success = oRespData.EV_MESSAGE;
								var oMatch = message_success.match(/(\d+)$/);
								sIdSolicitud = oMatch ? oMatch[1] : "";
							} else {
								message_success = "Solicitud de Préstamo Movilidad Eléctrica creada exitosamente.";
							}

							// Guardar primas si la solicitud fue creada y existen primas cargadas
							var aPrimas = that.getView().getModel("listprimasElectric").getProperty("/items") || [];
							if (sIdSolicitud && aPrimas.length > 0) {
								that.GuardarPrimas(sIdSolicitud, oUserData.PERNR)
									.catch(function (oError) {
										MessageBox.error(
											"Error al guardar primas: " + (oError.message || oError.statusText || "Error desconocido"),
											{ title: "Error al guardar primas" }
										);
									});
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

			var oViewModel = this.getView().getModel("movelectricView");
			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
			var moneda = oViewModel.getProperty("/moneda");
			var employeenumber = oUserData ? oUserData.PERNR : "";
			var idPrestamo = oPrestamoSeleccionado ? oPrestamoSeleccionado.PrestamoId : "";

			var oViewModelPrimas = this.getView().getModel("listprimasElectric");
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
						var iValorEntero = Math.trunc(fValorPrima);
						aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
						aItems[iIdx].MONEDA_PRIMA = moneda;
						fTotalPrimas = fTotalPrimas + fValorPrima;
						iIdx = iIdx + 1;
					}
					oViewModel.setProperty("/valorTotalPrimas", fTotalPrimas);
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
			var that = this;

			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oUserData = oGlobalModel.getProperty("/userData");
			var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");

			var oViewModel = this.getView().getModel("movelectricView");
			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
			var moneda = oViewModel.getProperty("/moneda");
			var employeenumber = oUserData ? oUserData.PERNR : "";
			var idPrestamo = oPrestamoSeleccionado ? oPrestamoSeleccionado.PrestamoId : "";

			var oViewModelPrimas = this.getView().getModel("listprimasElectric");
			var aPrimas = oViewModelPrimas.getProperty("/items") || [];
			var aTimes = aPrimas.length;

			if (aTimes === 0) {
				return;
			}

			if (aTimes === 1) {
				oViewModelPrimas.setProperty("/items", []);
				oViewModel.setProperty("/valorTotalPrimas", 0);
				that._calcularValorPrestamo();
				return;
			}

			var NoPrimas = aTimes - 1;
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
						var iValorEntero = Math.trunc(fValorPrima);
						aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
						aItems[iIdx].MONEDA_PRIMA = moneda;
						fTotalPrimas = fTotalPrimas + fValorPrima;
						iIdx = iIdx + 1;
					}

					oViewModel.setProperty("/valorTotalPrimas", fTotalPrimas);
					oViewModelPrimas.setProperty("/items", aItems);

					if (fTotalPrimas > 0) {
						that._calcularValorPrestamo();
					}
				})
				.catch(function (oError) {
					MessageBox.error(
						"Error al consultar primas: " + (oError.message || oError.statusText || "Error desconocido"),
						{ title: "Error" }
					);
				});
		},

		/**
		 * Guarda las primas asociadas a una solicitud enviándolas al backend.
		 * @param {string} NumSolicitud - Número/UUID de la solicitud
		 * @param {string} NumEmpleado  - Número de empleado
		 * @returns {Promise} Promise que resuelve con la respuesta del servicio
		 */
		GuardarPrimas: function (NumSolicitud, NumEmpleado) {
			var aItems = this.getView().getModel("listprimasElectric").getProperty("/items") || [];

			var jsonprimas = aItems.map(function (oItem) {
				return {
					"UUID": NumSolicitud,
					"EMPLEADO": NumEmpleado,
					"FECHA_PRIMA": oItem.FECHA_PRIMA || "",
					"VALOR_PRIMA": oItem.VALOR_PRIMA || ""
				};
			});

			return this._oBackendService.guardarPrimas(jsonprimas);
		},

		onNavBack: function () {
			this._resetMovelectricView();
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteViewini");
		}
	});
});
