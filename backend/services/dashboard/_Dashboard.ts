import hcRequestedByDepartment from "./hcRequestedByDepartment";
import hcByStatusAndExpectedOnboardMonth from "./hcByStatusAndExpectedOnboardMonth";
import hcByRecruiter from "./hcByRecruiter";
import hcRequestedByHrbp from "./hcRequestedByHrbp";
import hcRequestedByHiringManager from "./hcRequestedByHiringManager";
import hcRequestedByMonth from "./hcRequestedByMonth";
import jobHCTracking from "./jobHCTracking";

class Dashboard {
  static hcRequestedByDepartment = hcRequestedByDepartment;
  static hcByStatusAndExpectedOnboardMonth = hcByStatusAndExpectedOnboardMonth;
  static hcByRecruiter = hcByRecruiter;
  static hcRequestedByHrbp = hcRequestedByHrbp;
  static hcRequestedByHiringManager = hcRequestedByHiringManager;
  static hcRequestedByMonth = hcRequestedByMonth;
  static jobHCTracking = jobHCTracking;
}

export default Dashboard;
