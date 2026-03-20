sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.View3", {
    onInit: function () {
      var oViewModel = new JSONModel({
        montoMaximo: 0,
        tasaInteres: 0
      });
      this.getView().setModel(oViewModel, "educativoView");

      // Suscribirse al evento de ruta: se dispara cada vez que se navega a esta vista
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteView3").attachPatternMatched(this._onRouteMatched, this);
    },

    /**
     * Se ejecuta cada vez que el router navega a RouteView3.
     * Lee el préstamo seleccionado desde globalData (guardado en Viewini).
     * @private
     */
    _onRouteMatched: function () {
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var oPrestamoSeleccionado = oGlobalModel.getProperty("/prestamoSeleccionado");
      var oViewModel = this.getView().getModel("educativoView");

      if (oPrestamoSeleccionado && oPrestamoSeleccionado.MontoMaximo) {
        oViewModel.setProperty("/montoMaximo", parseFloat(oPrestamoSeleccionado.MontoMaximo));
      }
    },

    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});