import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { useState } from 'react';

import {
  IndianRupee,
  ShoppingCart,
  Users,
  Receipt
} from 'lucide-react';

const OwnerDashboard = () => {

  const [sidebarOpen,setSidebarOpen] =
    useState(false);

  return (

    <div className="dashboard-layout">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-content">

        <Header
          title="Owner Dashboard"
          user={{
            name:'Admin',
            role:'OWNER'
          }}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <div className="page-content">

          <div className="dashboard-grid">

            <DashboardCard
              title="Today's Revenue"
              value="₹25,400"
              growth="12"
              growthType="up"
              subtitle="Compared to yesterday"
              icon={<IndianRupee size={28} />}
            />

            <DashboardCard
              title="Orders"
              value="182"
              growth="8"
              growthType="up"
              subtitle="Today's orders"
              icon={<ShoppingCart size={28} />}
            />

            <DashboardCard
              title="Customers"
              value="94"
              growth="5"
              growthType="up"
              subtitle="Today's customers"
              icon={<Users size={28} />}
            />

            <DashboardCard
              title="GST Collection"
              value="₹4,520"
              growth="6"
              growthType="up"
              subtitle="GST collected today"
              icon={<Receipt size={28} />}
            />

          </div>

        </div>

      </div>

    </div>

  );
};

export default OwnerDashboard;
