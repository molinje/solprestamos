sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageBox) => {
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

			// set explored app's demo model on this sample
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);
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
     onNavigate: function () {
            var oModel = this.getView().getModel();
            var sSelectedPrestamo = oModel.getProperty("/selectedPrestamo");

            if (!sSelectedPrestamo) {
                MessageBox.warning("Por favor seleccione un tipo de préstamo");
                return;
            }

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