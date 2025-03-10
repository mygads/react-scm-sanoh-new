import Dashboard from "./component/Dashboard";
import PurchaseOrder from "./component/PurchaseOrder";
import DeliveryNote from "./component/DeliveryNote";
import StockItems from "./component/StockItems";
import TransactionSubcont from "./component/TransactionSubcont";
import TransactionsReport from "./component/TransactionsReport";
import HistoryPurchaseOrder from "./component/HistoryPurchaseOrder";
import HistoryDeliveryNote from "./component/HistoryDeliveryNote";
import PerformanceReport from "./component/PerformanceReport";
import ForecastReport from "./component/ForecastReport";

export const SupplierSubcontMarketing = () => {
    return (
        <div>
            <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2  dark:text-bodydark2">
                SUPPLIER MENU 
                </h3>
                <ul className="mb-6 flex flex-col gap-1.5">
                    {/* <!-- Menu Item Dashboard --> */}            
                    <Dashboard />
                    {/* <!-- Menu Item Dashboard --> */}

                    {/* <!-- Menu Item Purchase Order --> */}
                    <PurchaseOrder />
                    {/* <!-- Menu Item Purchase Order --> */}

                    {/* <!-- Menu Item Delivery Note --> */}
                    <DeliveryNote />
                    {/* <!-- Menu Item Delivery Note --> */}
                </ul>
            </div>

            {/* <!-- Subcontractor Group --> */}
            <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2 dark:text-bodydark2">
                SUBCONTRACTOR
                </h3>

                <ul className="mb-6 flex flex-col gap-1.5">
                {/* <!-- Menu Item Stock Items --> */}
                <StockItems />
                {/* <!-- Menu Item Stock Items --> */}

                {/* <!-- Menu Item Transaction --> */}
                <TransactionSubcont />
                {/* <!-- Menu Item Transaction --> */}
                
                {/* <!-- Menu Item Report Transactions --> */}
                <TransactionsReport />
                {/* <!-- Menu Item Report Transaction --> */}

                </ul>
            </div>

            {/* <!-- History Group --> */}
            <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2 dark:text-bodydark2">
                HISTORY
                </h3>

                <ul className="mb-6 flex flex-col gap-1.5">
                {/* <!-- Menu Item History Purchase Order --> */}
                <HistoryPurchaseOrder />
                {/* <!-- Menu Item History Purchase Order --> */}

                {/* <!-- Menu Item History Delivery Note --> */}
                <HistoryDeliveryNote />
                {/* <!-- Menu Item History Delivery Note --> */}

                </ul>
            </div>

            {/* <!-- OTHER Group --> */}
            <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2 dark:text-bodydark2">
                OTHER
                </h3>

                    <ul className="mb-6 flex flex-col gap-1.5">
                    {/* <!-- Menu Item Performance Report --> */}
                    <PerformanceReport />
                    {/* <!-- Menu Item Performance Report --> */}

                    {/* <!-- Menu Item Forecast Report --> */}
                    <ForecastReport />
                    {/* <!-- Menu Item Forecast Report --> */}
                </ul>
            </div>
        </div>
    )
}