import { Permissions } from '../entities/permissions';
import { PermissionsId } from '../value-objects/permissions-value-object/permissions-id';
export abstract class PermissionsRepository {
  abstract create(permission: Permissions): Promise<void>;
  abstract update(permission: Permissions): Promise<void>;
  abstract findById(id: PermissionsId): Promise<Permissions | null>;
}
