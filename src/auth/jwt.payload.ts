import { Role } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  roles: Role[];
}
