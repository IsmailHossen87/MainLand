import { User } from '../app/modules/user/user.model';
import config from '../config';
import { USER_ROLES } from '../enums/user';
import { logger } from '../shared/logger';
import bcrypt from 'bcrypt';

const password = config.super_admin.password as string;
const bcryptPass = bcrypt.hashSync(password, 10);
const payload = {
    name: 'Gbenga',
    email: config.super_admin.email,
    role: USER_ROLES.ADMIN,
    password: bcryptPass,
    verified: true,
};

export const seedSuperAdmin = async () => {
    const isExistSuperAdmin = await User.findOne({
        email: config.super_admin.email,
        role: USER_ROLES.ADMIN,
    });
    if (!isExistSuperAdmin) {
        await User.create(payload);
        logger.info('✨ Admin account has been successfully created!');
    }
};
