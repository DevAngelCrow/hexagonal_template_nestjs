import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AuthReadPort, SessionDto } from '@/modules/iam/application/auth/ports/auth-read.port';
import { GetSessionsQuery } from '@/modules/iam/application/auth/queries/get-sessions/get-sessions.query';

@QueryHandler(GetSessionsQuery)
export class GetSessionsHandler implements IQueryHandler<GetSessionsQuery> {
  constructor(private readonly authReadPort: AuthReadPort) {}

  async execute(query: GetSessionsQuery): Promise<SessionDto[]> {
    return this.authReadPort.getSessionsByUser(query.userId);
  }
}
