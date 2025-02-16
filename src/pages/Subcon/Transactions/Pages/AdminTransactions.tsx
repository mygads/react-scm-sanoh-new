import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import Breadcrumb from '../../../../components/Breadcrumbs/Breadcrumb';
import { toast, ToastContainer } from 'react-toastify';
import { API_Create_Transaction_Subcont, API_List_Partner_Admin, API_Stock_Item_Subcont_Admin } from '../../../../api/api';
import Swal from 'sweetalert2';
import DatePicker from '../../../../components/Forms/DatePicker';
import { FaPlus } from 'react-icons/fa';
import Button from '../../../../components/Forms/Button';

const AdminTransactions = () => {
    const [value, setValue] = useState(0);
    const [selectedPart, setSelectedPart] = useState<{ value: string; label: string } | null>(null);
    const [status, setStatus] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [apiData, setApiData] = useState<{
        partNumber: string;
        partName: string;
        oldPartName: string;
        incomingFreshStock: number;
        readyFreshStock: number;
        ngFreshStock: number;
        incomingReplatingStock: number;
        readyReplatingStock: number;
        ngReplatingStock: number;
    }[]>([]);
    const [transactionDate, setTransactionDate] = useState<Date>(new Date());
    const [partList, setPartList] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null);


    interface ApiItem {
        part_number: string;
        part_name: string;
        old_part_name: string;
        incoming_fresh_stock: number;
        ready_fresh_stock: number;
        ng_fresh_stock: number;
        incoming_replating_stock: number;
        ready_replating_stock: number;
        ng_replating_stock: number;
    }

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        const savedSupplierCode = localStorage.getItem('selected_supplier');
        if (savedSupplierCode && suppliers.length > 0) {
            const savedSupplier = suppliers.find(
                (sup: { value: string; label: string }) => sup.value === savedSupplierCode
            );
            if (savedSupplier) {
                setSelectedSupplier(savedSupplier);
                fetchData(savedSupplierCode);
            }
        }
    }, [suppliers]);

    const fetchData = async (supplierCode: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_Stock_Item_Subcont_Admin()}${supplierCode}`, {
            headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (result.status) {
                const transformedData = result.data.map((item: ApiItem) => ({
                    partNumber: item.part_number,
                    partName: item.part_name,
                    oldPartName : item.old_part_name || '-',
                    incomingFreshStock: item.incoming_fresh_stock,
                    readyFreshStock: item.ready_fresh_stock,
                    ngFreshStock: item.ng_fresh_stock,
                    incomingReplatingStock: item.incoming_replating_stock,
                    readyReplatingStock: item.ready_replating_stock,
                    ngReplatingStock: item.ng_replating_stock,
                }));
                setApiData(transformedData);
            }
        } catch (error) {
            console.error('Error fetching parts:', error);
        }
    };

    const fetchSuppliers = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(API_List_Partner_Admin(), {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                },
            });
        
            if (!response.ok) throw new Error('Failed to fetch suppliers');
        
            const result = await response.json();
            const suppliersList = result.data.map((supplier: { bp_code: string; bp_name: string }) => ({
                value: supplier.bp_code,
                label: `${supplier.bp_code} | ${supplier.bp_name}`,
            }));
        
            setSuppliers(suppliersList);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error(`Error fetching suppliers: ${error}`);
        }
    };

    const partOptions = apiData.map((item) => ({
        value: item.partNumber,
        label: `${item.partNumber} | ${item.partName} | ${item.oldPartName}`,
    }));

    const handleSupplierChange = (selectedOption: { value: string; label: string } | null) => {
        setSelectedSupplier(selectedOption);
        setPartList([]); 
        if (selectedOption) {
            localStorage.setItem('selected_supplier', selectedOption.value);
            fetchData(selectedOption.value);
        } else {
            localStorage.removeItem('selected_supplier');
            setApiData([]);
        }
    };

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // Reset form when tab changes
        setPartList([]);
        setSelectedPart(null);
        setStatus('');
        setDeliveryNote('');
        setTransactionDate(new Date());
    };

    const handlePartChange = (selectedOption: { value: string; label: string } | null) => {
        setSelectedPart(selectedOption);
    };

    const handleAddPart = () => {
        if (!selectedPart) {
            toast.error('Please select a part');
            return;
        }
        // Cek apakah part sudah ada di partList
        const partExists = partList.some(
            (part) => part.partNumber === selectedPart.value
        );

        if (partExists) {
            toast.error('Part already exists in the list');
            setSelectedPart(null);
            return;
        }

        const selectedPartData = apiData.find(item => item.partNumber === selectedPart.value);

        // Jika berada di tabs "Record Outgoing" (value === 2), tentukan stok saat ini berdasarkan status
        let currentStock = 0;
        let currentNgStock = 0;
        if (value === 2) {
            if (status === 'Fresh') {
            currentStock = selectedPartData?.readyFreshStock ?? 0;
            currentNgStock = selectedPartData?.ngFreshStock ?? 0;
            } else if (status === 'Replating') {
            currentStock = selectedPartData?.readyReplatingStock ?? 0;
            currentNgStock = selectedPartData?.ngReplatingStock ?? 0;
            }
        }
        if (value === 1) {
            if (status === 'Fresh') {
            currentStock = selectedPartData?.incomingFreshStock ?? 0;
            currentNgStock = selectedPartData?.ngFreshStock ?? 0;
            } else if (status === 'Replating') {
            currentStock = selectedPartData?.incomingReplatingStock ?? 0;
            currentNgStock = selectedPartData?.ngReplatingStock ?? 0;
            }
        }

        // Lanjutkan menambahkan part jika tidak duplikat
        setPartList([
            ...partList,
            {
                partName: selectedPart.label.split(' | ')[0],
                partNumber: selectedPart.value,
                oldPartName: selectedPart.label.split(' | ')[2],
                qtyOk: '',
                qtyNg: '0',
                currentStock: currentStock,
                currentNgStock: currentNgStock,
            },
        ]);
        setSelectedPart(null);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        if (value === 2) {
            setPartList((prev) =>
                prev.map((pt) => {
                    const matched = apiData.find((item) => item.partNumber === pt.partNumber);
                    if (!matched) return pt;
                    if (newStatus === 'Fresh') {
                    return {
                        ...pt,
                        currentStock: matched.readyFreshStock ?? 0,
                        currentNgStock: matched.ngFreshStock ?? 0,
                    };
                    } else {
                    return {
                        ...pt,
                        currentStock: matched.readyReplatingStock ?? 0,
                        currentNgStock: matched.ngReplatingStock ?? 0,
                    };
                    }
                })
            );
        }
        if (value === 1) {
            setPartList((prev) =>
                prev.map((pt) => {
                    const matched = apiData.find((item) => item.partNumber === pt.partNumber);
                    if (!matched) return pt;
                    if (newStatus === 'Fresh') {
                    return {
                        ...pt,
                        currentStock: matched.incomingFreshStock ?? 0,
                        currentNgStock: matched.ngFreshStock ?? 0,
                    };
                    } else {
                    return {
                        ...pt,
                        currentStock: matched.incomingReplatingStock ?? 0,
                        currentNgStock: matched.ngReplatingStock ?? 0,
                    };
                    }
                })
            );
        }
    };

    const handlePartListChange = (index: number, field: 'qtyOk' | 'qtyNg', value: string) => {
        const updatedPartList = [...partList];
        updatedPartList[index][field] = value;
        setPartList(updatedPartList);
    };

    const handleDeletePart = (index: number) => {
        const updatedPartList = partList.filter((_, i) => i !== index);
        setPartList(updatedPartList);
    };

    const handleSubmit = async () => {
        if (partList.length === 0) {
            toast.error('Please add at least one part');
            return;
        }

        if (!selectedSupplier) {
            toast.error('Please select a supplier');
            return;
        }

        for (const part of partList) {
            if (parseInt(part.qtyOk) <= 0) {
                toast.error(`Qty OK for part ${part.partNumber} must be greater than 0`);
                return;
            }
            if (parseInt(part.qtyNg) < 0) {
                toast.error(`Qty NG for part ${part.partNumber} cannot be negative`);
                return;
            }
        }

        const confirm = await Swal.fire({
            title: 'Confirm Submission',
            html: `
                <p>Are you sure the data entered is correct?</p>
                <br>
                <p><strong>Date:</strong> ${transactionDate.toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${status}</p>
                <p><strong>Type:</strong> ${
                value === 0 ? 'Incoming' : value === 1 ? 'Process' : 'Outgoing'
                }</p>
                <p><strong>Delivery Note:</strong> ${deliveryNote}</p>
                <p><strong>Supplier:</strong> ${selectedSupplier.label}</p>
                <p><strong>Parts:</strong></p>
                ${partList
                .map(
                    (part) => `
                    <p>${part.partNumber} | Qty OK: ${part.qtyOk} | Qty NG: ${
                    part.qtyNg || 0
                    }</p>
                `
                )
                .join('')}
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e3a8a',
            cancelButtonColor: '#dc2626',
            confirmButtonText: 'Yes, Submit!',
        });

        if (!confirm.isConfirmed) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            const transactions = partList.map((part) => {
                const transactionDateTime = new Date(transactionDate);
                const now = new Date();
                transactionDateTime.setHours(
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                );

                const actualTransactionDate = `${transactionDateTime.getFullYear()}-${String(transactionDateTime.getMonth() + 1).padStart(2, '0')}-${String(transactionDateTime.getDate()).padStart(2, '0')}`;
                const actualTransactionTime = `${String(transactionDateTime.getHours()).padStart(2, '0')}:${String(transactionDateTime.getMinutes()).padStart(2, '0')}:${String(transactionDateTime.getSeconds()).padStart(2, '0')}`;


                return {
                    actual_transaction_date: actualTransactionDate,
                    actual_transaction_time: actualTransactionTime,
                    transaction_type: value === 0 ? 'Incoming' : value === 1 ? 'Process' : 'Outgoing',
                    status: status,
                    delivery_note: deliveryNote || null,
                    item_code: part.partNumber,
                    qty_ok: parseInt(part.qtyOk || '0', 10),
                    qty_ng: parseInt(part.qtyNg || '0', 10),
                };
            });

            const response = await fetch(API_Create_Transaction_Subcont(), {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    bp_code: selectedSupplier?.value,
                    data: transactions 
                }),
            });

            const result = await response.json();

            if (!result.status) {
                if (Array.isArray(result.error)) {
                // Show each error message as a separate toast
                    result.error.forEach((errorMsg: string) => {
                        toast.error(errorMsg);
                    });
                } else {
                    console.error(result);
                    toast.error(result.message || 'Error submitting data');
                }
                return;
            }

            toast.success(result.message || 'Data submitted successfully!');

            // Reset form
            setPartList([]);
            setStatus('');
            setDeliveryNote('');
            setTransactionDate(new Date());
            setSelectedSupplier(null);
        } catch (error) {
            toast.error('Error submitting data');
            console.error(error);
        }
    };

    return (
        <>
        <ToastContainer position="top-right" />
        <Breadcrumb pageName="Transactions" />
        <div className="mx-auto space-y-6">
            <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <Tabs value={value} onChange={handleChange} centered>
                <Tab label="Record Incoming" />
                <Tab label="Record Finish Process" />
                <Tab label="Record Outgoing" />
            </Tabs>
            <div className="rounded-sm border-t-2 border-stroke bg-white">
                <div className="max-w-[1024px] mx-auto">
                {(value === 0 || value === 1 || value === 2) && (
                    <div className="p-4 md:p-6.5 gap-4">

                    {/* Supplier Selection */}
                    <div className="mb-4.5 w-full">
                        <label className="mb-2.5 block text-black">
                            Select Supplier <span className="text-meta-1">*</span>
                        </label>
                        <div className="w-full">
                            <Select
                            id="supplier_id"
                            options={suppliers}
                            value={selectedSupplier}
                            onChange={handleSupplierChange}
                            placeholder="Search Supplier"
                            className="w-full"
                            isClearable
                            />
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="mb-4">
                        <DatePicker
                        id="transactionDate"
                        value={transactionDate}
                        onChange={(date: Date) => date && setTransactionDate(date)}
                        className="w-full rounded border border-stroke py-3 px-3 text-black outline-none transition focus:border-primary active:border-primary"
                        placeholder='Select Date'
                        label='Date'
                        />
                    </div>
                    

                    {/* Status Selection */}
                    {(value === 0 || value === 1 || value === 2) && (
                        <div className="mb-4">
                        <label className="mb-2 block text-black">
                            Status <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={handleStatusChange}
                            className="w-full rounded border border-stroke py-3 px-3 text-black outline-none transition focus:border-primary active:border-primary"
                            required
                        >
                            <option value="">Select Status</option>
                            <option value="Fresh">Fresh</option>
                            <option value="Replating">Replating</option>
                        </select>
                        </div>
                    )}
                    {/* Delivery Note Input */}
                    {(value === 0 || value === 2) && (
                        <div className="mb-4">
                        <label className="mb-2 block text-black">
                            Delivery Note <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            placeholder="Enter Delivery Note"
                            className="w-full rounded border border-stroke py-3 px-3 text-black outline-none transition focus:border-primary active:border-primary"
                            required
                        />
                        </div>
                    )}
                    {/* Part List Selection */}
                    <div className="mb-4">
                        <label className="mb-2 block text-black">
                        Part List <span className="text-meta-1">*</span>
                        </label>
                        <Select
                        options={partOptions}
                        value={selectedPart}
                        onChange={handlePartChange}
                        placeholder="Select Part Number"
                        className="w-full"
                        isClearable
                        />
                    </div>
                    <Button
                        title="Add Part"
                        onClick={handleAddPart}
                        icon={FaPlus}
                    />

                    {/* Preview List */}
                    {partList.length > 0 && (
                        <div className="mt-6 overflow-auto">
                        <table className="w-full text-sm text-center">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[20%]">
                                    PART NUMBER
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[20%]">
                                    PART NAME
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[20%]">
                                    OLD PART NAME
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[15%]">
                                    QTY OK
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[15%]">
                                    QTY NG
                                </th>
                                <th className="px-3 py-3.5 text-sm font-bold text-gray-700 border w-[10%]">
                                    ACTION
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                            {partList.map((part, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-3 text-center border">{part.partNumber}</td>
                                <td className="px-3 py-3 text-center border">{part.partName}</td>
                                <td className="px-3 py-3 text-center border">{part.oldPartName}</td>
                                <td className="px-3 py-3 text-center border">
                                    <input
                                        type="number"
                                        value={part.qtyOk}
                                        onChange={(e) => handlePartListChange(index, 'qtyOk', e.target.value)}
                                        className="border border-gray-300 rounded p-1 w-full"
                                    />
                                    {(value === 1 ||value === 2) && (
                                        <p className="text-xs text-gray-500 mt-1">
                                        Stock: {part.currentStock}
                                        </p>
                                    )}
                                </td>
                                <td className="px-3 py-3 text-center border">
                                    <input
                                        type="number"
                                        value={part.qtyNg}
                                        onFocus={(e) => { if (e.target.value === '0') e.target.value = '' }}
                                        onBlur={(e) => { if (e.target.value === '') e.target.value = '0' }}
                                        onChange={(e) => handlePartListChange(index, 'qtyNg', e.target.value)}
                                        className="border border-gray-300 rounded p-1 w-full"
                                    />
                                    {(value === 1 || value === 2) && (
                                        <p className="text-xs text-gray-500 mt-1">
                                        Stock: {part.currentNgStock}
                                        </p>
                                    )}
                                </td>
                                <td className="px-3 py-3 text-center border">
                                    <button
                                        onClick={() => handleDeletePart(index)}
                                        className="bg-red-600 text-white px-2 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <button
                            onClick={handleSubmit}
                            className="mt-4 w-full justify-center rounded bg-blue-900 p-3 font-medium text-white hover:bg-opacity-90"
                        >
                            Submit
                        </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    </div>
                )}
                </div>
            </div>
            </Box>
        </div>
        </>
    );
};

export default AdminTransactions;