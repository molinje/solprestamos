sap.ui.define([
    "sap/ui/base/Object",
    "prestamos/ccb/org/solprestamos/util/OAuthService"
], function (BaseObject, OAuthService) {
    "use strict";

    return BaseObject.extend("prestamos.ccb.org.solprestamos.util.IntegrationService", {

      // URL base del servicio SAP Integration Suite
        // Usar ruta relativa para aprovechar el proxy configurado en ui5.yaml
        _baseUrl: "",

        /**
         * Constructor
         */
        constructor: function () {
            BaseObject.apply(this, arguments);
            this._oAuthService = new OAuthService();
        },

        /**
         * Ejecuta una consulta GET al servicio de prueba
         * @param {string} userId - ID del usuario para la consulta
         * @returns {Promise} Promise que resuelve con los datos del servicio
         */
        getPruebaConsulta: function (userId) {
            var that = this;
            // Usar ruta relativa para que use el proxy configurado en ui5.yaml
            var serviceUrl = "/http/pruebaconsulta";
            
            // Preparar el body con el formato requerido
            var requestBody = {
                "Consul": [
                    {
                        "userId": userId || "00201663"
                    }
                ]
            };

            return new Promise(function (resolve, reject) {
                // Primero obtener el token válido
                that._oAuthService.getAccessToken()
                    .then(function (token) {
                        // Ejecutar la llamada GET con el token y el body
                        return that._executeGet(serviceUrl, token, requestBody);
                    })
                    .then(function (data) {
                        resolve(data);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        },

        /**
         * Ejecuta una petición GET al servicio
         * @param {string} url - URL del servicio
         * @param {string} token - Token de acceso OAuth
         * @param {object} body - Datos a enviar en el body (opcional)
         * @returns {Promise} Promise que resuelve con la respuesta
         * @private
         */
        _executeGet: function (url, token, body) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);
                //token = "";
                // Configurar headers
                xhr.setRequestHeader("Authorization", "Bearer " + token);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Accept", "application/json");

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                            resolve(response);
                        } catch (e) {
                            // Si no es JSON válido, devolver el texto plano
                            resolve({
                                data: xhr.responseText,
                                rawResponse: true
                            });
                        }
                    } else if (xhr.status === 401) {
                        // Token expirado o inválido
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

                // Enviar el body si existe
                if (body) {
                    //xhr.send(JSON.stringify(body));
                    xhr.send(body);
                } else {
                    xhr.send();
                }
            });
        },

        /**
         * Ejecuta una petición POST al servicio
         * @param {string} endpoint - Endpoint del servicio (ejemplo: "/http/crear-solicitud")
         * @param {object} data - Datos a enviar
         * @returns {Promise} Promise que resuelve con la respuesta
         */
        post: function (endpoint, data) {
            var that = this;
            // El endpoint ya debe venir con el path completo (ej: "/http/crear-solicitud")
            var serviceUrl = endpoint;

            return new Promise(function (resolve, reject) {
                // Primero obtener el token válido
                that._oAuthService.getAccessToken()
                    .then(function (token) {
                        // Ejecutar la llamada POST con el token
                        return that._executePost(serviceUrl, token, data);
                    })
                    .then(function (response) {
                        resolve(response);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        },

        /**
         * Ejecuta una petición POST al servicio
         * @param {string} url - URL del servicio
         * @param {string} token - Token de acceso OAuth
         * @param {object} data - Datos a enviar
         * @returns {Promise} Promise que resuelve con la respuesta
         * @private
         */
        _executePost: function (url, token, data) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", url, true);
                
                // Configurar headers
                xhr.setRequestHeader("Authorization", "Bearer " + token);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Accept", "application/json");

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                            resolve(response);
                        } catch (e) {
                            resolve({
                                data: xhr.responseText,
                                rawResponse: true
                            });
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

                xhr.send(JSON.stringify(data));
            });
        },

        /**
         * Limpia el token almacenado
         */
        clearAuthentication: function () {
            this._oAuthService.clearToken();
        }
    });
});