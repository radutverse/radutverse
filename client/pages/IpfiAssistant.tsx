import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/common/ComingSoon";

const IpfiAssistant = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout title="IPFi Assistant" onLogoClick={() => navigate("/")}>
      <ComingSoon
        title="IPFi Assistant"
        description="The IPFi Assistant experience is in development. Check back soon for powerful financial tooling tailored to your intellectual property needs."
      />
    </DashboardLayout>
  );
};

export default IpfiAssistant;
