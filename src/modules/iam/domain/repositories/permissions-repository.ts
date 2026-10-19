import { Permissions } from '@/modules/iam/domain/entities/permissions.entity';
import { PermissionsId } from '@/modules/iam/domain/value-objects/security/permissions-value-object/permissions-id';
export abstract class PermissionsRepository {
  abstract create(permission: Permissions): Promise<void>;
  abstract update(permission: Permissions): Promise<void>;
  abstract findById(id: PermissionsId): Promise<Permissions | null>;
}
