sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "prestamos/ccb/org/solprestamos/model/models",
    "sap/ui/model/json/JSONModel"
], (UIComponent, Device, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("prestamos.ccb.org.solprestamos.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

             // Cargar datos locales
            var oModel = new JSONModel();
            oModel.loadData("model/data.json");
            this.setModel(oModel);
        }
    });
});