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

            // Crear modelo global para datos del servicio
            var oGlobalDataModel = new JSONModel({
                userData: null,        // Datos del usuario actual
                gt_motcalamidad: null,
                consulData: null,      // Datos de la consulta
                isLoading: false,      // Indicador de carga
                lastUpdate: null       // Última actualización
            });
            this.setModel(oGlobalDataModel, "globalData");

            // Opcional: Cargar datos iniciales
            this._loadInitialData();

        },

        _loadInitialData: function () {

            var that = this;
            var oGlobalDataModel = this.getModel("globalData");

            var sServiceUrl = "/http/CCB_bd_erp";
            $.ajax({
                dataType: "json",
                url: sServiceUrl,
                async: false,
                //data: JSON.stringify(oData),
                success: function (oResponse) {
                    //MessageBox.error("va todo bien " );
                    //oBusyDialog.close();
                    var Datos = {};
                    var gt_motcalamidad = {};
                    var gt_especialidad = {};
                    var GT_POSGRADO = {};
                    var GT_PREGRADO = {};
                    var GT_PREST_CALAMIDAD = {};
                    var GT_TIPO_ESTUDIO = {};

                    if (oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_MOT_CALAMIDAD.item != undefined) {
                        gt_motcalamidad = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_MOT_CALAMIDAD.item;
                    }

                    if (oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_ESPECIALIDAD.item != undefined) {
                        gt_especialidad = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_ESPECIALIDAD.item;
                    }

                    if (oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_POSGRADO.item != undefined) {
                        GT_POSGRADO = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_POSGRADO.item;
                    }

                    if (oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_PREGRADO.item != undefined) {
                        GT_PREGRADO = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_PREGRADO.item;
                    }

                    if (oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_PREST_CALAMIDAD.item != undefined) {
                        GT_PREST_CALAMIDAD = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].GT_PREST_CALAMIDAD.item;
                    }

                     if (oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].TIPO_ESTUDIO.item != undefined) {
                        GT_TIPO_ESTUDIO = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].TIPO_ESTUDIO.item;
                    }

                     var oMotcalamidad = new JSONModel({
                        GT_MOT_CALAMIDAD: gt_motcalamidad
                    });

                     oGlobalDataModel.setProperty("/gt_motcalamidad", gt_motcalamidad);

                     oGlobalDataModel.setProperty("/gt_especialidad", gt_especialidad);

                     oGlobalDataModel.setProperty("/gt_postgrado", GT_POSGRADO);

                     oGlobalDataModel.setProperty("/gt_pregrado", GT_PREGRADO);

                     oGlobalDataModel.setProperty("/gt_prest_calamidad", GT_PREST_CALAMIDAD);

                     oGlobalDataModel.setProperty("/gt_tipo_estudio", GT_TIPO_ESTUDIO);

                     



                    //var empleadoInfo = oResponse["n0:ZCOHCMFM_CONSULT_ESTUDResponse"].E_INFO.item;
                    //var listaPrestamos = empleadoInfo.LIST_PREST.item;

                },
                error: function (error) {
                    MessageBox.error("Ha ocurrido un error: " + error.status + "-" + error.statusText);
                    //oBusyDialog.close();

                }

            });
        }
    });
});