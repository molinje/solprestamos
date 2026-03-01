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

			this._oBackendService.getColaborador('6332')
				.then(function (oResponse) {

					gt_codeudores = oResponse["n0:ZCOHCMFM_0045COLABORADORResponse"].ET_COLABORADORES.item;

				})
				.catch(function () {

					MessageToast.show("No se encontró colaborador con ese número de documento.");
				});

			// Obtener el modelo
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");

			// Modelo de datos para la vista 
			var oViewModel = new JSONModel({
				// Configuración de moneda
				moneda: "COP",              // Código de moneda (Peso Colombiano)

				// Valores monetarios
				montoMaximo: 3000000,       // Monto máximo a solicitar
				valorSolicitado: 0,         // Valor que ingresa el usuario
				valorPrestamo: 0,           // Valor calculado del préstamo
				valorCuota: 0,              // Valor de cada cuota
				valorComprometido: 0,       // Valor comprometido

				// Configuración de cuotas
				selectedCuotas: "",         // Cuotas seleccionadas
				numeroCuotas: 0,            // Número de cuotas (numérico)
				tasaInteres: 0.015,         // Tasa de interés mensual (1.5%)

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
				solicitudEnabled: true
			});

			if (gt_codeudores != undefined) {

				oViewModel.setProperty("/Codeudores", gt_codeudores);
			}
			this.getView().setModel(oViewModel, "calamView");


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
		 * Calcula el valor del préstamo y la cuota mensual
		 * @private
		 */
		_calcularValorPrestamo: function () {
			var oViewModel = this.getView().getModel("calamView");

			// Obtener valores del modelo
			var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
			var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;
			var fTasaInteres = oViewModel.getProperty("/tasaInteres") || 0;

			if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
				oViewModel.setProperty("/valorPrestamo", 0);
				oViewModel.setProperty("/valorCuota", 0);
				return;
			}

			// Cálculo con intereses (sistema francés)
			var fValorPrestamo = fValorSolicitado;
			var fValorCuota;

			if (fTasaInteres > 0) {
				// Fórmula de cuota con interés compuesto
				var numerador = fTasaInteres * Math.pow(1 + fTasaInteres, iNumeroCuotas);
				var denominador = Math.pow(1 + fTasaInteres, iNumeroCuotas) - 1;
				fValorCuota = fValorPrestamo * (numerador / denominador);
			} else {
				// Sin intereses
				fValorCuota = fValorPrestamo / iNumeroCuotas;
			}

			// Redondear a entero
			fValorPrestamo = Math.round(fValorPrestamo);
			fValorCuota = Math.round(fValorCuota);

			// Actualizar el modelo
			oViewModel.setProperty("/valorPrestamo", fValorPrestamo);
			oViewModel.setProperty("/valorCuota", fValorCuota);

			// Mostrar mensaje informativo
			MessageToast.show(
				"Cuota mensual: " + this._formatCurrency(fValorCuota, "COP")
			);
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
 * Crea la solicitud
 */
		onCrearSolicitud: function () {

			// vamos a leer los datos del modelo global para obtener la información del usuario actual
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

				MessageBox.error(
					"No se identifico numero de personal para el usuario actual"
				);
				return;
			}
			var that = this;
			var oViewModel = this.getView().getModel("calamView");
			var oData = oViewModel.getData();

			console.log("Solicitud de Préstamo Calamidad:", oData);

			if (oData.valorPrestamo >= 0) {

				dataSolic.DARBT = oData.valorPrestamo;
				dataSolic.ZVALSO = oData.valorPrestamo;

			} else {

				MessageBox.error(
					"Por favor registro el valor a solicitar"
				);
				return;

			}

			if (oData.numeroCuotas >= 0) {

				dataSolic.ZNUCUCA = oData.numeroCuotas;

			} else {

				MessageBox.error(
					"Por favor registro número de cuotas"
				);
				return;

			}

			if (oData.nombreCodeudor == "" || oData.cedulaCodeudor == "" ||
				oData.direccionCodeudor == "" || oData.telefonoCodeudor == "") {

				MessageBox.error(
					"Complete los datos del codeudor"
				);
				return;



			} else {

				dataSolic.ZCODEX = oData.nombreCodeudor;
				dataSolic.ZNUCEX = oData.cedulaCodeudor;
				dataSolic.ZDIREX = oData.direccionCodeudor;
				dataSolic.ZTELEX = oData.telefonoCodeudor;

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
			/*
			var sServiceUrl = "/http/CCB_Guardar_Prestamos";
			$.ajax({
				dataType: "json",
				url: sServiceUrl,
				async: false,
				data: JSON.stringify(dataService),
				success: function (oResponse) {
					//MessageBox.error("va todo bien " );

					if (oResponse = !undefined) {

						MessageBox.success("Solicitud de Préstamo Calamidad creada exitosamente");

					}



				},
				error: function (error) {
					MessageBox.error("Ha ocurrido un error: " + error.status + "-" + error.statusText);




				}

			});
			*/

            
			//that._oBackendService.guardarPrestamo(dataService)
			that._oBackendService.guardarSolPrestamo(dataService)
				.then(function (oResponse) {
					oViewModel.setProperty("/solicitudEnabled", true);
					MessageBox.success("Solicitud de Préstamo Calamidad creada exitosamente", {
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
			if ( oColaborador != undefined) {
								
				oViewModel.setProperty("/Codeudores", oColaborador);
			}

            // Abrir el diálogo de ayuda de búsqueda del codeudor
			if ( this.dialog == undefined) {
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
			oViewModel.setProperty("/nombreCodeudor", nombre);
			oViewModel.setProperty("/numeroEmpleadoCodeudor", numeroEmpleado);
			oViewModel.setProperty("/cedulaCodeudor", documento);	
			// Aquí podrías mapear otros campos si están disponibles en el modelo, por ejemplo:
			// oViewModel.setProperty("/direccionCodeudor", oItem.DIRECCION);
			// oViewModel.setProperty("/telefonoCodeudor", oItem.TELEFONO);
			// Cerrar el diálogo después de seleccionar
			this.dialog.close();
            /*
			var oItem = oEvent.getSource().getBindingContext("calamView").getObject();	
			var oViewModel = this.getView().getModel("calamView");
			// Mapear los campos del codeudor al modelo de la vista
			oViewModel.setProperty("/nombreCodeudor", oItem.ENAME);
			oViewModel.setProperty("/cedulaCodeudor", oItem.PERID);	
			// Aquí podrías mapear otros campos si están disponibles en el modelo, por ejemplo:
			// oViewModel.setProperty("/direccionCodeudor", oItem.DIRECCION);
			// oViewModel.setProperty("/telefonoCodeudor", oItem.TELEFONO);
			// Cerrar el diálogo después de seleccionar
			this.dialog.close();
			*/
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
		},

		onNavBack: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteViewini");
		}
	});
});