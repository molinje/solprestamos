sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"prestamos/ccb/org/solprestamos/util/BackendService"
], function (Controller, JSONModel, MessageBox, Fragment, BackendService) {
	"use strict";

	return Controller.extend("prestamos.ccb.org.solprestamos.controller.Detail", {

		onInit: function () {
			var oViewModel = new JSONModel({
				busy: false,
				busyDocumentos: false,
				uuid: "",
				adjuntos: []
			});
			this.getView().setModel(oViewModel, "detailView");

			this._oBackendService = new BackendService();

			this.getOwnerComponent().getRouter().getRoute("RouteDetail").attachPatternMatched(this._onDetailMatched, this);
		},

		_onDetailMatched: function (oEvent) {
			var oViewModel = this.getView().getModel("detailView");
			oViewModel.setProperty("/adjuntos", []);
			this.getView().setModel(new JSONModel({ items: [] }), "documentos");

			var sUUID = decodeURIComponent(oEvent.getParameter("arguments").uuid);

			if (sUUID) {
				oViewModel.setProperty("/uuid", sUUID);
			}

			this._loadDetalle(sUUID);
			this._loadDocumentos(sUUID);
		},

		_loadDetalle: function (sUUID) {
			var that = this;
			var oViewModel = this.getView().getModel("detailView");
			oViewModel.setProperty("/busy", true);

			this._oBackendService.getSolicitudDetalle(sUUID)
				.then(function (oData) {
					var oResp = oData && oData["n0:ZCOHCMFM_0045CONSULTAPRESTAMOResponse"];
					var oItem = oResp && oResp.ET_PRESTAMO && oResp.ET_PRESTAMO.item;

					if (Array.isArray(oItem)) {
						oItem = oItem[0];
					}

					if (!oItem) {
						throw new Error("No se encontró la solicitud");
					}

					if (oItem.DARBT !== undefined) {
						oItem.DARBT = Math.round(parseFloat(oItem.DARBT) * 100);
					}

					if (oItem.VALOR_POR_MES !== undefined) {
						oItem.VALOR_POR_MES = Math.round(parseFloat(oItem.VALOR_POR_MES) * 100);
					}

					var oPrimasRaw = oItem.PRIMAS ? oItem.PRIMAS.item : null;
					var aPrimas = oPrimasRaw ? (Array.isArray(oPrimasRaw) ? oPrimasRaw : [oPrimasRaw]) : [];
					aPrimas.forEach(function (oPrima) {
						if (oPrima && oPrima.VALOR_PRIMA !== undefined) {
							oPrima.VALOR_PRIMA = Math.round(parseFloat(oPrima.VALOR_PRIMA) * 100);
						}
					});
					oItem.PRIMAS = { item: aPrimas };

					that.getView().setModel(new JSONModel(oItem), "detailsolicitud");
					oViewModel.setProperty("/busy", false);
				})
				.catch(function (oError) {
					oViewModel.setProperty("/busy", false);
					MessageBox.error("Error al cargar el detalle de la solicitud: " + (oError.message || oError.statusText || "Error desconocido"));
				});
		},

		_loadDocumentos: function (sUUID) {
			var that = this;
			var oViewModel = this.getView().getModel("detailView");
			oViewModel.setProperty("/busyDocumentos", true);

			this._oBackendService.getDocumentos(sUUID)
				.then(function (oData) {
					var oResp = oData && oData["n0:ZCOHCMFM_CONSULT_DOCTSIT45Response"];
					var oItem = oResp && oResp.PDF_DOCUMENTOS && oResp.PDF_DOCUMENTOS.item;

					if (oItem) {
						var aDocumentos = [];

						Object.keys(oItem).forEach(function (sKey) {
							if (sKey.indexOf("FILE_NAME_") === 0) {
								var sSuffix = sKey.replace("FILE_NAME_", "");
								var sFileName = oItem[sKey];
								var sBin = oItem["BIN_" + sSuffix];

								if (sBin) {
									if (!sFileName) {
										sFileName = "Documento_" + sSuffix + ".pdf";
									}

									var sExt = sFileName.lastIndexOf(".") > -1
										? sFileName.split(".").pop().toUpperCase()
										: "N/A";
									aDocumentos.push({
										nombre: sFileName,
										extension: sExt,
										binario: sBin
									});
								}
							}
						});

						that.getView().setModel(new JSONModel({ items: aDocumentos }), "documentos");
					}

					oViewModel.setProperty("/busyDocumentos", false);
				})
				.catch(function (oError) {
					oViewModel.setProperty("/busyDocumentos", false);
					MessageBox.error("Error al cargar los documentos adjuntos: " + (oError.message || oError.statusText || "Error desconocido"));
				});
		},

		onVerDocumento: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("documentos");
			var oDoc = oContext.getObject();
			var sMimeType = this._getMimeType(oDoc.extension);

			// Convertir base64 a Blob para evitar la restricción de Chrome con data: URLs
			var sBin = atob(oDoc.binario.replace(/\s/g, ""));
			var aBytes = new Uint8Array(sBin.length);
			for (var i = 0; i < sBin.length; i++) {
				aBytes[i] = sBin.charCodeAt(i);
			}
			var oBlob = new Blob([aBytes], { type: sMimeType });
			var sBlobUrl = URL.createObjectURL(oBlob);

			var oWin = window.open(sBlobUrl, "_blank");
			if (oWin) {
				oWin.addEventListener("load", function () {
					URL.revokeObjectURL(sBlobUrl);
				});
			}
		},

		onDescargarDocumento: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("documentos");
			var oDoc = oContext.getObject();
			var sMimeType = this._getMimeType(oDoc.extension);
			var sDataUrl = "data:" + sMimeType + ";base64," + oDoc.binario;
			var oLink = document.createElement("a");
			oLink.href = sDataUrl;
			oLink.download = oDoc.nombre;
			document.body.appendChild(oLink);
			oLink.click();
			document.body.removeChild(oLink);
		},

		_getMimeType: function (sExtension) {
			var mMimes = {
				"PDF": "application/pdf",
				"PNG": "image/png",
				"JPG": "image/jpeg",
				"JPEG": "image/jpeg",
				"GIF": "image/gif",
				"DOC": "application/msword",
				"DOCX": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"XLS": "application/vnd.ms-excel",
				"XLSX": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			};
			return mMimes[sExtension] || "application/octet-stream";
		},

		/**
		 * Abre el diálogo para adjuntar un nuevo documento
		 */
		onAgregarDocumento: function () {
			var oView = this.getView();
			var that = this;

			if (!this._oAdjuntosDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "prestamos.ccb.org.solprestamos.view.AdjuntosDetalleDialog",
					controller: this
				}).then(function (oDialog) {
					that._oAdjuntosDialog = oDialog;
					oView.addDependent(oDialog);
					that._resetAdjuntosDialog();
					oDialog.open();
				});
			} else {
				this._resetAdjuntosDialog();
				this._oAdjuntosDialog.open();
			}
		},

		_resetAdjuntosDialog: function () {
			var oDialogModel = new JSONModel({
				nombreArchivo: "",
				rutaArchivo: "",
				tipoArchivo: "",
				tipoValueState: "None",
				tipoValueStateText: "",
				isReadingFile: false,
				base64Content: null
			});
			this._oAdjuntosDialog.setModel(oDialogModel, "adjuntoDlg");

			var oFileUploader = this.byId("fileUploaderDialogDetail");
			if (oFileUploader) {
				oFileUploader.clear();
				oFileUploader.setValueState("None");
			}
		},

		onArchivoTipoInvalido: function (oEvent) {
			var oFileUploader = oEvent.getSource();
			oFileUploader.clear();
			oFileUploader.setValueState("Error");
			oFileUploader.setValueStateText("Solo se permiten archivos PDF");
			var oDialogModel = this._oAdjuntosDialog.getModel("adjuntoDlg");
			oDialogModel.setProperty("/nombreArchivo", "");
			oDialogModel.setProperty("/rutaArchivo", "");
			oDialogModel.setProperty("/base64Content", null);
		},

		onArchivoSeleccionado: function (oEvent) {
			var oFileUploader = oEvent.getSource();
			var sFileName = oEvent.getParameter("newValue") || oFileUploader.getValue();
			var oDialogModel = this._oAdjuntosDialog.getModel("adjuntoDlg");

			if (sFileName && sFileName.split(".").pop().toLowerCase() !== "pdf") {
				oFileUploader.clear();
				oFileUploader.setValueState("Error");
				oFileUploader.setValueStateText("Solo se permiten archivos PDF");
				oDialogModel.setProperty("/nombreArchivo", "");
				oDialogModel.setProperty("/rutaArchivo", "");
				oDialogModel.setProperty("/base64Content", null);
				return;
			}

			oDialogModel.setProperty("/nombreArchivo", sFileName);
			oDialogModel.setProperty("/rutaArchivo", sFileName);
			oDialogModel.setProperty("/base64Content", null);

			if (sFileName) {
				oFileUploader.setValueState("None");
				oFileUploader.setValueStateText("");

				var oDomRef = oFileUploader.getDomRef("fu");
				var oFile = oDomRef && oDomRef.files && oDomRef.files[0];
				if (oFile) {
					oDialogModel.setProperty("/isReadingFile", true);
					var oReader = new FileReader();
					oReader.onload = function (e) {
						var sBase64 = e.target.result.split(",")[1];
						oDialogModel.setProperty("/base64Content", sBase64);
						oDialogModel.setProperty("/isReadingFile", false);
					};
					oReader.onerror = function () {
						oDialogModel.setProperty("/isReadingFile", false);
					};
					oReader.readAsDataURL(oFile);
				}
			}
		},

		/**
		 * Acepta el diálogo y agrega el documento a la tabla
		 */
		onAceptarAdjunto: function () {
			var oDialogModel = this._oAdjuntosDialog.getModel("adjuntoDlg");
			var oFileUploader = this.byId("fileUploaderDialogDetail");
			var sNombreArchivo = oDialogModel.getProperty("/nombreArchivo") || (oFileUploader && oFileUploader.getValue());
			var sTipoArchivo = oDialogModel.getProperty("/tipoArchivo");
			var bValid = true;

			if (!sNombreArchivo || sNombreArchivo.trim() === "") {
				if (oFileUploader) {
					oFileUploader.setValueState("Error");
					oFileUploader.setValueStateText("Debe seleccionar un archivo");
				}
				bValid = false;
			} else if (sNombreArchivo.split(".").pop().toLowerCase() !== "pdf") {
				if (oFileUploader) {
					oFileUploader.setValueState("Error");
					oFileUploader.setValueStateText("Solo se permiten archivos PDF");
				}
				bValid = false;
			}

			if (!sTipoArchivo || sTipoArchivo === "") {
				oDialogModel.setProperty("/tipoValueState", "Error");
				oDialogModel.setProperty("/tipoValueStateText", "Debe seleccionar el tipo de documento");
				bValid = false;
			}

			if (!bValid) {
				return;
			}

			var mTipos = { "1": "Memorando", "2": "Pagaré" };
			var oViewModel = this.getView().getModel("detailView");
			var aAdjuntos = oViewModel.getProperty("/adjuntos") || [];

			var oNuevoAdjunto = {
				nombreArchivo: sNombreArchivo,
				tipoArchivo: sTipoArchivo,
				tipoArchivoText: mTipos[sTipoArchivo] || sTipoArchivo,
				base64Content: oDialogModel.getProperty("/base64Content") || null
			};

			// Solo se admite un adjunto por tipo de documento (Memorando / Pagaré)
			var iExistente = aAdjuntos.findIndex(function (oAdj) {
				return oAdj.tipoArchivo === sTipoArchivo;
			});

			if (iExistente >= 0) {
				aAdjuntos[iExistente] = oNuevoAdjunto;
			} else {
				aAdjuntos.push(oNuevoAdjunto);
			}

			oViewModel.setProperty("/adjuntos", aAdjuntos);
			this._oAdjuntosDialog.close();
		},

		onCancelarAdjunto: function () {
			this._oAdjuntosDialog.close();
		},

		/**
		 * Elimina un documento adjunto de la tabla local (evento "delete" del sap.m.Table en modo Delete)
		 */
		onEliminarAdjunto: function (oEvent) {
			var that = this;
			var oItem = oEvent.getParameter("listItem");
			var oContext = oItem.getBindingContext("detailView");
			var sPath = oContext.getPath();
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			MessageBox.confirm(
				"¿Desea eliminar el documento '" + oContext.getProperty("nombreArchivo") + "'?", {
					title: "Eliminar adjunto",
					onClose: function (sAction) {
						if (sAction !== MessageBox.Action.OK) {
							return;
						}
						var oViewModel = that.getView().getModel("detailView");
						var aAdjuntos = oViewModel.getProperty("/adjuntos") || [];
						aAdjuntos.splice(iIndex, 1);
						oViewModel.setProperty("/adjuntos", aAdjuntos);
					}
				}
			);
		},

		/**
		 * Genera el payload de adjuntos para enviar al servicio
		 * @param {string} id_prestamo - UUID de la solicitud de préstamo
		 */
		Generate_json_files: function (id_prestamo) {
			var oViewModel = this.getView().getModel("detailView");
			var aAdjuntos = oViewModel.getProperty("/adjuntos") || [];

			var oPayload = {
				"UUID": id_prestamo,
				"FILE_NAME_PAGARE_FIRMADO": "",
				"BIN_PAGARE_FIRMADO": "",
				"FILE_NAME_MEMORANDO": "",
				"BIN_MEMORANDO": ""
			};

			aAdjuntos.forEach(function (oAdjunto) {
				if (oAdjunto.tipoArchivo === "1") {
					oPayload.BIN_MEMORANDO = oAdjunto.base64Content || "";
					oPayload.FILE_NAME_MEMORANDO = oAdjunto.nombreArchivo || "";
				} else if (oAdjunto.tipoArchivo === "2") {
					oPayload.BIN_PAGARE_FIRMADO = oAdjunto.base64Content || "";
					oPayload.FILE_NAME_PAGARE_FIRMADO = oAdjunto.nombreArchivo || "";
				}
			});

			return oPayload;
		},

		onSaveAttachments: function () {
			var that = this;
			var oViewModel = this.getView().getModel("detailView");
			var sUUID = oViewModel.getProperty("/uuid");

			if (!sUUID) {
				return;
			}

			var aAdjuntos = oViewModel.getProperty("/adjuntos") || [];
			if (aAdjuntos.length === 0) {
				MessageBox.warning("No hay documentos adjuntos para guardar.");
				return;
			}

			var oPayload = this.Generate_json_files(sUUID);
			var oAdjuntosServiceData = {
				"n0:ZCOHCMFM_GUARDAR_PROCPASIT45": {
					"-xmlns:n0": "urn:sap-com:document:sap:rfc:functions",
					"PDF_DOCUMENTOS": {
						"item": [
							oPayload
						]
					}
				}
			};

			this._oBackendService.guardarPDFsToSolPrestamo(oAdjuntosServiceData)
				.then(function () {
					MessageBox.success("Los documentos se guardaron correctamente.");
					that._loadDocumentos(sUUID);
				})
				.catch(function (oError) {
					MessageBox.error("Error al guardar los documentos: " + (oError.message || oError.statusText || "Error desconocido"));
				});
		},

		onNavBack: function () {
			this.getOwnerComponent().getRouter().navTo("RouteViewini");
		}
	});
});
