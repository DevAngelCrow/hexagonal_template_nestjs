export class AuthLoginHttpDto {
  // The refresh token is intentionally NOT part of the response body: it is
  // delivered only through an HttpOnly cookie so client-side JavaScript can
  // never read it (OWASP mitigation against token theft via XSS).
  constructor(
    public readonly user_name: string,
    public readonly id: string,
    public readonly access_token: string,
    public readonly token_type: string = 'Bearer',
    public readonly user: string,
  ) {}
}
