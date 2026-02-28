sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    //"prestamos/ccb/org/solprestamos/util/IntegrationService"

], (Controller, JSONModel, MessageBox, BusyIndicator) => {
    "use strict";


    return Controller.extend("prestamos.ccb.org.solprestamos.controller.Viewini", {
        onInit() {
            var oRouter = this.getOwnerComponent().getRouter();
            //oRouter.getRoute("RouteViewini").attachPatternMatched(this._onObjectMatched, this);

            //this.getView().getModel().setProperty("/EmpleadoInfo", "");

            // Obtener el modelo global para almacenar datos del usuario y otros datos globales
            var oGlobalModel = this.getOwnerComponent().getModel("globalData");



            this._loadDatafromEmployee();

            var oData = {
                "SelectedPrestamo": "SP-1001",

                "PrestamoCollection": [

                    {
                        "PrestamoId": "01",
                        "Name": "Prestamo computador"
                    },
                    {
                        "PrestamoId": "02",
                        "Name": "Préstamo Movilidad"
                    },

                    {
                        "PrestamoId": "03",
                        "Name": "Prestamo Educativo"
                    },
                    {
                        "PrestamoId": "04",
                        "Name": "Préstamo Calamidad"
                    },
                    {
                        "PrestamoId": "05",
                        "Name": "Prestamo Educativo"
                    }
                ],
                "Editable": true,
                "Enabled": true
            };


            //this._integrationService = new IntegrationService();

            // set explored app's demo model on this sample
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
        },

        /**
        * Carga datos desde el servicio SAP Integration Suite, leemos los prestamos a los cuales el 
        * empleado tiene derecho
        * @param {string} userId - ID del usuario (opcional, por defecto "00201663")
        * @private
        */
        _loadDatafromEmployee: function () {


             // Obtener el modelo global para almacenar datos del usuario y otros datos globales
            var oGlobalModel = this.getOwnerComponent().getModel("globalData");

            var that = this;

            var oBusyDialog = new sap.m.BusyDialog({
                text: "Consultando datos del empleado..."
            });
            oBusyDialog.open();

            var sServiceUrl = "/http/CCB_Prestamos?$filter=Correo eq 'carlos.prieto.merchan@ccb.org.co'";
            $.ajax({
                dataType: "json",
                url: sServiceUrl,
                async: false,
                //data: JSON.stringify(oData),
                success: function (oResponse) {
                    //MessageBox.error("va todo bien " );
                    oBusyDialog.close();
                    // empleadoInfo colocamos aqui la información basica del empleado, como nombre, correo, salario, etc. 
                    // y en listaPrestamos la información de los prestamos a los cuales tiene derecho
                    var empleadoInfo = oResponse["n0:ZMFCOHCM_INFO_INIResponse"].E_INFO.item;
                    var listaPrestamos = empleadoInfo.LIST_PREST.item;

                    var prestamosCollection = listaPrestamos.map(function (prestamo) {
                        return {
                            PrestamoId: prestamo.TIPO,
                            Name: prestamo.TEXTO,
                            MontoMaximo: prestamo.MONTO_MAXIMO
                        };
                    });

                    var oPrestamosModel = new JSONModel({
                        PrestamoCollection: prestamosCollection
                    });

                    // Aquí 'this' funciona porque usamos .bind(this) abajo
                    that.getView().setModel(oPrestamosModel, "prestamos");

                    // Leemos datos globales
                    //var oGlobalModel = this.getOwnerComponent().getModel("globalData");

                    var oModel = that.getView().getModel();

                    if (oModel != undefined) {

                        oModel.setProperty("/EmpleadoInfo", {
                            "PERNR": empleadoInfo.PERNR,
                            "Nombres": empleadoInfo.NOMBRES,
                            "Apellidos": empleadoInfo.APELLIDOS,
                            "Salario": empleadoInfo.SALARIO,
                            "Correo": empleadoInfo.CORREO
                        });

                    }
                    if (oGlobalModel != undefined) {

                        oGlobalModel.setProperty("/userData", {
                            "PERNR": empleadoInfo.PERNR,
                            "Nombres": empleadoInfo.NOMBRES,
                            "Apellidos": empleadoInfo.APELLIDOS,
                            "Salario": empleadoInfo.SALARIO,
                            "Correo": empleadoInfo.CORREO
                        });
                    }


                },
                error: function (error) {
                    MessageBox.error("Ha ocurrido un error: " + error.status + "-" + error.statusText);
                    oBusyDialog.close();

                    var oData = {
                        "SelectedPrestamo": "SP-1001",

                        "PrestamoCollection": [

                            {
                                "PrestamoId": "01",
                                "Name": "Prestamo computador"
                            },
                            {
                                "PrestamoId": "02",
                                "Name": "Préstamo Movilidad"
                            },

                            {
                                "PrestamoId": "03",
                                "Name": "Prestamo Educativo"
                            },
                            {
                                "PrestamoId": "04",
                                "Name": "Préstamo Calamidad"
                            },
                            {
                                "PrestamoId": "05",
                                "Name": "Prestamo Educativo"
                            }
                        ],
                        "Editable": true,
                        "Enabled": true
                    };

                    var oPrestamosModel = new JSONModel({
                       "PrestamoCollection": oData.PrestamoCollection
                    });

                    // Aquí 'this' funciona porque usamos .bind(this) abajo
                    that.getView().setModel(oPrestamosModel, "prestamos");

                }

            });


        },
        /*
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
       */
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
    /*
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
        */

        onNavigate: function () {
            var oModel = this.getView().getModel();
            var sSelectedPrestamo = oModel.getProperty("/selectedPrestamo");

            if (!sSelectedPrestamo) {
                MessageBox.warning("Por favor seleccione un tipo de préstamo");
                return;
            }

            //this._executeServiceBeforeNavigation();

            var oRouter = this.getOwnerComponent().getRouter();

            // Navegar según el tipo de préstamo seleccionado
            if (sSelectedPrestamo === "01") {
                // Prestamo Computador   
                oRouter.navTo("RouteComputador");

            } else if (sSelectedPrestamo === "02") {
                // Prestamo Movilidad   

            } else if (sSelectedPrestamo === "03") {

                oRouter.navTo("RouteView3"); // Prestamos Educativo

            } else if (sSelectedPrestamo === "04") {

                oRouter.navTo("RouteView2"); // calamidad
                //oRouter.navTo("Routeelectric");

            } else if (sSelectedPrestamo === "05") {

                oRouter.navTo("RouteView3"); // Prestamos Educativo    
            }
        }

    });
});