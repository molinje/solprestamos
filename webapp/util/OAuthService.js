sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("prestamos.ccb.org.solprestamos.util.OAuthService", {
        
        // Configuración OAuth
        _oAuthConfig: {
            //tokenUrl: "https://ccb-is-dev-5v6vds1v.authentication.us10.hana.ondemand.com/oauth/token",
            // Usar ruta relativa para aprovechar el proxy y evitar CORS
            tokenUrl: "/oauth/token",
            clientId: "sb-929514f2-7649-4f9b-9d7a-33c735214f2d!b514001|it-rt-ccb-is-dev-5v6vds1v!b410334",
            clientSecret: "919238f2-d4b4-4a21-9cdd-c5223c761188$Wo35vsb0eRDV1ZhdjBRGRYidXQ-XnxRL94hk_sPweFI=",
            grantType: "client_credentials"
        },

        // Almacenamiento del token en memoria
        _accessToken: null,
        _tokenExpiry: null,

        /**
         * Obtiene el token de acceso válido
         * @returns {Promise} Promise que resuelve con el token de acceso
         */
        getAccessToken: function () {
            var that = this;
            
            return new Promise(function (resolve, reject) {
                // Verificar si el token existe y es válido
                if (that._isTokenValid()) {
                    resolve(that._accessToken);
                    return;
                }

                // Si no es válido, renovar el token
                that._renewToken()
                    .then(function (token) {
                        resolve(token);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        },

        /**
         * Verifica si el token actual es válido
         * @returns {boolean} True si el token es válido
         * @private
         */
        _isTokenValid: function () {
            if (!this._accessToken || !this._tokenExpiry) {
                return false;
            }

            // Verificar si el token ha expirado (con 60 segundos de margen)
            var currentTime = new Date().getTime();
            return currentTime < (this._tokenExpiry - 60000);
        },

        /**
         * Renueva el token de acceso
         * @returns {Promise} Promise que resuelve con el nuevo token
         * @private
         */
        _renewToken: function () {
            var that = this;

            return new Promise(function (resolve, reject) {
                // Crear las credenciales en Base64 para Basic Auth
                var credentials = btoa(that._oAuthConfig.clientId + ":" + that._oAuthConfig.clientSecret);

                // Configurar la petición
                var xhr = new XMLHttpRequest();
                xhr.open("POST", that._oAuthConfig.tokenUrl, true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("Authorization", "Basic " + credentials);

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            
                            // Guardar el token y calcular su expiración
                            that._accessToken = response.access_token;
                            var expiresIn = response.expires_in || 3600; // Por defecto 1 hora
                            that._tokenExpiry = new Date().getTime() + (expiresIn * 1000);

                            resolve(that._accessToken);
                        } catch (e) {
                            reject({
                                error: "Error parsing token response",
                                details: e
                            });
                        }
                    } else {
                        reject({
                            error: "Token request failed",
                            status: xhr.status,
                            statusText: xhr.statusText,
                            response: xhr.responseText
                        });
                    }
                };

                xhr.onerror = function () {
                    reject({
                        error: "Network error during token request",
                        status: xhr.status
                    });
                };

                // Enviar la petición con el grant type
                var params = "grant_type=" + encodeURIComponent(that._oAuthConfig.grantType);
                xhr.send(params);
            });
        },

        /**
         * Limpia el token almacenado (útil para logout o errores)
         */
        clearToken: function () {
            this._accessToken = null;
            this._tokenExpiry = null;
        }
    });
});