import React, { useState, useEffect, ChangeEvent } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';
import { API_Delete_Item_Subcont_Admin, API_List_Partner_Admin, API_Manage_Item_Subcont_Admin, API_Update_Item_Subcont_Admin } from '../../../api/api';
import Swal from 'sweetalert2';
import Button from '../../../components/Forms/Button';

interface SupplierOption {
    value: string;
    label: string;
}

interface Item {
    item_id: string;
    part_number: string;
    part_name: string;
    old_part_name: string;
    min_stock_incoming: number | string; // Added
    min_stock_outgoing: number | string; // Added
    status: string;
    isEditing?: boolean;
    isLoading?: boolean;
    editedPartNumber?: string;
    editedPartName?: string;
    editedOldPartName?: string;
    editedMinStockIncoming?: number | string; // Added
    editedMinStockOutgoing?: number | string; // Added
}

const ManageItems: React.FC = () => {
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        const savedSupplierCode = localStorage.getItem('selected_supplier');
            if (savedSupplierCode && suppliers.length > 0) {
                const savedSupplier = suppliers.find(
                    (sup: SupplierOption) => sup.value === savedSupplierCode
            );
            if (savedSupplier) {
                setSelectedSupplier(savedSupplier);
                fetchItems(savedSupplier.value);
            }
        }
    }, [suppliers]);

    const fetchSuppliers = async () => {
        const token = localStorage.getItem('access_token');
        try {
        const response = await fetch(API_List_Partner_Admin(), {
            method: 'GET',
            headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Failed to fetch suppliers');

        const result = await response.json();
        const suppliersList = result.data.map((supplier: any) => ({
            value: supplier.bp_code,
            label: `${supplier.bp_code} | ${supplier.bp_name}`,
        }));

        setSuppliers(suppliersList);
        } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Failed to fetch suppliers list');
        }
    };

    const fetchItems = async (supplierCode: string) => {
        const token = localStorage.getItem('access_token');
        setLoading(true);
        try {
            const response = await fetch(`${API_Manage_Item_Subcont_Admin()}${supplierCode}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch items');

            const result = await response.json();
            const itemsList = result.data.map((item: any) => ({
                item_id: item.item_id,
                part_number: item.part_number || '-',
                part_name: item.part_name || '-',
                old_part_name: item.old_part_name || '-',
                min_stock_incoming: item.min_stock_incoming ?? null, // Added - Use ?? 0 to default if null/undefined
                min_stock_outgoing: item.min_stock_outgoing ?? null, // Added - Use ?? 0 to default if null/undefined
                status: item.status === "1" ? 'Active' : 'Deactive',
            }));

            setItems(itemsList);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching items:', error);
            toast.error('Failed to fetch items');
            setLoading(false);
        }

        setLoading(false);
    };

    const handleSupplierChange = (selectedOption: SupplierOption | null) => {
        setSelectedSupplier(selectedOption);
        if (selectedOption) {
            localStorage.setItem('selected_supplier', selectedOption.value);
            fetchItems(selectedOption.value);
        } else {
            localStorage.removeItem('selected_supplier');
            setItems([]);
        }
    };

    const handleEdit = (itemId: string) => {
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.item_id === itemId
                ? {
                    ...item,
                    isEditing: true,
                    editedPartNumber: item.part_number === '-' ? '' : item.part_number,
                    editedPartName: item.part_name === '-' ? '' : item.part_name,
                    editedOldPartName: item.old_part_name === '-' ? '' : item.old_part_name,
                    editedMinStockIncoming: item.min_stock_incoming, // Added
                    editedMinStockOutgoing: item.min_stock_outgoing, // Added
                    part_number: item.part_number === '-' ? '' : item.part_number, 
                    part_name: item.part_name === '-' ? '' : item.part_name,
                    old_part_name: item.old_part_name === '-' ? '' : item.old_part_name
                }
                : item
            )
        );
    };

    const handleCancel = (itemId: string) => {
        setItems((prevItems) =>
        prevItems.map((item) => (item.item_id === itemId ? { ...item, isEditing: false } : item))
        );
    };

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement>,
        itemId: string,
        field: 'part_number' | 'part_name' | 'old_part_name' | 'min_stock_incoming' | 'min_stock_outgoing' // Added new fields
    ) => {
        const value = e.target.value;
        setItems((prevItems) =>
        prevItems.map((item) => (item.item_id === itemId ? { ...item, [field]: value } : item))
        );
    };

    const handleSubmit = async (itemId: string) => {
        const token = localStorage.getItem('access_token');
        const item = items.find((item) => item.item_id === itemId);
        if (!item) return;

        const payload: any = { sub_item_id: itemId };

        if (item.part_number !== item.editedPartNumber) {
            payload.part_number = item.part_number;
        }

        if (item.part_name !== item.editedPartName) {
            payload.part_name = item.part_name;
        }

        if (item.old_part_name !== item.editedOldPartName) {
            payload.old_part_name = item.old_part_name;
        }

        // Added checks for new fields
        if (item.min_stock_incoming !== item.editedMinStockIncoming) {
             // Convert to number if it's a valid number string, otherwise handle potential errors or send as is depending on API expectation
            const incomingStock = Number(item.min_stock_incoming);
            payload.min_stock_incoming = isNaN(incomingStock) ? item.min_stock_incoming : incomingStock;
        }
        if (item.min_stock_outgoing !== item.editedMinStockOutgoing) {
            // Convert to number if it's a valid number string
            const outgoingStock = Number(item.min_stock_outgoing);
            payload.min_stock_outgoing = isNaN(outgoingStock) ? item.min_stock_outgoing : outgoingStock;
        }


        // Only send request if there's something to update besides the ID
        if (Object.keys(payload).length <= 1) {
             setItems((prevItems) =>
                prevItems.map((itm) =>
                    itm.item_id === itemId ? { ...itm, isEditing: false } : itm
                )
            );
            toast.info("No changes detected.");
            return; // Exit if no actual changes were made
        }

        try {
            const response = await fetch(API_Update_Item_Subcont_Admin(), {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (responseData.status === true) {
                setItems((prevItems) =>
                    prevItems.map((itm) =>
                        itm.item_id === itemId ? { ...itm, isEditing: false } : itm
                    )
                );

                toast.success(responseData.message);
            }

            if (!response.ok) throw new Error('Failed to update item');

        } catch (error) {
            console.error('Error updating item:', error);
            toast.error('Failed to update item');
        }
    };

    const handleStatusChange = async (itemId: string, status: string) => {
        const token = localStorage.getItem('access_token');
        const newStatus = status === 'Active' ? '0' : '1';
        try {
            const response = await fetch(API_Update_Item_Subcont_Admin(), {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sub_item_id: itemId,
                    status: newStatus,
                }),
            });

            if (!response.ok) throw new Error('Failed to update status');
            
            const responseData = await response.json();

            if (responseData.status === true) {
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.item_id === itemId
                            ? { ...item, status: newStatus === '1' ? 'Active' : 'Deactive', isLoading: false }
                            : item
                    )
                );
                toast.success(responseData.message);
            } else {
                throw new Error(responseData.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.item_id === itemId
                        ? { ...item, isLoading: false }
                        : item
                )
            );
        }
    };

    const handleSelectItem = (id: string) => {
        setSelectedItemIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItemIds.length === items.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(items.map(item => item.item_id));
        }
    };

    const handleDeleteSelected = async () => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'These items will be deleted permanently!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e3a8a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        });
        if (!confirm.isConfirmed) return;
        for (const id of selectedItemIds) {
            await handleDelete(id);
        }
        setSelectedItemIds([]);
    };

    const handleDelete = async (itemId: string) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(API_Delete_Item_Subcont_Admin(), {
                method: 'DELETE',
                headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sub_item_id: itemId }),
            });
            const responseData = await response.json();
            if (responseData.status === true) {
                setItems((prevItems) => prevItems.filter((item) => item.item_id !== itemId));
                toast.success(responseData.message);
            }
            if (!response.ok) throw new Error('Failed to delete item');
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
        }
    };

    return (
        <>
        <Breadcrumb pageName='Manage Items' />
        <ToastContainer position="top-right" />
        {/* Breadcrumb component if you have one */}
        <div className="bg-white">
            <div className="p-2 md:p-4 lg:p-6 space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-4">
                <Button
                    title="Add Items"
                    onClick={() => navigate('/add-items')}
                    icon={FaPlus}
                />
                {selectedItemIds.length > 0 && (
                    <Button
                        title="Delete Selected"
                        color="bg-danger"
                        onClick={handleDeleteSelected}
                        icon={FaTrash}
                    />
                )}
                <Button
                    title={selectedItemIds.length === items.length ? 'Unselect All' : 'Select All'}
                    onClick={handleSelectAll}
                    className="bg-primary text-white font-medium px-4 py-2 rounded-md transition duration-200 ease-in-out flex items-center gap-2"
                />
            </div>

            {/* Supplier Selection */}
            <div className='w-full md:w-1/3'>
                <Select
                options={suppliers}
                value={selectedSupplier}
                onChange={handleSupplierChange}
                placeholder="Select Supplier"
                className="w-full"
                isClearable
                required
                />
            </div>

            {/* Items Table */}
            {loading ? (
                <p>Loading items...</p>
            ) : (
                items.length > 0 ? (
                <div className="relative overflow-auto shadow-md rounded-lg border border-gray-300">
                    <table className="w-full text-sm ">
                        <thead className="bg-gray-50 text-center font-bold">
                            <tr>
                                <th className="px-1 py-3.5 text-sm font-bold text-gray-700 border w-[5%]">
                                    SELECT
                                </th>
                                <th className="px-1 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border-x border-b w-[5%]">
                                    NO
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[15%]"> {/* Adjusted width */}
                                    PART NUMBER
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[15%]"> {/* Adjusted width */}
                                    PART NAME
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[15%]"> {/* Adjusted width */}
                                    OLD PART NAME
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[10%]"> {/* Added */}
                                    MIN STOCK INCOMING
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[10%]"> {/* Added */}
                                    MIN STOCK OUTGOING
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[10%]">
                                    STATUS
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[10%]">
                                    ACTION
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.map((item, index) => (
                                <tr key={item.item_id} className="hover:bg-gray-50">
                                    <td className="px-3 py-3 text-center border">
                                        <input
                                            type="checkbox"
                                            checked={selectedItemIds.includes(item.item_id)}
                                            onChange={() => handleSelectItem(item.item_id)}
                                        />
                                    </td>
                                    <td className="px-3 py-3 text-center border">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-3 text-center border">
                                        {item.isEditing ? (
                                            <input
                                                type="text"
                                                value={item.part_number}
                                                onChange={(e) => handleInputChange(e, item.item_id, 'part_number')}
                                                className="border border-gray-300 rounded p-1 w-full"
                                            />
                                        ) : (
                                            item.part_number
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-center border">
                                        {item.isEditing ? (
                                            <input
                                                type="text"
                                                value={item.part_name}
                                                onChange={(e) => handleInputChange(e, item.item_id, 'part_name')}
                                                className="border border-gray-300 rounded p-1 w-full"
                                            />
                                        ) : (
                                            item.part_name
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-center border">
                                        {item.isEditing ? (
                                            <input
                                                type="text"
                                                value={item.old_part_name}
                                                onChange={(e) => handleInputChange(e, item.item_id, 'old_part_name')}
                                                className="border border-gray-300 rounded p-1 w-full"
                                            />
                                        ) : (
                                            item.old_part_name
                                        )}
                                    </td>
                                    {/* Added TD for Min Stock Incoming */}
                                    <td className="px-3 py-3 text-center border">
                                        {item.isEditing ? (
                                            <input
                                                type="number" // Use type number for stock
                                                value={item.min_stock_incoming}
                                                onChange={(e) => handleInputChange(e, item.item_id, 'min_stock_incoming')}
                                                className="border border-gray-300 rounded p-1 w-full"
                                                min="0" // Optional: prevent negative numbers
                                            />
                                        ) : (
                                            item.min_stock_incoming || '-'
                                        )}
                                    </td>
                                    {/* Added TD for Min Stock Outgoing */}
                                    <td className="px-3 py-3 text-center border">
                                        {item.isEditing ? (
                                            <input
                                                type="number" // Use type number for stock
                                                value={item.min_stock_outgoing}
                                                onChange={(e) => handleInputChange(e, item.item_id, 'min_stock_outgoing')}
                                                className="border border-gray-300 rounded p-1 w-full"
                                                min="0" // Optional: prevent negative numbers
                                            />
                                        ) : (
                                            item.min_stock_outgoing || '-'
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-center whitespace-nowrap border">
                                        {item.isLoading ? (
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900">
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    const updatedItems = items.map(i =>
                                                        i.item_id === item.item_id ? { ...i, isLoading: true } : i
                                                    );
                                                    setItems(updatedItems);
                                                    await handleStatusChange(item.item_id, item.status);
                                                }}
                                                className="hover:opacity-80 transition-opacity"
                                            >
                                                {item.status === 'Active' ?
                                                    <FaToggleOn className="text-3xl text-blue-900" /> :
                                                    <FaToggleOff className="text-3xl text-gray-400" />
                                                }
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-center border">
                                    {item.isEditing ? (
                                        <>
                                            <button
                                                onClick={() => handleSubmit(item.item_id)}
                                                className="bg-blue-900 text-white px-2 py-1 rounded mr-2"
                                            >
                                                Submit
                                            </button>
                                            <button
                                                onClick={() => handleCancel(item.item_id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => handleEdit(item.item_id)}
                                                className="hover:opacity-80 transition-opacity"
                                                >
                                                <FaEdit className='text-2xl text-blue-900' />
                                            </button>
                                        </div>
                                    )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                ) : (
                selectedSupplier && <p>No items found for this supplier.</p>
                )
            )}
            </div>
        </div>
        </>
    );
};

export default ManageItems;