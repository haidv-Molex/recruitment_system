import create from "@services/user/create";
import findById from "@services/user/findById";
import findByAccount from "@services/user/findByAccount";
import comparePassword from "@services/user/comparePassword";
import checkUserBanned from "@services/user/checkUserBanned";
import deleteAccount from "@services/user/deleteAccount";
import isAdmin from "@services/user/isAdmin";
import createHR from "@services/user/createHR";

class User {
  static create = create;
  static findById = findById;
  static findByAccount = findByAccount;
  static comparePassword = comparePassword;
  static checkUserBanned = checkUserBanned;
  static deleteAccount = deleteAccount;
  static isAdmin = isAdmin;
  static createHR = createHR;
}

export default User;
