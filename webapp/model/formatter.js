sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Convierte una fecha en formato AAAAMMDD a DD/MM/AAAA
		 * @param {string} sFecha - Fecha en formato AAAAMMDD
		 * @returns {string} Fecha en formato DD/MM/AAAA, o cadena vacía si no es válida
		 */
		formatFechaEs: function (sFecha) {
			if (!sFecha || sFecha.length !== 8) {
				return "";
			}
			var sAnio = sFecha.substring(0, 4);
			var sMes = sFecha.substring(4, 6);
			var sDia = sFecha.substring(6, 8);
			return sDia + "/" + sMes + "/" + sAnio;
		}
	};
});
