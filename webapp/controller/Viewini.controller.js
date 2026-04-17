sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"

], (Controller, JSONModel, MessageBox, BusyIndicator) => {
    "use strict";


    return Controller.extend("prestamos.ccb.org.solprestamos.controller.Viewini", {
        onInit() {
            var oRouter = this.getOwnerComponent().getRouter();
            //oRouter.getRoute("RouteViewini").attachPatternMatched(this._onObjectMatched, this);

            //this.getView().getModel().setProperty("/EmpleadoInfo", "");

            // Obtener el modelo global para almacenar datos del usuario y otros datos globales
            var oGlobalModel = this.getOwnerComponent().getModel("globalData");

            // Modelo de datos para la vista
			var oViewModel = new JSONModel({

				// Datos del usuario
                userId: oGlobalModel.getProperty("/userLogin/id") || "",
                userEmail: oGlobalModel.getProperty("/userLogin/email") || "",
                userFullName: oGlobalModel.getProperty("/userLogin/fullName") || "",
	

			});


			this.getView().setModel(oViewModel, "datainiView");



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

            var Userlogin = oGlobalModel.getProperty("/userLogin");

            var that = this;

            var oBusyDialog = new sap.m.BusyDialog({
                text: "Consultando datos del empleado..."
            });
            oBusyDialog.open();

            var sAppBase = sap.ui.require.toUrl("prestamos/ccb/org/solprestamos");
            var sServiceUrl = "";
            //var sServiceUrl = sAppBase + "/http/CCB_Prestamos?$filter=Correo eq '79395346@CCB.ORG.CO'";
            if (Userlogin.email) {
                var userEmail = Userlogin.email.toUpperCase();
               sServiceUrl = sAppBase + "/http/CCB_Prestamos?$filter=Correo eq " + "'" + userEmail.toUpperCase() + "'";
            } else {
               sServiceUrl = sAppBase + "/http/CCB_Prestamos?$filter=Correo eq '79395346@CCB.ORG.CO'";
            }

            
            console.log("URL del servicio:", sServiceUrl);

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
                            MontoMaximo: prestamo.MONTO_MAXIMO,
                            Cuotas: prestamo.CUOTAS
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

            // Buscar el objeto completo del préstamo seleccionado en el modelo "prestamos"
            var oPrestamosModel = this.getView().getModel("prestamos");
            var aCollection = oPrestamosModel ? oPrestamosModel.getProperty("/PrestamoCollection") : [];
            var oPrestamoSeleccionado = aCollection.find(function (p) {
                return p.PrestamoId === sSelectedPrestamo;
            });

            // Guardar en globalData para que todas las vistas destino lo lean
            var oGlobalModel = this.getOwnerComponent().getModel("globalData");
            oGlobalModel.setProperty("/prestamoSeleccionado", oPrestamoSeleccionado || null);

            var oRouter = this.getOwnerComponent().getRouter();

            // Navegar según el tipo de préstamo seleccionado
            if (sSelectedPrestamo === "01") {
                // Prestamo Computador
                oRouter.navTo("RouteComputador");

            } else if (sSelectedPrestamo === "02") {
                // Prestamo Movilidad
                oRouter.navTo("Routeelectric");  // Movilidad Electrica

            } else if (sSelectedPrestamo === "03") {

                oRouter.navTo("RouteView3"); // Prestamos Educativo

            } else if (sSelectedPrestamo === "04") {

                oRouter.navTo("RouteView2"); // calamidad

            } else if (sSelectedPrestamo === "05") {

                oRouter.navTo("RouteView3"); // Prestamos Educativo
            }
        }

    });
});