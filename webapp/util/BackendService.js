sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("prestamos.ccb.org.solprestamos.util.BackendService", {

        _guardarPrestamosUrl: "/http/CCB_Guardar_Prestamos",
        _colaboradoresUrl: "/http/CCB_Colaboradores",

        /**
         * Guarda la solicitud de préstamo en el backend
         * @param {object} oData - JSON con los datos del préstamo a guardar
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio
         */
        guardarPrestamo: function (oData) {
            return this._executePost(this._guardarPrestamosUrl, oData);
        },

        /**
         * Consulta los datos de un colaborador por su identificación nacional
         * @param {string} sIdentificacionNacional - Identificación nacional del colaborador
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio
         */
        getColaborador: function (sIdentificacionNacional) {
            return this._executeGet(this._colaboradoresUrl, { Identificacion_Nacional: sIdentificacionNacional });
        },

        /**
         * Ejecuta una petición POST al servicio
         * La autenticación la gestiona el destination dest_int_s configurado en ui5.yaml
         * @param {string} sUrl - URL del servicio
         * @param {object} oData - Datos a enviar en el body como JSON
         * @returns {Promise} Promise que resuelve con el JSON de respuesta
         * @private
         */
        //_executePost: function (sUrl, oData) {
            /*
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
        },

        /**
         * Ejecuta una petición GET al servicio con parámetros en la query string
         * @param {string} sUrl - URL base del servicio
         * @param {object} oParams - Parámetros a enviar en la query string
         * @returns {Promise} Promise que resuelve con el JSON de respuesta
         * @private
         */
        _executeGet: function (sUrl, oParams) {
            return new Promise(function (resolve, reject) {
                var sQueryString = Object.keys(oParams)
                    .map(function (sKey) {
                        return encodeURIComponent(sKey) + "=" + encodeURIComponent(oParams[sKey]);
                    })
                    .join("&");

                var xhr = new XMLHttpRequest();
                xhr.open("GET", sUrl + "?" + sQueryString, true);

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

                xhr.send();
            });
        }
    });
});
