export abstract class SequenceGeneratorPort {
  /**
   * Generates and returns the next sequential formatted number for the given document prefix code
   * (e.g. 'RESERVATION' -> 'RES-2026-0001') using an atomic row-lock in PostgreSQL.
   *
   * @param code The unique code of the document prefix in `ctl_document_prefix` (e.g. 'RESERVATION', 'INVOICE', 'PAYMENT')
   * @returns The generated formatted serial string
   */
  abstract next(code: string): Promise<string>;

  /**
   * Inspects and returns what the next formatted number will be without incrementing or locking the counter.
   *
   * @param code The unique code of the document prefix in `ctl_document_prefix`
   * @returns The projected formatted serial string
   */
  abstract peek(code: string): Promise<string>;
}

