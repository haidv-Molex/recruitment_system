type UserCreate = (typeof import("@services/user/create"))["default"];
type UserFindById = (typeof import("@services/user/findById"))["default"];
type UserFindByAccount = (typeof import("@services/user/findByAccount"))["default"];
type UserComparePassword = (typeof import("@services/user/comparePassword"))["default"];
type UserCheckUserBanned = (typeof import("@services/user/checkUserBanned"))["default"];
type UserDeleteAccount = (typeof import("@services/user/deleteAccount"))["default"];
type UserIsAdmin = (typeof import("@services/user/isAdmin"))["default"];
type UserCreateHR = (typeof import("@services/user/createHR"))["default"];
type UserUpdatePassword = (typeof import("@services/user/updatePassword"))["default"];
type UserUpdateProfile = (typeof import("@services/user/updateProfile"))["default"];
type UserChangeRole = (typeof import("@services/user/changeRole"))["default"];
type UserGetAll = (typeof import("@services/user/getAll"))["default"];
type UserGetRoles = (typeof import("@services/user/getRoles"))["default"];

class User {
  static async create(...args: Parameters<UserCreate>): Promise<Awaited<ReturnType<UserCreate>>> {
    const { default: create } = await import("@services/user/create");
    return await create(...args);
  }

  static async findById(...args: Parameters<UserFindById>): Promise<Awaited<ReturnType<UserFindById>>> {
    const { default: findById } = await import("@services/user/findById");
    return await findById(...args);
  }

  static async findByAccount(...args: Parameters<UserFindByAccount>): Promise<Awaited<ReturnType<UserFindByAccount>>> {
    const { default: findByAccount } = await import("@services/user/findByAccount");
    return await findByAccount(...args);
  }

  static async comparePassword(...args: Parameters<UserComparePassword>): Promise<Awaited<ReturnType<UserComparePassword>>> {
    const { default: comparePassword } = await import("@services/user/comparePassword");
    return await comparePassword(...args);
  }

  static async checkUserBanned(...args: Parameters<UserCheckUserBanned>): Promise<Awaited<ReturnType<UserCheckUserBanned>>> {
    const { default: checkUserBanned } = await import("@services/user/checkUserBanned");
    return await checkUserBanned(...args);
  }

  static async deleteAccount(...args: Parameters<UserDeleteAccount>): Promise<Awaited<ReturnType<UserDeleteAccount>>> {
    const { default: deleteAccount } = await import("@services/user/deleteAccount");
    return await deleteAccount(...args);
  }

  static async isAdmin(...args: Parameters<UserIsAdmin>): Promise<Awaited<ReturnType<UserIsAdmin>>> {
    const { default: isAdmin } = await import("@services/user/isAdmin");
    return await isAdmin(...args);
  }

  static async createHR(...args: Parameters<UserCreateHR>): Promise<Awaited<ReturnType<UserCreateHR>>> {
    const { default: createHR } = await import("@services/user/createHR");
    return await createHR(...args);
  }

  static async updatePassword(...args: Parameters<UserUpdatePassword>): Promise<Awaited<ReturnType<UserUpdatePassword>>> {
    const { default: updatePassword } = await import("@services/user/updatePassword");
    return await updatePassword(...args);
  }

  static async updateProfile(...args: Parameters<UserUpdateProfile>): Promise<Awaited<ReturnType<UserUpdateProfile>>> {
    const { default: updateProfile } = await import("@services/user/updateProfile");
    return await updateProfile(...args);
  }

  static async changeRole(...args: Parameters<UserChangeRole>): Promise<Awaited<ReturnType<UserChangeRole>>> {
    const { default: changeRole } = await import("@services/user/changeRole");
    return await changeRole(...args);
  }

  static async getAll(...args: Parameters<UserGetAll>): Promise<Awaited<ReturnType<UserGetAll>>> {
    const { default: getAll } = await import("@services/user/getAll");
    return await getAll(...args);
  }

  static async getRoles(...args: Parameters<UserGetRoles>): Promise<Awaited<ReturnType<UserGetRoles>>> {
    const { default: getRoles } = await import("@services/user/getRoles");
    return await getRoles(...args);
  }
}

export default User;
