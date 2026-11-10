import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilterRoutesUserHandler } from '@/modules/iam/application/security/queries/authorization/filter-routes-user/queries/filter-routes-user.handler';
import { GetMenuUserQuery } from '@/modules/iam/application/security/queries/menu/get-menu-user/get-menu-user.query';
import { Menu, MenuNode } from '@/modules/iam/domain/entities/menu.entity';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';

export interface MenuUserResult<T = MenuNode> {
  menus: Menu<T>[];
  profile_img: string | null;
}

@QueryHandler(GetMenuUserQuery)
export class GetMenuUserHandler implements IQueryHandler<GetMenuUserQuery> {
  constructor(
    private readonly filterUserMenu: FilterRoutesUserHandler,
    private readonly securityAuthorizationPort: SecurityAuthorizationPort,
  ) {}
  async execute(query: GetMenuUserQuery): Promise<MenuUserResult<MenuNode>> {
    const id_user = query.user_id;
    const [menus, profile_img] = await Promise.all([
      this.filterUserMenu.execute({ id_user }),
      this.securityAuthorizationPort.getUserProfileImg(id_user),
    ]);
    return { menus, profile_img };
  }
}
