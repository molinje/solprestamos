sap.ui.define([
    "sap/ui/base/Object",
    "prestamos/ccb/org/solprestamos/util/OAuthService"
], function (BaseObject, OAuthService) {
    "use strict";

    return BaseObject.extend("prestamos.ccb.org.solprestamos.util.BackendService", {

        _guardarPrestamosUrl: "/http/CCB_Guardar_Prestamos",

        /**
         * Constructor
         */
        constructor: function () {
            BaseObject.apply(this, arguments);
            this._oAuthService = new OAuthService();
        },

        /**
         * Guarda la solicitud de préstamo en el backend
         * @param {object} oData - JSON con los datos del préstamo a guardar
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio
         */
        guardarPrestamo: function (oData) {
            var that = this;
            return new Promise(function (resolve, reject) {
                that._oAuthService.getAccessToken()
                    .then(function (sToken) {
                        return that._executePost(that._guardarPrestamosUrl, sToken, oData);
                    })
                    .then(function (oResponse) {
                        resolve(oResponse);
                    })
                    .catch(function (oError) {
                        reject(oError);
                    });
            });
        },

        /**
         * Ejecuta una petición POST al servicio
         * @param {string} sUrl - URL del servicio
         * @param {string} sToken - Token de acceso OAuth
         * @param {object} oData - Datos a enviar en el body como JSON
         * @returns {Promise} Promise que resuelve con el JSON de respuesta
         * @private
         */
        _executePost: function (sUrl, sToken, oData) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", sUrl, true);

                xhr.setRequestHeader("Authorization", "Bearer " + sToken);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Accept", "application/json");

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var oResponse = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                            resolve(oResponse);
                        } catch (e) {
                            resolve({ data: xhr.responseText, rawResponse: true });
                        }
                    } else if (xhr.status === 401) {
                        reject({
                            error: "Authentication failed",
                            status: xhr.status,
                            statusText: xhr.statusText,
                            message: "El token de acceso es inválido o ha expirado"
                        });
                    } else {
                        reject({
                            error: "Service request failed",
                            status: xhr.status,
                            statusText: xhr.statusText,
                            response: xhr.responseText
                        });
                    }
                };

                xhr.onerror = function () {
                    reject({
                        error: "Network error",
                        status: xhr.status,
                        message: "Error de red al conectar con el servicio"
                    });
                };

                xhr.send(JSON.stringify(oData));
            });
        }
    });
});
