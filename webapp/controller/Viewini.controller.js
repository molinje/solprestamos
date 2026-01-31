sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "prestamos/ccb/org/solprestamos/util/IntegrationService"

], (Controller, JSONModel, MessageBox, BusyIndicator, IntegrationService) => {
    "use strict";


    return Controller.extend("prestamos.ccb.org.solprestamos.controller.Viewini", {
        onInit() {
           var oRouter = this.getOwnerComponent().getRouter();
            //oRouter.getRoute("RouteViewini").attachPatternMatched(this._onObjectMatched, this);

            	var oData = {
				"SelectedPrestamo": "SP-1001",
				
				"PrestamoCollection": [
					{
						"PrestamoId": "01",
						"Name": "Préstamo Calamidad"
					},
					{
						"PrestamoId": "02",
						"Name": "Préstamo Educativo"
					},
					{
						"PrestamoId": "03",
						"Name": "Prestamo computador"
					},
					{
						"PrestamoId": "04",
						"Name": "Préstamo Movilidad Eléctrica"
					}
				],
				"Editable": true,
				"Enabled": true
			};

            
              this._integrationService = new IntegrationService();

			// set explored app's demo model on this sample
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);
        },

         /**
         * Carga datos desde el servicio SAP Integration Suite
         * @param {string} userId - ID del usuario (opcional, por defecto "00201663")
         * @private
         */
        _loadDataFromService: function (userId) {
            var that = this;
            
            // Mostrar indicador de carga
            BusyIndicator.show(0);

            // Ejecutar el GET con el userId en el body
            this._integrationService.getPruebaConsulta(userId)
                .then(function (data) {
                    // Procesar la respuesta del servicio
                    console.log("Datos recibidos del servicio:", data);
                    
                    // Aquí puedes procesar los datos según tu necesidad
                    // Por ejemplo, actualizar el modelo con los datos recibidos
                    // var oModel = that.getView().getModel();
                    // oModel.setProperty("/serviceData", data);
                    
                    BusyIndicator.hide();
                    MessageBox.success("Datos cargados correctamente del servicio");
                })
                .catch(function (error) {
                    BusyIndicator.hide();
                    console.error("Error al cargar datos del servicio:", error);
                    
                    var errorMessage = "Error al conectar con el servicio";
                    if (error.message) {
                        errorMessage = error.message;
                    } else if (error.response) {
                        errorMessage = "Error: " + error.statusText;
                    }
                    
                    MessageBox.error(errorMessage);
                });
        },

         _onObjectMatched: function () {
     //       // Limpiar selección al volver a la vista principal
            var oModel = this.getView().getModel();
            oModel.setProperty("/selectedPrestamo", "");
        },

    onNavigateToView2: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteView2");
    },


    onNavigateToView3: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteView3");
    },

            /**
         * Ejemplo de cómo ejecutar el servicio antes de navegar
         * @private
         */
        _executeServiceBeforeNavigation: function () {
            var that = this;
            
            BusyIndicator.show(0);

            this._integrationService.getPruebaConsulta("00201663")
                .then(function (data) {
                    BusyIndicator.hide();
                    
                    // Procesar datos y navegar
                    console.log("Servicio ejecutado exitosamente:", data);
                    
                    // Continuar con la navegación
                    that._performNavigation();
                })
                .catch(function (error) {
                    BusyIndicator.hide();
                    console.error("Error en el servicio:", error);
                    
                    MessageBox.error("Error al validar la información. Por favor intente nuevamente.", {
                        title: "Error de Servicio"
                    });
                });
        },

     onNavigate: function () {
            var oModel = this.getView().getModel();
            var sSelectedPrestamo = oModel.getProperty("/selectedPrestamo");

            if (!sSelectedPrestamo) {
                MessageBox.warning("Por favor seleccione un tipo de préstamo");
                return;
            }

            this._executeServiceBeforeNavigation();

            var oRouter = this.getOwnerComponent().getRouter();

            // Navegar según el tipo de préstamo seleccionado
            if (sSelectedPrestamo === "01") {
                oRouter.navTo("RouteView2");
            } else if (sSelectedPrestamo === "02") {
                oRouter.navTo("RouteView3");
            } else if (sSelectedPrestamo === "03") {
                oRouter.navTo("RouteComputador");
            }else if (sSelectedPrestamo === "04") {
                oRouter.navTo("Routeelectric");
            }
        }

    });
});