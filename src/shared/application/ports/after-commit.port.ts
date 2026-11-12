/**
 * Programa efectos secundarios (p. ej. borrar archivos reemplazados o notificar
 * servicios externos) que solo deben ejecutarse una vez que la transacción
 * activa haya hecho commit. Si no hay transacción activa, el hook se ejecuta
 * de inmediato.
 */
export abstract class AfterCommitPort {
  abstract run(hook: () => Promise<void> | void): Promise<void>;
}
