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
            return fetch(sUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(oData)
            }).then(function (oResponse) {
                if (oResponse.ok) {
                    return oResponse.text().then(function (sText) {
                        try {
                            return sText ? JSON.parse(sText) : {};
                        } catch (e) {
                            return { data: sText, rawResponse: true };
                        }
                    });
                } else {
                    return oResponse.text().then(function (sText) {
                        return Promise.reject({
                            error: "Service request failed",
                            status: oResponse.status,
                            statusText: oResponse.statusText,
                            response: sText
                        });
                    });
                }
            });
        }
    });
});
