import create from "@services/user/create";
import findById from "@services/user/findById";
import findByAccount from "@services/user/findByAccount";
import comparePassword from "@services/user/comparePassword";
import checkUserBanned from "@services/user/checkUserBanned";
import deleteAccount from "@services/user/deleteAccount";
import isAdmin from "@services/user/isAdmin";
import createHR from "@services/user/createHR";
import updatePassword from "@services/user/updatePassword";
import updateProfile from "@services/user/updateProfile";

class User {
  static create = create;
  static findById = findById;
  static findByAccount = findByAccount;
  static comparePassword = comparePassword;
  static checkUserBanned = checkUserBanned;
  static deleteAccount = deleteAccount;
  static isAdmin = isAdmin;
  static createHR = createHR;
  static updatePassword = updatePassword;
  static updateProfile = updateProfile;
}

export default User;
