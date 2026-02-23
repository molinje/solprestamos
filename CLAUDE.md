# CLAUDE.md — Proyecto SAP Fiori UI5: Solicitud de Préstamos (CCB)

## Descripción del Proyecto

Aplicación SAP Fiori UI5 para la **Solicitud de Préstamos** de la Cámara de Comercio de Bogotá (CCB).
Permite a colaboradores solicitar diferentes tipos de préstamos institucionales.

- **App ID**: `prestamos.ccb.org.solprestamos`
- **Namespace**: `prestamos.ccb.org`
- **Versión UI5 mínima**: 1.143.2
- **Tema**: `sap_horizon`
- **Idioma**: Español

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework UI | SAP UI5 / SAPUI5 1.143.2+ |
| Vistas | XML Views |
| Controladores | JavaScript (AMD via `sap.ui.define`) |
| Modelos de datos | JSONModel, ResourceModel, Device Model |
| Autenticación | OAuth 2.0 (client credentials) |
| Backend | SAP Integration Suite (CPI) vía REST/JSON |
| Deploy | SAP Cloud Foundry + MTA |
| Seguridad nube | XSUAA |
| Build tool | UI5 CLI 4.0.33 + SAP UX Tooling 1.20.1 |
| Tema visual | sap_horizon |

---

## Estructura del Proyecto

```
solprestamos/
├── package.json             # Scripts NPM y dependencias
├── ui5.yaml                 # Config servidor desarrollo (proxy, live reload)
├── ui5-deploy.yaml          # Config despliegue
├── ui5-local.yaml           # Config desarrollo local
├── mta.yaml                 # Descriptor MTA para Cloud Foundry
├── xs-app.json              # Rutas de red cloud (proxy XSUAA)
├── xs-security.json         # Configuración seguridad XSUAA
│
└── webapp/
    ├── Component.js         # Componente raíz UI5; crea modelos globales
    ├── manifest.json        # Configuración de app: rutas, modelos, datasources
    ├── index.html           # Punto de entrada HTML
    │
    ├── controller/          # Controladores de vista
    │   ├── App.controller.js
    │   ├── Viewini.controller.js    # Vista inicial (selección de préstamo)
    │   ├── View2.controller.js      # Préstamo Calamidad (wizard 2 pasos)
    │   ├── View3.controller.js      # Préstamo Educativo (wizard 3 pasos)
    │   ├── Computador.controller.js # Préstamo Computador (wizard 3 pasos)
    │   ├── electric.controller.js   # Préstamo Movilidad Eléctrica
    │   └── Melectrica.controller.js # Movilidad eléctrica (variante)
    │
    ├── view/                # Vistas XML
    │   ├── App.view.xml
    │   ├── Viewini.view.xml
    │   ├── View2.view.xml
    │   ├── View3.view.xml
    │   ├── Computador.view.xml
    │   ├── electric.view.xml
    │   └── Melectrica.view.xml
    │
    ├── model/
    │   ├── models.js        # Factory de Device Model
    │   └── data.json        # Datos estáticos locales (listas de referencia)
    │
    ├── util/
    │   ├── IntegrationService.js  # Servicio central de comunicación backend
    │   └── OAuthService.js        # Gestión de token OAuth 2.0
    │
    ├── i18n/
    │   └── i18n.properties  # Textos en español
    │
    └── css/
        └── style.css        # Estilos personalizados
```

---

## Rutas de Navegación

Definidas en `manifest.json`. Patrón: NavContainer con transición `slide`.

| Ruta              | Patrón      | Vista       | Tipo de Préstamo           |
|-------------------|-------------|-------------|----------------------------|
| `RouteViewini`    | `:?query:`  | Viewini     | Pantalla inicial (selección) |
| `RouteView2`      | `view2`     | View2       | Préstamo Calamidad         |
| `RouteView3`      | `view3`     | View3       | Préstamo Educativo         |
| `RouteComputador` | `computador`| Computador  | Préstamo Computador        |
| `Routeelectric`   | `electric`  | electric    | Préstamo Movilidad Eléctrica |

### Códigos de tipo de préstamo (campo TIPO del servicio)
- `"01"` → Computador
- `"02"` → Movilidad Eléctrica
- `"03"` → Educativo
- `"04"` → Calamidad
- `"05"` → Educativo (variante)

---

## Servicios Backend

### Endpoint principal de empleado y préstamos disponibles
- **URL**: `/http/CCB_Prestamos`
- **Método**: GET
- **Filtro**: `?$filter=Correo eq '<email>'`
- **Respuesta**: XML anidado en JSON con estructura SAP RFC
  ```json
  {
    "n0:ZMFCOHCM_INFO_INIResponse": {
      "E_INFO": {
        "item": {
          "PERNR": "",
          "NOMBRES": "",
          "APELLIDOS": "",
          "SALARIO": "",
          "CORREO": "",
          "LIST_PREST": {
            "item": [{ "TIPO": "", "TEXTO": "", "MONTO_MAXIMO": "" }]
          }
        }
      }
    }
  }
  ```

### Endpoint de datos de referencia (catálogos)
- **URL**: `/http/CCB_bd_erp`
- **Método**: GET
- **Respuesta**: XML con entidades:
  - `GT_MOT_CALAMIDAD` — Motivos de calamidad
  - `GT_ESPECIALIDAD` — Especialidades
  - `GT_POSGRADO` — Programas de posgrado
  - `GT_PREGRADO` — Programas de pregrado
  - `GT_PREST_CALAMIDAD` — Préstamos de calamidad disponibles
  - `TIPO_ESTUDIO` — Tipos de estudio

### Endpoint de prueba
- **URL**: `/dest_int_s/http/prueba_test`
- **Propósito**: Testing de conectividad (no usar en producción)

### Proxy en desarrollo
- **Backend CPI**: `https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com`
- **Destino**: `dest_int_s`
- Configurado en `ui5.yaml` como middleware `fiori-tools-proxy`

---

## Modelos de Datos

### Jerarquía de modelos en Component.js

| Nombre modelo | Tipo | Propósito |
|---------------|------|-----------|
| `device` | Device Model | Capacidades de dispositivo (responsive) |
| (default) | JSONModel | Datos de `model/data.json` |
| `globalData` | JSONModel | Estado global de la app |
| `i18n` | ResourceModel | Textos internacionalizados |

### Propiedades de `globalData`
```javascript
{
  userData: null,            // Datos del empleado logueado
  gt_motcalamidad: [],       // Lista motivos calamidad
  gt_especialidad: [],       // Especialidades
  gt_postgrado: [],          // Programas posgrado
  gt_pregrado: [],           // Programas pregrado
  gt_prest_calamidad: [],    // Préstamos calamidad disponibles
  gt_tipo_estudio: [],       // Tipos de estudio
  consulData: null,          // Datos de consulta activa
  isLoading: false,          // Flag de carga
  lastUpdate: null           // Timestamp de última actualización
}
```

### Modelos por vista

| Vista | Modelo local | Contenido |
|-------|-------------|-----------|
| Viewini | `prestamos` | Colección de préstamos disponibles |
| View2 | `calamView`, `pcalamidad` | Datos del formulario calamidad |
| Computador | `compuView` | Datos del formulario computador |

### data.json (referencia local)
```json
{
  "Prestamos": [{"key": "01", "text": "Préstamo Calamidad"}, ...],
  "Cuotas": [{"key": "01", "text": "01"}, ..., {"key": "12", "text": "12"}],
  "Modalidad": [{"key": "01", "text": "Técnico"}, {"key": "02", "text": "Universitario"}],
  "OrigenUniversidad": [{"key": "01", "text": "Nacional"}, {"key": "02", "text": "Extranjera"}]
}
```

---

## Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Controllers | PascalCase + `.controller.js` | `Computador.controller.js` |
| Vistas XML | PascalCase + `.view.xml` | `Computador.view.xml` |
| Servicios util | PascalCase + `Service.js` | `IntegrationService.js` |
| Rutas | PascalCase + prefijo `Route` | `RouteComputador` |
| Targets | PascalCase + prefijo `Target` | `TargetComputador` |
| Modelos de vista | camelCase + sufijo `View` | `calamView`, `compuView` |
| Namespace completo | `prestamos.ccb.org.solprestamos.[layer].[Name]` | |

### Paths de módulos AMD
```
Controllers: prestamos.ccb.org.solprestamos.controller.[Name]
Views:       prestamos.ccb.org.solprestamos.view.[Name]
Utils:       prestamos.ccb.org.solprestamos.util.[Name]
Models:      prestamos.ccb.org.solprestamos.model.[Name]
i18n:        prestamos.ccb.org.solprestamos.i18n.i18n
```

---

## Tipos de Préstamo — Estado de Implementación

| Préstamo | Ruta | Steps | Importe máx | Tasa | Estado |
|----------|------|-------|-------------|------|--------|
| Calamidad | `view2` | 2 | 3.000.000 COP | 1,5% mensual | **Implementado** |
| Computador | `computador` | 3 | Desde servicio | 1,5% mensual | **Implementado** |
| Educativo | `view3` | 3 | Desde servicio | Variable | En desarrollo |
| Movilidad Eléctrica | `electric` | 3 | Desde servicio | Variable | Placeholder |

---

## Lógica de Cálculo Financiero

### Sistema francés de amortización (cuotas fijas)
```javascript
// Cuota mensual fija
cuotaMensual = P * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
// donde: P = capital, i = tasa mensual (0.015), n = número de cuotas
```

Aplicado en: `View2.controller.js` y `Computador.controller.js`

### Formateo de moneda COP
```javascript
// Formato → "$ 1.500.000"
sap.ui.core.format.NumberFormat.getCurrencyInstance({
  currencyCode: false,
  customCurrencies: { "COP": { decimals: 0, "isoCode": "COP" } }
})
```

---

## Autenticación OAuth 2.0

Gestionada por `util/OAuthService.js`:
- **Grant type**: `client_credentials`
- **Token URL**: `/oauth/token`
- **Credenciales**: Codificadas en Base64 (Basic Auth)
- **Cache de token**: En memoria con margen de 60 segundos antes del vencimiento
- **Renovación**: Automática al detectar token próximo a vencer o inválido

---

## Componentes UI Usados

```
sap.m.App               → Contenedor de navegación raíz
sap.m.Page              → Contenedor de cada pantalla
sap.m.Wizard            → Formularios multi-paso
sap.m.WizardStep        → Pasos del wizard
sap.m.Select            → Selectores dropdown
sap.m.Input             → Campos de texto y moneda
sap.m.Button            → Acciones
sap.m.Label             → Etiquetas de campo
sap.m.VBox / HBox       → Layouts flexbox
sap.m.RadioButtonGroup  → Opciones Sí/No
sap.m.UploadCollection  → Carga de documentos
sap.ui.layout.form.SimpleForm (ResponsiveGridLayout) → Formularios
sap.ui.core.format.NumberFormat → Formato moneda COP
```

---

## Scripts NPM

```bash
npm start              # Servidor desarrollo en puerto 8080
npm run build          # Build producción en /dist
npm run start:local    # Servidor local con ui5-local.yaml
npm run start-noflp    # Sin Fiori Launchpad (index.html directo)
npm run deploy         # Despliegue a Cloud Foundry
npm run build:mta      # Genera archivo MTA para deploy
```

---

## Validaciones de Formulario

- Campos obligatorios usan `valueState="Error"` de UI5
- La navegación entre pasos del wizard requiere validación exitosa (`onValidateStep1`, etc.)
- Importe máximo se valida contra `MONTO_MAXIMO` del servicio
- Los campos de moneda convierten entre string formateado y número para cálculos

---

## Instrucciones Importantes para Desarrollo

1. **Agregar nueva vista**: Crear `webapp/view/[Nombre].view.xml` + `webapp/controller/[Nombre].controller.js` + entrada en `manifest.json` (routes y targets).

2. **Consumir un servicio backend**: Usar el destination nombreado dest_int_s a CPI configurado como Backend en los archivos ui5.yaml y ui5-local.yaml, este destination  token OAuth 2 automáticamente. `/http/*` en la url del servicio a consumir define la utilizacion del destination y el backend a utilizar.

3. **Datos del empleado**: Están en `globalData/userData` (disponible desde Component). No repetir la llamada al servicio en cada vista; leerlo del modelo global.

4. **Datos de catálogos** (motivos, tipos, listas): Están en `globalData` (gt_motcalamidad, etc.). Cargarlos una sola vez en `Viewini.controller.js`.

5. **Modelos de formulario por vista**: Crear un JSONModel local en el `onInit` del controlador con el estado inicial del formulario. No mezclar estado de formulario con `globalData`.

6. **Cálculo de cuotas**: Usar siempre la fórmula francesa. La tasa mensual para calamidad y computador es `0.015` (1,5%). Las vistas educativo y movilidad deben obtener la tasa del servicio.

7. **Validación de pasos**: Antes de avanzar en el wizard, llamar a una función `onValidateStep[N]()` que verifique todos los campos y aplique `valueState="Error"` a los inválidos.

8. **Formateo de moneda**: Siempre mostrar en COP con separador de miles (punto). Usar `_formatCurrency()` y `_parseMoneyValue()` ya implementados en los controladores de calamidad y computador — copiar ese patrón.

9. **Navegación de regreso**: Usar `this.getOwnerComponent().getRouter().navTo("RouteViewini")` o `history.go(-1)` con `sap/ui/core/routing/History`.

10. **Variables de entorno**: Las credenciales OAuth están hardcodeadas en `OAuthService.js`. En producción, estas se deben externalizar. No agregar más credenciales en código fuente.

11. **Proxy en desarrollo**: El servidor local proxy las llamadas `/http/*` a CPI. En producción, `xs-app.json` maneja las rutas con XSUAA. No modificar rutas sin actualizar ambos archivos.

12. **Tema y UX**: Usar componentes `sap.m.*` (librería Mobile-first). No mezclar con controles deprecated de `sap.ui.commons.*`. El tema `sap_horizon` es obligatorio.
