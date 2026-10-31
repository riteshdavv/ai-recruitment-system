import react from "react";
import WelcomeContainer from './_components/WelcomeContainer';
import CreateOptions from "./_components/CreateOptions";
import RecentInterviews from "./_components/RecentInterviews";

function DashboardC() {
    return (
      <div className="space-y-6 py-2">
        <WelcomeContainer />
        <CreateOptions />
        <RecentInterviews />
      </div>
    );
  }
  
export default DashboardC;
