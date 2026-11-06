import { IUser, UserRole } from '../../models/User.model';
import { signAccessToken } from '../../utils/jwt.utils';

export const authHeaderFor = (user: IUser, roleOverride?: UserRole): { Authorization: string } => {
  const token = signAccessToken({
    userId: user._id.toString(),
    role: roleOverride || user.role,
    sellerId: user.sellerId ? user.sellerId.toString() : null,
  });

  return {
    Authorization: `Bearer ${token}`,
  };
};
