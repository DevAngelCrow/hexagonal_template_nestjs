---
name: fullstack-contract-sync
description: Use this skill when the user wants to synchronize or auto-generate frontend TypeScript interfaces, forms, and Axios HTTP services in vue-3-template from backend NestJS DTOs, controllers, or OpenAPI contracts in hexagonal_template_nestjs.
---

# Sincronizador de Contratos Fullstack (NestJS -> Vue 3)

Esta habilidad guía la sincronización rigurosa de contratos de datos entre `hexagonal_template_nestjs` y `vue-3-template`, evitando discrepancias de nombres de propiedades, tipos de datos o endpoints HTTP.

---

## 1. Mapeo Conceptual de Tipos

| En `hexagonal_template_nestjs` | En `vue-3-template` | Archivo Destino en Vue 3 |
| :--- | :--- | :--- |
| `[Entidad]HttpDto` (Salida) | `[Entidad]Item` (Interface) | `src/modules/<modulo>/interfaces/<entidad>.response.interface.ts` |
| `Create[Entidad]Dto` (Entrada) | `[Entidad]Form` (Interface) | `src/modules/<modulo>/interfaces/<entidad>.form.interface.ts` |
| `Get[Entidad]QueryDto` (Filtros) | `FilterType` | `src/modules/<modulo>/composables/use[Entidad].ts` |
| Métodos del `[Entidad]Controller` | Funciones del `[entidad]Services` | `src/modules/<modulo>/services/<entidad>.services.ts` |
| Ruta `@Controller('slug')` | Prefijo de URL en `httpClient` | `src/modules/<modulo>/services/<entidad>.services.ts` |

---

## 2. Procedimiento de Sincronización

### Paso 1: Inspeccionar el Endpoint y DTOs en NestJS

1. Abrir `src/modules/<modulo>/infrastructure/controllers/<entidad>.controller.ts`.
   - Identificar el prefijo `@Controller('slug')`.
   - Identificar las rutas `@Get()`, `@Post()`, `@Put(':id')`, `@Patch(':id')`, `@Delete(':id')`.
2. Abrir los DTOs en `src/modules/<modulo>/infrastructure/dtos/`:
   - DTO de entrada: `validators/<entidad>/create-<entidad>.dto.ts`
   - DTO de salida: `http/<entidad>-http.dto.ts`

### Paso 2: Generar las Interfaces en Vue 3

Crear en `vue-3-template/src/modules/<modulo>/interfaces/`:

1. `<entidad>.response.interface.ts`:
   - Mapear cada propiedad de `[Entidad]HttpDto` a tipos TypeScript puros (`string`, `number`, `boolean`, `Date`).
   - Evitar tipos `any`.

2. `<entidad>.form.interface.ts`:
   - Mapear las propiedades del `Create[Entidad]Dto`.
   - Si tiene `id`, marcarlo como opcional `id?: string;`.

### Paso 3: Generar el Servicio HTTP en Vue 3

Crear en `vue-3-template/src/modules/<modulo>/services/<entidad>.services.ts`:
- Importar `httpClient` desde `@/core/utils/httpClient`.
- Retornar `Promise<ApiResponseGeneric<Item[]>>` para listados paginados.
- Retornar `Promise<ApiPostResponse<Item>>` o `Promise<ApiPostResponse<null>>` para mutaciones.

### Paso 4: Generar las Query Keys y Composable

En `vue-3-template/src/modules/<modulo>/composables/use[Entidad].ts`:
- Inicializar `createQueryKeys('slug-entidad')`.
- Enlazar la mutación `onSuccess` con la invalidación de la query key `[entidad]Keys.all`.

---

## 3. Validación

Ejecutar en ambos proyectos:
```bash
# En hexagonal_template_nestjs
npm run check

# En vue-3-template
npm run check:types
npm run lint
```
Garantizar que no existan discrepancias entre los modelos salientes del backend y los entrantes del frontend.
