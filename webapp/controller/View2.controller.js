sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel'
], (Controller, JSONModel) => {
	"use strict";

	return Controller.extend("prestamos.ccb.org.solprestamos.controller.View2", {
		onInit() {
			// Inicialización del controlador View2
			// Controller Calamidad
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
                
                // Otros campos
                tieneCodeudor: -1,
                numeroDocumento: "",
                nombreCodeudor: "",
                cedulaCodeudor: "",
                direccionCodeudor: "",
                telefonoCodeudor: "",
                fecha: "",
                selectedMotCalamidad: "",
                solicitudEnabled: false
            });
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

		onNavBack: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RouteViewini");
		}
	});
});