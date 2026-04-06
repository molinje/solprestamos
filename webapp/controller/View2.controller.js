sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"prestamos/ccb/org/solprestamos/util/BackendService"
], (Controller, JSONModel, MessageBox, MessageToast, Fragment, BackendService) => {
	"use strict";

	return Controller.extend("prestamos.ccb.org.solprestamos.controller.View2", {
		onInit() {
			// Inicialización del controlador View2
			// Controller Calamidad

			var gt_codeudores = {};
			var that = this;

			this._oBackendService = new BackendService();

			this._wizard = this.byId("wizardCalam");


			// Obtener el modelo
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			if (oGlobalModel) {
				var oUserData = oGlobalModel.getProperty("/userData");
				var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
			}

			// Modelo de datos para la vista
			var oViewModel = new JSONModel({

				// Datos del usuario
				employeeNumber: oUserData ? oUserData.PERNR : "",
				idPrestamo: oPrestamoSeleccionado ? oPrestamoSeleccionado.PrestamoId : "",
				// Configuración de moneda
				moneda: "COP",              // Código de moneda (Peso Colombiano)

				// Valores monetarios
				montoMaximo: 0,             // Monto máximo a solicitar (se carga desde globalData al navegar)
				valorSolicitado: 0,         // Valor que ingresa el usuario
				valorPrestamo: 0,           // Valor calculado del préstamo
				valorCuota: 0,              // Valor de cada cuota
				valorComprometido: 0,       // Valor comprometido
				valorTotalPrimas: 0,         // Valor total de primas a descontar

				// Configuración de cuotas
				selectedCuotas: "",         // Cuotas seleccionadas
				numeroCuotas: 0,            // Número de cuotas (numérico)

				// Estados de validación para los campos obligatorios
				cuotasValueState: "None",           // Estado de validación de cuotas
				cuotasValueStateText: "",           // Mensaje de error de cuotas
				valorValueState: "None",            // Estado de validación de valor
				valorValueStateText: "",            // Mensaje de error de valor
				motivoValueState: "None",           // Estado de validación de motivo
				motivoValueStateText: "",           // Mensaje de error de motivo

				// Visibilidad de campos del codeudor
				mostrarCCB: false,
				mostrarExterno: false,

				// Otros campos
				tieneCodeudor: -1,
				numeroDocumento: "",
				docBusqueda: "",
				nombreCodeudor: "",
				cedulaCodeudor: "",
				direccionCodeudor: "",
				telefonoCodeudor: "",
				fecha: "",
				selectedMotCalamidad: "",
				SelectedPrimas: "NO_APLICA",
				primasADescontar: [],
				solicitudEnabled: true,
				adjuntos: [],

			});

			if (gt_codeudores != undefined) {

				oViewModel.setProperty("/Codeudores", gt_codeudores);
			}
			this.getView().setModel(oViewModel, "calamView");

			// Modelo para la colección de primas a descontar
			var oPrimasModel = new JSONModel({ items: [] });
			this.getView().setModel(oPrimasModel, "listprimas");

			// Suscribirse al evento de ruta: se dispara cada vez que se navega a esta vista
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("RouteView2").attachPatternMatched(this._onRouteMatched, this);


			if (oGlobalModel.oData.gt_motcalamidad != undefined) {

				var gt_motcalamidad = oGlobalModel.oData.gt_motcalamidad;

				var oCalamidadModel = new JSONModel({
					gt_motcalamidad: gt_motcalamidad
				});

				// Aquí 'this' funciona porque usamos .bind(this) abajo
				this.getView().setModel(oCalamidadModel, "pcalamidad");

			}

			var oData = {
				"SelectedCuotas": "SP-1001",

				"CuotasCollection": [
					{
						"CuotasId": "01",
						"Name": "1"
					},
					{
						"CuotasId": "02",
						"Name": "2"
					},
					{
						"CuotasId": "03",
						"Name": "3"
					},
					{
						"CuotasId": "04",
						"Name": "4"
					},
					{
						"CuotasId": "05",
						"Name": "5"
					},
					{
						"CuotasId": "06",
						"Name": "6"
					},
					{
						"CuotasId": "07",
						"Name": "7"
					},
					{
						"CuotasId": "08",
						"Name": "8"
					},
					{
						"CuotasId": "09",
						"Name": "9"
					},
					{
						"CuotasId": "10",
						"Name": "10"
					},
					{
						"CuotasId": "11",
						"Name": "11"
					},
					{
						"CuotasId": "12",
						"Name": "12"
					}
				],
				"Editable": true,
				"Enabled": true
			};

			// set explored app's demo model on this sample
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);

		},

		/**
		 * Se ejecuta cada vez que el router navega a RouteView2.
		 * Lee el préstamo seleccionado desde globalData (guardado en Viewini).
		 * @private
		 */
		_onRouteMatched: function () {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
			var oViewModel = this.getView().getModel("calamView");

			if (oPrestamoSeleccionado && oPrestamoSeleccionado.MontoMaximo) {
				oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo.replace(/\./g, "")));
			}
		},

		/**
		 * Evento cuando se activa el Step 1
		 */
		onStep1Activate: function () {
			// Limpiar estados de validación cuando se regresa al paso 1
			this._clearValidationStates();
		},

		/**
		 * Valida el Step 1 antes de permitir avanzar
		 */
		onValidateStep1: function () {
			var oViewModel = this.getView().getModel("calamView");
			var bValid = true;
			var aErrorMessages = [];

			// Limpiar estados de validación anteriores
			this._clearValidationStates();

			// 1. Validar Cuotas
			var sSelectedCuotas = oViewModel.getProperty("/selectedCuotas");
			if (!sSelectedCuotas || sSelectedCuotas === "") {
				oViewModel.setProperty("/cuotasValueState", "Error");
				oViewModel.setProperty("/cuotasValueStateText", "Debe seleccionar el número de cuotas");
				aErrorMessages.push("• Cuotas");
				bValid = false;
			}

			// 2. Validar Valor Solicitado
			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
			if (!fValorSolicitado || fValorSolicitado <= 0) {
				oViewModel.setProperty("/valorValueState", "Error");
				oViewModel.setProperty("/valorValueStateText", "Debe ingresar un valor válido");
				aErrorMessages.push("• Valor solicitado");
				bValid = false;
			}

			// 3. Validar Motivo Calamidad
			var sSelectedMotivo = oViewModel.getProperty("/selectedMotCalamidad");
			if (!sSelectedMotivo || sSelectedMotivo === "") {
				oViewModel.setProperty("/motivoValueState", "Error");
				oViewModel.setProperty("/motivoValueStateText", "Debe seleccionar un motivo de calamidad");
				aErrorMessages.push("• Motivo de Calamidad");
				bValid = false;
			}

			// Si no es válido, mostrar mensaje de error
			if (!bValid) {
				MessageBox.error(
					"Por favor complete los siguientes campos obligatorios:\n\n" +
					aErrorMessages.join("\n"),
					{
						title: "Campos Obligatorios",
						styleClass: "sapUiSizeCompact"
					}
				);
				return;
			}

			// Si es válido, marcar el paso como validado y avanzar
			var oWizard = this.byId("wizardCalam");
			var oStep1 = this.byId("step1");

			// Validar el paso 1
			oStep1.setValidated(true);

			// Avanzar al siguiente paso
			oWizard.nextStep();

			MessageToast.show("Paso 1 completado correctamente");
		},

		/**
		 * Limpia los estados de validación
		 * @private
		 */
		_clearValidationStates: function () {
			var oViewModel = this.getView().getModel("calamView");

			oViewModel.setProperty("/cuotasValueState", "None");
			oViewModel.setProperty("/cuotasValueStateText", "");
			oViewModel.setProperty("/valorValueState", "None");
			oViewModel.setProperty("/valorValueStateText", "");
			oViewModel.setProperty("/motivoValueState", "None");
			oViewModel.setProperty("/motivoValueStateText", "");
		},
		/**
	 * Evento cuando cambian las cuotas
	 */
		onCuotasChange: function (oEvent) {
			var oViewModel = this.getView().getModel("calamView");
			var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

			// Guardar en el modelo de vista
			oViewModel.setProperty("/selectedCuotas", sSelectedKey);

			// Guardar el número de cuotas para cálculos
			var iNumeroCuotas = parseInt(sSelectedKey);
			oViewModel.setProperty("/numeroCuotas", iNumeroCuotas);

			// Limpiar estado de error si había uno
			if (sSelectedKey) {
				oViewModel.setProperty("/cuotasValueState", "None");
				oViewModel.setProperty("/cuotasValueStateText", "");
			}

			// Recalcular el valor del préstamo
			this._calcularValorPrestamo();
		},

		/**
		 * Evento cuando cambia el valor solicitado
		 */
		onValorSolicitadoChange: function (oEvent) {
			var oViewModel = this.getView().getModel("calamView");

			// Obtener el valor ingresado por el usuario
			var sValue = oEvent.getParameter("value");

			// Parsear el valor (remover formato de moneda)
			var fValorSolicitado = this._parseMoneyValue(sValue);

			// Actualizar el modelo
			oViewModel.setProperty("/valorSolicitado", fValorSolicitado);

			// Validar que no exceda el monto máximo
			var fMontoMaximo = oViewModel.getProperty("/montoMaximo");
			if (fValorSolicitado > fMontoMaximo) {
				MessageBox.warning(
					"El valor solicitado excede el monto máximo permitido de " +
					this._formatCurrency(fMontoMaximo, "COP"),
					{
						title: "Valor Excedido"
					}
				);
				oViewModel.setProperty("/valorSolicitado", fMontoMaximo);
				return;
			}

			// Limpiar estado de error si había uno
			if (fValorSolicitado > 0) {
				oViewModel.setProperty("/valorValueState", "None");
				oViewModel.setProperty("/valorValueStateText", "");
			}

			// Calcular el valor del préstamo
			this._calcularValorPrestamo();
		},

		/**
		 * Parsea un valor monetario a número
		 * @private
		 */
		_parseMoneyValue: function (sValue) {
			if (!sValue) {
				return 0;
			}

			var sCleanValue = sValue.toString()
				.replace(/COP/g, '')
				.replace(/\$/g, '')
				.replace(/\./g, '')
				.replace(/,/g, '')
				.replace(/\s/g, '')
				.trim();

			var fValue = parseFloat(sCleanValue);
			return isNaN(fValue) ? 0 : fValue;
		},

		/**
		 * Calcula el valor de la cuota mensual dividiendo el monto total entre el número de cuotas (sin intereses)
		 * @private
		 */
		_calcularValorPrestamo: function () {
			var oViewModel = this.getView().getModel("calamView");

			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
			var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;

			var valorTotalPrimas = oViewModel.getProperty("/valorTotalPrimas") || 0;

			if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
				oViewModel.setProperty("/valorPrestamo", 0);
				oViewModel.setProperty("/valorCuota", 0);
				return;
			}

			// Se debe considerar el valor total de primas a descontar para calcular el valor del préstamo, 
			// restando este valor al monto solicitado antes de dividir entre el número de cuotas. De esta forma, 
			// el valor de la cuota reflejará el monto neto a pagar después de descontar las primas.
			var fValorCuota = Math.round((fValorSolicitado - valorTotalPrimas) / iNumeroCuotas);

			oViewModel.setProperty("/valorPrestamo", Math.round(fValorSolicitado));
			oViewModel.setProperty("/valorCuota", fValorCuota);

			MessageToast.show("Cuota mensual: " + this._formatCurrency(fValorCuota, "COP"));
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

		onStepCodeudorActivate: function () {
			var oViewModel = this.getView().getModel("calamView");
			// Verificar si los campos de Nombre codeudor y cedula codeudor ya tienen valores, si es así mostrar el paso del codeudor, de lo contrario ocultarlo
			var sNombreCodeudor = oViewModel.getProperty("/nombreCodeudor");
			var sCedulaCodeudor = oViewModel.getProperty("/cedulaCodeudor");
			if ((sNombreCodeudor && sNombreCodeudor.trim() !== "") && (sCedulaCodeudor && sCedulaCodeudor.trim() !== "")) {
				// Si ya tienen valores, marcar el paso como validado
				this._wizard.validateStep(this.byId("step2Codeudor"));
				//MessageToast.show("Datos del codeudor cargados, puede continuar con este paso");


			} else {
				this._wizard.invalidateStep(this.byId("step2Codeudor"));
				//MessageToast.show("Complete los datos del codeudor para activar este paso");
				//this._wizard.discardProgress(this.byId("step2Codeudor"));

			}
		},

		/**
 * Crea la solicitud
 */
		onCrearSolicitud: function () {

			// vamos a leer los datos del modelo global para obtener la información del usuario actual
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
			var oUserData = oGlobalModel.getProperty("/userData");

			var dataSolic = {

				SUBTY: "",
				DARBT: 0,
				PERNR: "",
				ENDDA: "9999-12-31",
				DBTCU: "COP",
				ZINCEX: "",
				ZCODEX: "",
				ZNUCEX: "",
				ZDIREX: "",
				ZTELEX: "",
				ZINCIN: "",
				ZNUEXT: "",
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

				MessageBox.error(
					"No se identifico numero de personal para el usuario actual"
				);
				return;
			}
			var that = this;
			var oViewModel = this.getView().getModel("calamView");
			var iIndexCod = oViewModel.getProperty("/tieneCodeudor");
			var oData = oViewModel.getData();

			console.log("Solicitud de Préstamo Calamidad:", oData);

			if (iIndexCod == 1) {


				if (oData.nombreCodeudor == "" || oData.cedulaCodeudor == "" || oData.direccionCodeudor == "" || oData.telefonoCodeudor == "") {

					MessageBox.error(
						"Por favor complete todos los datos del codeudor externo para continuar"
					);
					return;

				} else {
					dataSolic.ZINCEX = "X";

					dataSolic.ZCODEX = oData.nombreCodeudor;
					dataSolic.ZNUCEX = oData.cedulaCodeudor;
					dataSolic.ZDIREX = oData.direccionCodeudor;
					dataSolic.ZTELEX = oData.telefonoCodeudor;

				}
			}

			// Se selecciono codeudor interno  
			if (iIndexCod == 0) {

				if (oData.numeroEmpleadoCodeudor == "" || oData.numeroEmpleadoCodeudor == undefined) {

					MessageBox.error(
						"Por favor seleccione un codeudor  para continuar"
					);
					return;

				} else {
					dataSolic.ZINCIN = "X";

					dataSolic.ZNUEXT = oData.numeroEmpleadoCodeudor;

				}

			}

			if (oData.valorPrestamo >= 0) {

				// Como es moneda COP y el servicio espera el valor sin decimales ni formato, 
				// se divide entre 100 para eliminar los dos ceros finales
				//dataSolic.DARBT = oData.valorPrestamo / 100;
				//dataSolic.ZVALSO = oData.valorPrestamo / 100;
				dataSolic.DARBT = (parseFloat(oData.valorPrestamo) / 100).toFixed(2);
				dataSolic.ZVALSO = (parseFloat(oData.valorPrestamo) / 100).toFixed(2);

			} else {

				MessageBox.error(
					"Por favor registro el valor a solicitar"
				);
				return;

			}

			if (oData.numeroCuotas >= 0) {

				dataSolic.ZNUCUCA = oData.numeroCuotas;
				dataSolic.NUM_COUTAS = oData.numeroCuotas;

			} else {

				MessageBox.error(
					"Por favor registro número de cuotas"
				);
				return;

			}



			if (oData.selectedMotCalamidad != "") {

				dataSolic.ZMOCA = oData.selectedMotCalamidad;

			} else {

				MessageBox.error(
					"Debe indicar el motivo de la calamidad"
				);
				return;

			}

			var oGlobalModel = this.getOwnerComponent().getModel("globalData");

			oViewModel.setProperty("/solicitudEnabled", false);

			var dataService = {
				"n0:ZCOHCMFM_0045GUARDARPRESTAMO": {
					"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
					"IV_PRESTAMO":
						dataSolic

				}
			};

			var validateDataService = {
				"n0:ZCOHCMFM_VALIDACIONES": {
					"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
					"GT_PRESTAMOS":
						dataSolic

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

							} else {

								message_success = "Solicitud de Préstamo Calamidad creada exitosamente.";

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



		/** @private */
		_resetSearchDialog: function () {
			this._oSearchDialog.setModel(new JSONModel({
				docInput: "",
				results: [],
				busy: false
			}), "dlgSearch");
		},

		/**
		 * Ejecuta la búsqueda del colaborador desde el diálogo
		 */
		onSearchColaborador: function () {
			var oModel = this._oSearchDialog.getModel("dlgSearch");
			var sDoc = oModel.getProperty("/docInput");

			if (!sDoc || sDoc.trim() === "") {
				MessageToast.show("Ingrese un número de documento.");
				return;
			}

			var that = this;
			oModel.setProperty("/busy", true);
			oModel.setProperty("/results", []);

			this._oBackendService.getColaborador(sDoc.trim())
				.then(function (oResponse) {
					oModel.setProperty("/busy", false);
					var oItem = oResponse["n0:ZCOHCMFM_0045COLABORADORResponse"].ET_COLABORADORES.item;
					oModel.setProperty("/results", [oItem]);
				})
				.catch(function () {
					oModel.setProperty("/busy", false);
					MessageToast.show("No se encontró colaborador con ese número de documento.");
				});
		},

		/**
		 * Selecciona el colaborador de la tabla: mapea ENAME a los campos destino y cierra el diálogo
		 */
		onColaboradorItemPress: function (oEvent) {
			var oItem = oEvent.getSource().getBindingContext("dlgSearch").getObject();
			var oViewModel = this.getView().getModel("calamView");
			oViewModel.setProperty("/docBusqueda", oItem.ENAME);
			oViewModel.setProperty("/nombreCodeudor", oItem.ENAME);
			this._oSearchDialog.close();
		},

		/**
		 * Cierra el diálogo de búsqueda sin seleccionar
		 */
		onCancelColaboradorSearch: function () {
			this._oSearchDialog.close();
		},



		/**
		 * Carga y abre el diálogo de confirmación del colaborador
		 * @private
		 */
		_openColaboradorDialog: function (oItem) {
			var oView = this.getView();
			var that = this;

			if (!this._oColaboradorDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "prestamos.ccb.org.solprestamos.view.ColaboradorDialog",
					controller: this
				}).then(function (oDialog) {
					that._oColaboradorDialog = oDialog;
					oView.addDependent(oDialog);
					oDialog.setModel(new JSONModel(oItem), "dlgColaborador");
					oDialog.open();
				});
			} else {
				this._oColaboradorDialog.setModel(new JSONModel(oItem), "dlgColaborador");
				this._oColaboradorDialog.open();
			}
		},

		/**
		 * Confirma la selección y mapea ENAME al campo CodeudorNombre
		 */
		onColaboradorSeleccionar: function () {
			var oData = this._oColaboradorDialog.getModel("dlgColaborador").getData();
			this.getView().getModel("calamView").setProperty("/nombreCodeudor", oData.ENAME);
			this._oColaboradorDialog.close();
		},

		/**
		 * Cancela el diálogo de colaborador
		 */
		onColaboradorCancelar: function () {
			this._oColaboradorDialog.close();
		},

		onIdentificacionValueHelp: function () {
			var sIdentificacion = String(this.byId("inputIdentificacion").getValue()).trim();
			var oColaborador = this._oBackendService.Get_colaborador(sIdentificacion);

			var oViewModel = this.getView().getModel("calamView");
			if (oColaborador != undefined) {

				oViewModel.setProperty("/Codeudores", oColaborador);
			}

			// Abrir el diálogo de ayuda de búsqueda del codeudor
			if (this.dialog == undefined) {
				// Cargar o declarar  el fragment solo la primera vez que se abre, luego se reutiliza la instancia ya creada	
				this.dialog = sap.ui.xmlfragment(this.getView().getId(), "prestamos.ccb.org.solprestamos.view.IdentifCodeudorVHelp", this);
				this.getView().addDependent(this.dialog);
			}


			this.dialog.open();
		},

		onCodeudorSelect: function (oEvent) {

			// Obtener el item seleccionado
			var documento = oEvent.getSource().getBindingContext("calamView").getObject().PERID;
			var nombre = oEvent.getSource().getBindingContext("calamView").getObject().ENAME;
			var numeroEmpleado = oEvent.getSource().getBindingContext("calamView").getObject().PERNR;
			var oViewModel = this.getView().getModel("calamView");
			// Mapear los campos del codeudor al modelo de la vista
			if (oViewModel != undefined) {
				oViewModel.setProperty("/nombreCodeudor", nombre);
				oViewModel.setProperty("/numeroEmpleadoCodeudor", numeroEmpleado);
				oViewModel.setProperty("/cedulaCodeudor", documento);
				// Marcar el paso del codeudor como validado
				this._wizard.validateStep(this.byId("step2Codeudor"));
				MessageToast.show("Codeudor seleccionado: " + nombre);
			}
			this.dialog.close();
		},

		onCloseIdentifCodeudorVHelp: function () {
			// cerrar la ayuda de busqueda del codeudor
			this.dialog.close();
			//this.getView().getDependent("IdentifCodeudorVHelp").close();
		},

		/**
		 * Muestra u oculta los campos del codeudor según si es empleado CCB o externo
		 */
		onCodeudorTypeSelect: function (oEvent) {
			var iIndex = oEvent.getParameter("selectedIndex");
			var oViewModel = this.getView().getModel("calamView");

			// index 0 = "Sí" (empleado CCB), index 1 = "No" (externo)
			oViewModel.setProperty("/mostrarCCB", iIndex === 0);
			oViewModel.setProperty("/mostrarExterno", iIndex === 1);

			if (iIndex === 0) {
				// Si es empleado CCB, limpiar campos del codeudor externo
				oViewModel.setProperty("/nombreCodeudor", "");
				oViewModel.setProperty("/cedulaCodeudor", "");
				oViewModel.setProperty("/direccionCodeudor", "");
				oViewModel.setProperty("/telefonoCodeudor", "");
			} else {
				// Si es externo, limpiar campos del codeudor CCB
				oViewModel.setProperty("/nombreCodeudor", "");
				oViewModel.setProperty("/numeroEmpleadoCodeudor", "");
				oViewModel.setProperty("/cedulaCodeudor", "");
			}
			// Verificar si se puede activar el paso del codeudor dependiendo de los campos que se hayan llenado
			this.onStepCodeudorActivate();
		},

		/**
		 * Abre el diálogo para agregar un documento adjunto
		 */
		onAgregarDocumento: function () {
			var oView = this.getView();
			var that = this;

			if (!this._oAdjuntosDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "prestamos.ccb.org.solprestamos.view.AdjuntosDialog",
					controller: this
				}).then(function (oDialog) {
					that._oAdjuntosDialog = oDialog;
					oView.addDependent(oDialog);
					that._resetAdjuntosDialog();
					oDialog.open();
				});
			} else {
				this._resetAdjuntosDialog();
				this._oAdjuntosDialog.open();
			}
		},

		/**
		 * Reinicia el modelo del diálogo de adjuntos
		 * @private
		 */
		_resetAdjuntosDialog: function () {
			var oDialogModel = new JSONModel({
				rutaArchivo: "",
				nombreArchivo: "",
				tipoArchivo: "",
				tipoValueState: "None",
				tipoValueStateText: "",
				isReadingFile: false,
				base64Content: null
			});
			this._oAdjuntosDialog.setModel(oDialogModel, "adjuntoDlg");

			var oFileUploader = this.byId("fileUploaderDialog");
			if (oFileUploader) {
				oFileUploader.clear();
				oFileUploader.setValueState("None");
				oFileUploader.setValueStateText("");
			}
		},

		/**
		 * Captura el archivo seleccionado en el FileUploader del diálogo
		 */
		onArchivoSeleccionado: function (oEvent) {
			var oFileUploader = oEvent.getSource();
			var sFileName = oEvent.getParameter("newValue") || oFileUploader.getValue();
			var oDialogModel = this._oAdjuntosDialog.getModel("adjuntoDlg");
			oDialogModel.setProperty("/nombreArchivo", sFileName);
			oDialogModel.setProperty("/rutaArchivo", sFileName);
			oDialogModel.setProperty("/base64Content", null);

			if (sFileName) {
				oFileUploader.setValueState("None");
				oFileUploader.setValueStateText("");

				var oDomRef = oFileUploader.getDomRef("fu");
				var oFile = oDomRef && oDomRef.files && oDomRef.files[0];
				if (oFile) {
					oDialogModel.setProperty("/isReadingFile", true);
					var oReader = new FileReader();
					oReader.onload = function (e) {
						var sBase64 = e.target.result.split(",")[1];
						oDialogModel.setProperty("/base64Content", sBase64);
						oDialogModel.setProperty("/isReadingFile", false);
					};
					oReader.onerror = function () {
						oDialogModel.setProperty("/isReadingFile", false);
					};
					oReader.readAsDataURL(oFile);
				}
			}
		},

		/**
		 * Acepta el diálogo y agrega el documento a la tabla
		 */
		onAceptarAdjunto: function () {
			var oDialogModel = this._oAdjuntosDialog.getModel("adjuntoDlg");
			var oFileUploader = this.byId("fileUploaderDialog");
			var sNombreArchivo = oDialogModel.getProperty("/nombreArchivo") || (oFileUploader && oFileUploader.getValue());
			var sTipoArchivo = oDialogModel.getProperty("/tipoArchivo");
			var bValid = true;

			if (!sNombreArchivo || sNombreArchivo.trim() === "") {
				if (oFileUploader) {
					oFileUploader.setValueState("Error");
					oFileUploader.setValueStateText("Debe seleccionar un archivo");
				}
				bValid = false;
			}

			if (!sTipoArchivo || sTipoArchivo === "") {
				oDialogModel.setProperty("/tipoValueState", "Error");
				oDialogModel.setProperty("/tipoValueStateText", "Debe seleccionar el tipo de documento");
				bValid = false;
			}

			if (!bValid) {
				return;
			}

			var mTipos = { "1": "Soporte Calamidad", "2": "Certificado Médico", "3": "Factura de Compra" };

			var oViewModel = this.getView().getModel("calamView");
			var aAdjuntos = oViewModel.getProperty("/adjuntos") || [];

			aAdjuntos.push({
				nombreArchivo: sNombreArchivo,
				tipoArchivo: sTipoArchivo,
				tipoArchivoText: mTipos[sTipoArchivo] || sTipoArchivo,
				base64Content: oDialogModel.getProperty("/base64Content") || null
			});

			oViewModel.setProperty("/adjuntos", aAdjuntos);
			this._oAdjuntosDialog.close();
		},

		/**
		 * Cancela y cierra el diálogo de adjuntos
		 */
		onCancelarAdjunto: function () {
			this._oAdjuntosDialog.close();
		},

		/**
		 * Guarda los adjuntos asociados a una solicitud de préstamo
		 * @param {string} id_prestamo - ID de la solicitud de préstamo (UUID)
		 */
		Guardar_adjuntosFrom_idSol: function (id_prestamo) {
			var oViewModel = this.getView().getModel("calamView");
			var aAdjuntos = oViewModel.getProperty("/adjuntos");

			var oPayload = {
				"UUID": id_prestamo,
				"FILE_NAME_SOPORTE_CALAMIDAD": "",
				"BIN_SOPORTE_CALAMIDAD": "",
				"FILE_NAME_FACTURA_COMPRA": "",
				"BIN_FACTURA_COMPRA": ""
			};

			aAdjuntos.forEach(function (oAdjunto) {
				if (oAdjunto.tipoArchivo === "1") {
					oPayload.BIN_SOPORTE_CALAMIDAD = oAdjunto.base64Content || "";
					oPayload.FILE_NAME_SOPORTE_CALAMIDAD = oAdjunto.nombreArchivo || "";
				} else if (oAdjunto.tipoArchivo === "2") {
					oPayload.BIN_FACTURA_COMPRA = oAdjunto.base64Content || "";
					oPayload.FILE_NAME_FACTURA_COMPRA = oAdjunto.nombreArchivo || "";
				}
			});

			return oPayload;
		},

		/**
		 * Agrega un registro a la colección listprimas (lógica pendiente de implementar)
		 */
		onAddPrimas: function () {
			// lógica de adición de registros a implementar
			var that = this;

			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			if (oGlobalModel) {
				var oUserData = oGlobalModel.getProperty("/userData");
			}

			var oViewModel = this.getView().getModel("calamView");

			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
			var employeenumber = oViewModel.getProperty("/employeeNumber");
			var idPrestamo = oViewModel.getProperty("/idPrestamo");
			var moneda = oViewModel.getProperty("/moneda");

			var oViewModelPrimas = that.getView().getModel("listprimas");
			var aPrimas = oViewModelPrimas.getProperty("/items") || [];

			var aTimes = aPrimas.length;

			var NoPrimas = aTimes + 1;


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
					} else {

						// El servicio puede retornar un solo objeto o un array, normalizamos a array para simplificar la lógica	
						if (!Array.isArray(aItems)) {
							aItems = [aItems];
						}



						var fTotalPrimas = 0;
						var iIdx = 0;
						while (iIdx < aItems.length) {
							var fValorPrima = parseFloat(aItems[iIdx].VALOR_PRIMA) || 0;
							//var iValorEntero = Math.trunc(fValorPrima * 100);
							var iValorEntero = Math.trunc(fValorPrima);
							aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
							aItems[iIdx].MONEDA_PRIMA = moneda;
							fTotalPrimas = fTotalPrimas + fValorPrima;
							iIdx = iIdx + 1;
						}
						that.getView().getModel("calamView").setProperty("/valorTotalPrimas", fTotalPrimas);

						that.getView().getModel("calamView").setProperty("/primasADescontar", aItems);
						that.getView().getModel("listprimas").setProperty("/items", aItems);
						if (fTotalPrimas > 0) {

							that._calcularValorPrestamo();
						}



						/*
						MessageToast.show("Prima agregada correctamente");
						*/

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
		 * Elimina el último registro de la tabla de primas
		 */
		onReducePrimas: function () {

			var that = this;

			var oViewModel = this.getView().getModel("calamView");

			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
			var employeenumber = oViewModel.getProperty("/employeeNumber");
			var idPrestamo = oViewModel.getProperty("/idPrestamo");
			var moneda = oViewModel.getProperty("/moneda");

			var oViewModelPrimas = this.getView().getModel("listprimas");
			var aPrimas = oViewModelPrimas.getProperty("/items") || [];

			var aTimes = aPrimas.length;

			if (aTimes > 0) {

				if (aTimes === 1) {
					oViewModelPrimas.setProperty("/items", []);
					return;
				} else if (aTimes > 1) {

					// calculamos de nuevo la cantidad de primas a descontar restando 1 a la cantidad actual, 
					// para enviar ese valor al servicio y que retorne la nueva lista de primas actualizada sin la última prima que se quiere eliminar	

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
							} else {



								// El servicio puede retornar un solo objeto o un array, normalizamos a array para simplificar la lógica	
								if (!Array.isArray(aItems)) {
									aItems = [aItems];
								}

								var fTotalPrimas = 0;
								var iIdx = 0;
								while (iIdx < aItems.length) {
									var fValorPrima = parseFloat(aItems[iIdx].VALOR_PRIMA) || 0;
									//var iValorEntero = Math.trunc(fValorPrima * 100);
									var iValorEntero = Math.trunc(fValorPrima);
									aItems[iIdx].VALOR_PRIMA = String(iValorEntero);
									aItems[iIdx].MONEDA_PRIMA = moneda;
									fTotalPrimas = fTotalPrimas + fValorPrima;
									iIdx = iIdx + 1;
								}

								oViewModel.setProperty("/valorTotalPrimas", fTotalPrimas);
								that.getView().getModel("calamView").setProperty("/primasADescontar", aItems);
								that.getView().getModel("listprimas").setProperty("/items", aItems);

								if (fTotalPrimas > 0) {

									that._calcularValorPrestamo();
								}


								/*
								MessageToast.show("Prima agregada correctamente");
								*/

							}


						})
						.catch(function (oError) {
							MessageBox.error(
								"Error al consultar primas: " + (oError.message || oError.statusText || "Error desconocido"),
								{ title: "Error" }
							);
						});


					return;
				}


			}




			/*
			 if (aPrimas.length > 0) {
				 aPrimas.pop();
				 oViewModelPrimas.setProperty("/items", aPrimas);
			 }
		 */
		},

		/**
		 * Evento cuando cambia la selección de Primas y Bonificaciones
		 */
		onChangePrimas: function (oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
			var oViewModel = this.getView().getModel("calamView");
			oViewModel.setProperty("/SelectedPrimas", sSelectedKey);
		},



		onNavBack: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteViewini");
		}
	});
});