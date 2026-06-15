import hcRequestedByDepartment from "./hcRequestedByDepartment";
import hcByStatusAndExpectedOnboardMonth from "./hcByStatusAndExpectedOnboardMonth";
import hcByRecruiter from "./hcByRecruiter";
import hcRequestedByHrbp from "./hcRequestedByHrbp";
import hcRequestedByHiringManager from "./hcRequestedByHiringManager";

class Dashboard {
  static hcRequestedByDepartment = hcRequestedByDepartment;
  static hcByStatusAndExpectedOnboardMonth = hcByStatusAndExpectedOnboardMonth;
  static hcByRecruiter = hcByRecruiter;
  static hcRequestedByHrbp = hcRequestedByHrbp;
  static hcRequestedByHiringManager = hcRequestedByHiringManager;
}

export default Dashboard;
