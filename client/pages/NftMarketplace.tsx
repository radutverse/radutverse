import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/common/ComingSoon";

const NftMarketplace = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout title="NFT Marketplace" onLogoClick={() => navigate("/")}>
      <ComingSoon
        title="NFT Marketplace"
        description="Discover, list, and trade IP-backed NFTs in one unified marketplace. This feature is almost ready—stay tuned!"
      />
    </DashboardLayout>
  );
};

export default NftMarketplace;
