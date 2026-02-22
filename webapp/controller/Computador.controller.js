sap.ui.define([
  "sap/ui/core/mvc/Controller",
   "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator"
], function (Controller, JSONModel, MessageBox, MessageToast, BusyIndicator) {
  "use strict";

  return Controller.extend("prestamos.ccb.org.solprestamos.controller.Computador", {
    onInit: function () {
     // Crear modelo local para la vista de Computador
      var oViewModel = new JSONModel({
        // Configuración de moneda
        moneda: "COP",              // Código de moneda (Peso Colombiano)
        
        // Valores monetarios
        valorSolicitado: 0,         // Valor que ingresa el usuario
        valorPrestamo: 0,           // Valor calculado del préstamo
        valorCuota: 0,              // Valor de cada cuota
        valorDescuentoPrimas: 0,    // Valor de descuento en primas
        
        // Configuración de cuotas
        selectedCuotas: "",         // Cuotas seleccionadas
        numeroCuotas: 0,            // Número de cuotas (numérico)
        tasaInteres: 0.015,         // Tasa de interés mensual (1.5%)
        
        // Destino y descuentos
        selectedDestino: "",        // Colaborador o Proveedor
        descuentoPrimas: "NO",      // SI o NO
        
        // Estados de validación para los campos obligatorios
        valorValueState: "None",           // Estado de validación de valor
        valorValueStateText: "",           // Mensaje de error de valor
        cuotasValueState: "None",          // Estado de validación de cuotas
        cuotasValueStateText: "",          // Mensaje de error de cuotas
        destinoValueState: "None",         // Estado de validación de destino
        destinoValueStateText: "",         // Mensaje de error de destino
        
        // Control de formulario
        solicitudEnabled: false
      });
      this.getView().setModel(oViewModel, "compuView");

      var oRouter = this.getOwnerComponent().getRouter();
      //oRouter.getRoute("computador").attachPatternMatched(this._onObjectMatched, this);
    },

    /**
     * Cuando se carga la ruta
     * @private
     */
    _onObjectMatched: function () {
      // Reiniciar el wizard y limpiar datos
      this._resetWizard();
      
      // Cargar datos del usuario desde modelo global si es necesario
      this._loadUserDataFromGlobal();
    },

    /**
     * Carga datos del usuario desde el modelo global
     * @private
     */
    _loadUserDataFromGlobal: function () {
      var oGlobalModel = this.getOwnerComponent().getModel("globalData");
      var consulData = oGlobalModel.getProperty("/consulData");
      
      if (consulData && consulData.Consul && consulData.Consul[0]) {
        var userData = consulData.Consul[0];
        var oViewModel = this.getView().getModel("compuView");
        
        // Pre-llenar datos si están disponibles
        if (userData.tasaInteres) {
          oViewModel.setProperty("/tasaInteres", parseFloat(userData.tasaInteres));
        }
        
        console.log("Datos del usuario cargados desde modelo global");
      }
    },

    /**
     * Evento cuando se activa el Step 1
     */
    onStep1Activate: function() {
      // Limpiar estados de validación cuando se regresa al paso 1
      this._clearValidationStates();
    },

    /**
     * Valida el Step 1 antes de permitir avanzar
     */
    onValidateStep1: function() {
      var oViewModel = this.getView().getModel("compuView");
      var bValid = true;
      var aErrorMessages = [];

      // Limpiar estados de validación anteriores
      this._clearValidationStates();

      // 1. Validar Valor Solicitado
      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado");
      if (!fValorSolicitado || fValorSolicitado <= 0) {
        oViewModel.setProperty("/valorValueState", "Error");
        oViewModel.setProperty("/valorValueStateText", "Debe ingresar un valor válido mayor a cero");
        aErrorMessages.push("• Valor Solicitado");
        bValid = false;
      }

      // 2. Validar Cuotas
      var sSelectedCuotas = oViewModel.getProperty("/selectedCuotas");
      if (!sSelectedCuotas || sSelectedCuotas === "") {
        oViewModel.setProperty("/cuotasValueState", "Error");
        oViewModel.setProperty("/cuotasValueStateText", "Debe seleccionar el número de cuotas");
        aErrorMessages.push("• Número de Cuotas");
        bValid = false;
      }

      // 3. Validar Destino
      var sSelectedDestino = oViewModel.getProperty("/selectedDestino");
      if (!sSelectedDestino || sSelectedDestino === "") {
        oViewModel.setProperty("/destinoValueState", "Error");
        oViewModel.setProperty("/destinoValueStateText", "Debe seleccionar el destino del préstamo");
        aErrorMessages.push("• Destino");
        bValid = false;
      }

      // Si no es válido, mostrar mensaje de error
      if (!bValid) {
        MessageBox.error(
          "Por favor complete los siguientes campos obligatorios:\n\n" + 
          aErrorMessages.join("\n"),
          {
            title: "Campos Obligatorios",
            styleClass: "sapUiSizeCompact"
          }
        );
        return;
      }

      // Si es válido, marcar el paso como validado y avanzar
      var oWizard = this.byId("wizardComputador");
      var oStep1 = this.byId("stepComput01");
      
      // Validar el paso 1
      oStep1.setValidated(true);
      
      // Avanzar al siguiente paso
      oWizard.nextStep();
      
      MessageToast.show("Paso 1 completado correctamente");
    },

    /**
     * Limpia los estados de validación
     * @private
     */
    _clearValidationStates: function() {
      var oViewModel = this.getView().getModel("compuView");
      
      oViewModel.setProperty("/valorValueState", "None");
      oViewModel.setProperty("/valorValueStateText", "");
      oViewModel.setProperty("/cuotasValueState", "None");
      oViewModel.setProperty("/cuotasValueStateText", "");
      oViewModel.setProperty("/destinoValueState", "None");
      oViewModel.setProperty("/destinoValueStateText", "");
    },

    /**
     * Evento cuando cambia el valor solicitado
     */
    onValorSolicitadoChange: function(oEvent) {
      var oViewModel = this.getView().getModel("compuView");
      
      // Obtener el valor ingresado por el usuario
      var sValue = oEvent.getParameter("value");
      
      // Parsear el valor (remover formato de moneda)
      var fValorSolicitado = this._parseMoneyValue(sValue);
      
      // Actualizar el modelo
      oViewModel.setProperty("/valorSolicitado", fValorSolicitado);
      
      // Limpiar estado de error si el valor es válido
      if (fValorSolicitado > 0) {
        oViewModel.setProperty("/valorValueState", "None");
        oViewModel.setProperty("/valorValueStateText", "");
      }
      
      // Calcular el valor del préstamo y cuota
      this._calcularValorPrestamo();
    },

    /**
     * Evento cuando cambian las cuotas
     */
    onCuotasChange: function(oEvent) {
      var oViewModel = this.getView().getModel("compuView");
      var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      
      // Guardar en el modelo de vista
      oViewModel.setProperty("/selectedCuotas", sSelectedKey);
      
      // Guardar el número de cuotas para cálculos
      var iNumeroCuotas = parseInt(sSelectedKey);
      oViewModel.setProperty("/numeroCuotas", iNumeroCuotas);
      
      // Limpiar estado de error si había uno
      if (sSelectedKey) {
        oViewModel.setProperty("/cuotasValueState", "None");
        oViewModel.setProperty("/cuotasValueStateText", "");
      }
      
      // Recalcular el valor del préstamo y cuota
      this._calcularValorPrestamo();
    },

    /**
     * Evento cuando cambia el destino
     */
    onDestinoChange: function(oEvent) {
      var oViewModel = this.getView().getModel("compuView");
      var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      
      // Guardar en el modelo
      oViewModel.setProperty("/selectedDestino", sSelectedKey);
      
      // Limpiar estado de error si había uno
      if (sSelectedKey) {
        oViewModel.setProperty("/destinoValueState", "None");
        oViewModel.setProperty("/destinoValueStateText", "");
      }
    },

    /**
     * Calcula el valor del préstamo y la cuota mensual
     * @private
     */
    _calcularValorPrestamo: function() {
      var oViewModel = this.getView().getModel("compuView");
      
      // Obtener valores del modelo
      var fValorSolicitado = oViewModel.getProperty("/valorSolicitado") || 0;
      var iNumeroCuotas = oViewModel.getProperty("/numeroCuotas") || 0;
      var fTasaInteres = oViewModel.getProperty("/tasaInteres") || 0;
      
      if (fValorSolicitado <= 0 || iNumeroCuotas <= 0) {
        oViewModel.setProperty("/valorPrestamo", 0);
        oViewModel.setProperty("/valorCuota", 0);
        return;
      }
      
      // Cálculo con intereses (sistema francés)
      var fValorPrestamo = fValorSolicitado;
      var fValorCuota;
      
      if (fTasaInteres > 0) {
        // Fórmula de cuota con interés compuesto
        var numerador = fTasaInteres * Math.pow(1 + fTasaInteres, iNumeroCuotas);
        var denominador = Math.pow(1 + fTasaInteres, iNumeroCuotas) - 1;
        fValorCuota = fValorPrestamo * (numerador / denominador);
      } else {
        // Sin intereses
        fValorCuota = fValorPrestamo / iNumeroCuotas;
      }
      
      // Redondear a entero
      fValorPrestamo = Math.round(fValorPrestamo);
      fValorCuota = Math.round(fValorCuota);
      
      // Actualizar el modelo
      oViewModel.setProperty("/valorPrestamo", fValorPrestamo);
      oViewModel.setProperty("/valorCuota", fValorCuota);
      
      // Calcular descuento en primas si aplica
      this._calcularDescuentoPrimas();
      
      // Mostrar mensaje informativo
      MessageToast.show(
        "Cuota mensual: " + this._formatCurrency(fValorCuota, "COP")
      );
    },

    /**
     * Calcula el valor de descuento en primas
     * @private
     */
    _calcularDescuentoPrimas: function() {
      var oViewModel = this.getView().getModel("compuView");
      var sDescuentoPrimas = oViewModel.getProperty("/descuentoPrimas");
      var fValorCuota = oViewModel.getProperty("/valorCuota") || 0;
      
      var fValorDescuento = 0;
      
      if (sDescuentoPrimas === "SI" && fValorCuota > 0) {
        // Ejemplo: descuento es el valor de la cuota
        // Ajusta esta lógica según tus reglas de negocio
        fValorDescuento = fValorCuota;
      }
      
      oViewModel.setProperty("/valorDescuentoPrimas", fValorDescuento);
    },

    /**
     * Parsea un valor monetario a número
     * @private
     */
    _parseMoneyValue: function(sValue) {
      if (!sValue) {
        return 0;
      }
      
      var sCleanValue = sValue.toString()
        .replace(/COP/g, '')
        .replace(/\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '')
        .replace(/\s/g, '')
        .trim();
      
      var fValue = parseFloat(sCleanValue);
      return isNaN(fValue) ? 0 : fValue;
    },

    /**
     * Formatea un valor como moneda
     * @private
     */
    _formatCurrency: function(fValue, sCurrency) {
      var oFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
        currencyCode: true,
        maxFractionDigits: 0
      });
      return oFormat.format(fValue, sCurrency);
    },

    /**
     * Reinicia el wizard
     * @private
     */
    _resetWizard: function() {
      var oWizard = this.byId("wizardComputador");
      if (oWizard) {
        oWizard.discardProgress(oWizard.getSteps()[0]);
      }
      
      var oViewModel = this.getView().getModel("compuView");
      oViewModel.setData({
        moneda: "COP",
        valorSolicitado: 0,
        valorPrestamo: 0,
        valorCuota: 0,
        valorDescuentoPrimas: 0,
        selectedCuotas: "",
        numeroCuotas: 0,
        tasaInteres: 0.015,
        selectedDestino: "",
        descuentoPrimas: "NO",
        valorValueState: "None",
        valorValueStateText: "",
        cuotasValueState: "None",
        cuotasValueStateText: "",
        destinoValueState: "None",
        destinoValueStateText: "",
        solicitudEnabled: false
      });
    },

    /**
     * Completa el wizard
     */
    onWizardComplete: function() {
      this._validateForm();
    },

    /**
     * Valida el formulario completo
     * @private
     */
    _validateForm: function() {
      var oViewModel = this.getView().getModel("compuView");
      var oData = oViewModel.getData();

      var bValid = oData.valorSolicitado > 0 && 
                  oData.numeroCuotas > 0 && 
                  oData.selectedDestino;

      oViewModel.setProperty("/solicitudEnabled", bValid);
    },

    /**
     * Carga de archivos completa
     */
    onUploadComplete: function() {
      MessageToast.show("Documento cargado exitosamente");
    },

    /**
     * Crea la solicitud de préstamo computador
     */
    onCrearSolicitud: function() {
      var that = this;
      var oViewModel = this.getView().getModel("compuView");
      var oData = oViewModel.getData();
      var oComponent = this.getOwnerComponent();
      var integrationService = oComponent.getIntegrationService();

      // Preparar los datos en el formato requerido por el servicio
      var prestamoData = {
        DARBT: oData.valorPrestamo,           // Valor del préstamo
        DBTCU: oData.moneda,                  // Moneda (COP)
        ZNUCUCA: parseInt(oData.selectedCuotas), // Número de cuotas
        ZVALSO: oData.valorSolicitado,        // Valor solicitado
        ZDESTINO: oData.selectedDestino,      // Destino (01=Colaborador, 02=Proveedor)
        ZDESCPRIMAS: oData.descuentoPrimas    // Descuento primas (SI/NO)
      };

      console.log("Datos de la solicitud de computador:", prestamoData);

      MessageBox.success(
        "Solicitud de Préstamo Computador creada exitosamente", 
        {
          title: "Solicitud Creada",
          details: "Monto: " + this._formatCurrency(oData.valorPrestamo, oData.moneda) + 
                  "\nCuotas: " + oData.numeroCuotas + 
                  "\nValor Cuota: " + this._formatCurrency(oData.valorCuota, oData.moneda) +
                  "\nDestino: " + (oData.selectedDestino === "01" ? "Colaborador" : "Proveedor"),
          onClose: function() {
            // Volver a la vista principal
            that.onNavBack();
          }
        }
      );

      // Descomentar cuando el servicio esté listo:
      /*
      BusyIndicator.show(0);
      
      integrationService.guardarPrestamoComputador(prestamoData)
        .then(function(response) {
          BusyIndicator.hide();
          console.log("Respuesta del servicio:", response);
          
          MessageBox.success(
            "Solicitud creada exitosamente",
            {
              onClose: function() {
                that.onNavBack();
              }
            }
          );
        })
        .catch(function(error) {
          BusyIndicator.hide();
          console.error("Error al crear solicitud:", error);
          MessageBox.error("Error al crear la solicitud");
        });
      */
    },

    /**
     * Navega hacia atrás
     */
    onNavBack: function() {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteViewini");
    }
  });
});