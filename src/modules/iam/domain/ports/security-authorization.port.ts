import { Menu, MenuNode } from '@/modules/iam/domain/entities/menu.entity';

export abstract class SecurityAuthorizationPort {
  abstract hasRole(role: string[], id_user: string): Promise<boolean>;
  abstract checkPermission(
    permission: string,
    id_user: string,
  ): Promise<boolean>;
  abstract filterRoutesForUser(id_user: string): Promise<Menu<MenuNode>[]>;
  abstract getUserProfileImg(id_user: string): Promise<string | null>;
}
