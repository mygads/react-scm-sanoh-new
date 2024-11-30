import { useEffect, useState } from "react";
import DeliveryNote from "./Pages/DN/DeliveryNote";
import WarehouseDeliveryNote from "./Pages/DN/WarehouseDeliveryNote";

const IndexDeliveryNote: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
  }, []);

  if (userRole === 'supplier-marketing' || userRole === 'supplier-subcont-marketing') {
    return <DeliveryNote />;
  } else if (userRole === 'admin-warehouse') {
    return <WarehouseDeliveryNote />;
  } else {
    return <div>No dashboard available for your role.</div>;
  }
};

export default IndexDeliveryNote;