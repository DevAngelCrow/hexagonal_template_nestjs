import { Rol } from '@/modules/iam/domain/entities/rol.entity';
import { RolId } from '@/modules/iam/domain/value-objects/security/rol-value-object/rol-id';

export abstract class RolRepository {
  abstract create(rol: Rol): Promise<void>;
  abstract update(rol: Rol): Promise<void>;
  abstract findById(id: RolId): Promise<Rol | null>;
}
