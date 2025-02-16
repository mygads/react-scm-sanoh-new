import { NavLink, useLocation } from "react-router-dom";

const PurchaseOrder = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const purchaseOrderPaths = [
        '/purchase-order', 
        '/purchase-order-detail'
    ];

    const isPurchaseOrderActive = purchaseOrderPaths.some(path => 
        currentPath.startsWith(path) || currentPath.includes(path)
    );

    return (
        <li>
            <NavLink
                to="/purchase-order"
                end
                className={
                `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium duration-300 ease-in-out ${
                    isPurchaseOrderActive
                    ? 'bg-graydark text-white'
                    : 'text-black-2 dark:text-bodydark2 hover:bg-graydark hover:text-white dark:hover:bg-meta-4'
                }`
                }
            >
                <svg
                className="fill-current"
                width="18"
                height="19"
                viewBox="0 0 18 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                >
                <g clipPath="url(#clip0_130_9756)">
                    <path
                    d="M17.6 5.16865L10.725 1.40694C10.5413 1.30544 10.3349 1.2522 10.125 1.2522C9.91513 1.2522 9.70869 1.30544 9.525 1.40694L2.65 5.17022C2.45366 5.27764 2.28977 5.43581 2.17543 5.6282C2.06109 5.8206 2.00051 6.04016 2 6.26397V13.7358C2.00051 13.9596 2.06109 14.1792 2.17543 14.3716C2.28977 14.564 2.45366 14.7222 2.65 14.8296L9.525 18.5929C9.70869 18.6944 9.91513 18.7476 10.125 18.7476C10.3349 18.7476 10.5413 18.6944 10.725 18.5929L17.6 14.8296C17.7963 14.7222 17.9602 14.564 18.0746 14.3716C18.1889 14.1792 18.2495 13.9596 18.25 13.7358V6.26475C18.2499 6.04055 18.1895 5.82049 18.0752 5.62765C17.9608 5.43481 17.7967 5.27627 17.6 5.16865ZM10.125 2.50069L16.4023 5.93819L14.0758 7.21084L7.79844 3.77334L10.125 2.50069ZM10.125 9.37569L3.84766 5.93819L6.49687 4.4874L12.7742 7.9249L10.125 9.37569ZM17 13.739L10.75 17.1601V10.4562L13.25 9.08819V11.8757C13.25 12.0414 13.3158 12.2004 13.4331 12.3176C13.5503 12.4348 13.7092 12.5007 13.875 12.5007C14.0408 12.5007 14.1997 12.4348 14.3169 12.3176C14.4342 12.2004 14.5 12.0414 14.5 11.8757V8.40381L17 7.03584V13.7358V13.739Z"
                    fill=""
                    />
                </g>
                <defs>
                    <clipPath id="clip0_130_9756">
                    <rect
                        width="18"
                        height="18"
                        fill="white"
                        transform="translate(0 0.052124)"
                    />
                    </clipPath>
                </defs>
                </svg>
                Purchase Order
            </NavLink>
        </li>
    );
};

export default PurchaseOrder;