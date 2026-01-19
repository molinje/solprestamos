sap.ui.define([
  "sap/ui/core/mvc/Controller",
  'sap/ui/model/json/JSONModel'
], (Controller, JSONModel) => {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.View2", {
    onInit() {
      // Inicialización del controlador View2
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