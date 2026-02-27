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

        guardarSolPrestamo: function (oData) {
            var sToken = this.Get_tokenfromservice(this._guardarPrestamosUrl);
            return this._executePostService(this._guardarPrestamosUrl, oData, sToken);

            /*
            
            this._executePostService("/http/CCB_Guardar_Prestamos", oData, sToken)
                .then(function (oResponse) {
                    // éxito
                })
             .catch(function (oError) {
                    // error
                });
            */

        },

        /**
         * Consulta un colaborador por un parámetro de búsqueda genérico
         * @param {string} sParam - Parámetro de búsqueda
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio
         */
        /**
         * Lee el CSRF Token desde un servicio OData mediante una petición GET
         * @param {string} sUrl - URL del servicio desde donde se obtiene el token
         * @returns {string} Token CSRF retornado en el header X-CSRF-Token de la respuesta
         */
        Get_tokenfromservice: function (sUrl) {
            var sToken = "";
            $.ajax({
                url: sUrl,
                method: "GET",
                async: false,
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (_oData, _sTextStatus, oXHR) {
                    sToken = oXHR.getResponseHeader("X-CSRF-Token");
                },
                error: function (oXHR) {
                    sToken = oXHR.getResponseHeader("X-CSRF-Token");
                }
            });
            return sToken;
        },

        Get_colaborador: function (sParam) {
            var gt_codeudores = {};
            var sServiceUrl = "/http/CCB_Colaboradores?$filter=Identificacion_Nacional eq '" + sParam + "'";
            $.ajax({
                dataType: "json",
                url: sServiceUrl,
                async: false,
                success: function (oResponse) {
                    if (oResponse["n0:ZCOHCMFM_0045COLABORADORResponse"].ET_COLABORADORES.item != undefined) {
                        gt_codeudores = oResponse["n0:ZCOHCMFM_0045COLABORADORResponse"].ET_COLABORADORES.item;
                    }
                },
                error: function (error) {}
            });
            return gt_codeudores;
        },

        /**
         * Consulta los datos de un colaborador por su identificación nacional
         * @param {string} sIdentificacionNacional - Identificación nacional del colaborador
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio
         */
        getColaborador: function (sIdentificacionNacional) {
            var sId = String(sIdentificacionNacional).trim();
            return this._executeGet(this._colaboradoresUrl, { Identificacion_Nacional: "'" + sId + "'" });
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
         * Ejecuta una petición POST al servicio incluyendo el CSRF Token en el header
         * @param {string} sUrl - URL del servicio
         * @param {object} oData - Datos a enviar en el body como JSON
         * @param {string} sToken - CSRF Token obtenido previamente con Get_tokenfromservice
         * @returns {Promise} Promise que resuelve con el JSON de respuesta
         * @private
         */
        _executePostService: function (sUrl, oData, sToken) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", sUrl, true);

                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Accept", "application/json");
                xhr.setRequestHeader("x-csrf-token", sToken);

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
