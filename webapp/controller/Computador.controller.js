sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.Computador", {
    onInit: function () {
      // Inicialización del controlador View2
    },


     onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});