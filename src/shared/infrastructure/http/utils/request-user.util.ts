import { Request } from 'express';

export interface RequestAuthUser {
  id?: string;
  user_name?: string;
  id_people?: string;
  permissions: string[];
}

export function extractRequestAuthUser(req: Request): RequestAuthUser | null {
  const rawUser: unknown = Reflect.get(req, 'user');
  if (typeof rawUser !== 'object' || rawUser === null) {
    return null;
  }

  const rawId: unknown = Reflect.get(rawUser, 'id');
  const rawUserName: unknown = Reflect.get(rawUser, 'user_name');
  const rawIdPeople: unknown = Reflect.get(rawUser, 'id_people');
  const rawPerms: unknown = Reflect.get(rawUser, 'permissions');

  const permissions = Array.isArray(rawPerms)
    ? rawPerms.filter((p): p is string => typeof p === 'string')
    : [];

  return {
    id: typeof rawId === 'string' ? rawId : undefined,
    user_name: typeof rawUserName === 'string' ? rawUserName : undefined,
    id_people: typeof rawIdPeople === 'string' ? rawIdPeople : undefined,
    permissions,
  };
}

