sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("prestamos.ccb.org.solprestamos.util.BackendService", {

        _guardarPrestamosUrl: "/http/CCB_Guardar_Prestamos",

        /**
         * Guarda la solicitud de préstamo en el backend
         * @param {object} oData - JSON con los datos del préstamo a guardar
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio
         */
        guardarPrestamo: function (oData) {
            return this._executePost(this._guardarPrestamosUrl, oData);
        },

        /**
         * Ejecuta una petición POST al servicio
         * La autenticación la gestiona el destination dest_int_s configurado en ui5.yaml
         * @param {string} sUrl - URL del servicio
         * @param {object} oData - Datos a enviar en el body como JSON
         * @returns {Promise} Promise que resuelve con el JSON de respuesta
         * @private
         */
        _executePost: function (sUrl, oData) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", sUrl, true);

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
