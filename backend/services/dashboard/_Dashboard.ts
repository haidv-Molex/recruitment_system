import hcRequestedByDepartment from "./hcRequestedByDepartment";
import hcByStatusAndExpectedOnboardMonth from "./hcByStatusAndExpectedOnboardMonth";
import hcByRecruiter from "./hcByRecruiter";
import hcRequestedByHrbp from "./hcRequestedByHrbp";
import hcRequestedByHiringManager from "./hcRequestedByHiringManager";
import hcRequestedByMonth from "./hcRequestedByMonth";

class Dashboard {
  static hcRequestedByDepartment = hcRequestedByDepartment;
  static hcByStatusAndExpectedOnboardMonth = hcByStatusAndExpectedOnboardMonth;
  static hcByRecruiter = hcByRecruiter;
  static hcRequestedByHrbp = hcRequestedByHrbp;
  static hcRequestedByHiringManager = hcRequestedByHiringManager;
  static hcRequestedByMonth = hcRequestedByMonth;
}

export default Dashboard;
