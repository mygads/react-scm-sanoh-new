import { useEffect, useState } from 'react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { FaFilePdf, FaSortDown, FaSortUp } from 'react-icons/fa';
import {
    API_Create_Performance_Report_Purchasing,
    API_Download_Performance_Report,
    API_List_Partner,
    API_Performance_Report_Purchasing,
} from '../../../api/api';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';
import Pagination from '../../Table2/Pagination';
import SearchBar from '../../Table2/SearchBar';

const CreatePerformanceReport = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [file, setFile] = useState(null);
    const [period, setPeriod] = useState('');

    const fetchSuppliers = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(API_List_Partner(), {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch suppliers');

            const result = await response.json();
            const suppliersList = result.data.map((supplier) => ({
                value: supplier.bp_code,
                label: `${supplier.bp_code} | ${supplier.bp_name}`,
            }));

            setSuppliers(suppliersList);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchPerformanceReport = async (supplierCode, selectedMonth = null) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(
                `${API_Performance_Report_Purchasing()}${supplierCode}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch performance report');

            const result = await response.json();
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                let performanceReport = result.data.map((report) => ({
                    no: report.po_listing_no || 'N/A',
                    periode: formatDate(report.date) || '-',
                    upload_at: report.upload_at || '-',
                    filedata: report.file.split('_').slice(1).join('_') || '-',
                    attachedFile: report.file || '-',
                }));

                if (selectedMonth) {
                    performanceReport = performanceReport.filter((row) => {
                        const rowMonth = row.periode.slice(0, 7);
                        return rowMonth === selectedMonth;
                    });
                }

                setData(performanceReport);
                setFilteredData(performanceReport);
            } else {
                setData([]);
                setFilteredData([]);
                // Swal.fire('No data found', result.message, 'info');
            }
        } catch (error) {
            console.error('Error fetching performance report:', error);
            Swal.fire(
                'Error',
                'Failed to fetch performance report. Please try again later.',
                'error'
            );
            setData([]);
            setFilteredData([]);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        let filtered = [...data];

        if (searchQuery) {
            filtered = filtered.filter((row) =>
                row.filedata.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'periode' || sortConfig.key === 'upload_at') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredData(filtered);
    }, [searchQuery, sortConfig, data]);

    function formatDate(dateString: string | number | Date) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Format to "Month YYYY"
    }

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handlePageChange = (page) => setCurrentPage(page);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSupplierChange = (selectedOption) => {
        setSelectedSupplier(selectedOption);
        if (selectedOption) {
            fetchPerformanceReport(selectedOption.value);
            localStorage.setItem('selected_bp_code', selectedOption.value);
        } else {
            setData([]);
            setFilteredData([]);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        if (e.target.files[0] && e.target.files[0].type !== "application/pdf") {
            Swal.fire("Error", "Only PDF files are allowed", "error");
            setFile(null); // Reset the file input
        } else {
            setFile(e.target.files[0]);
        }
    };

    const handlePeriodChange = (e) => {
        setPeriod(e.target.value);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !period || !selectedSupplier) {
            Swal.fire('Error', 'Please fill all fields', 'error');
            return;
        }

        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('date', `${period}-05`);
        formData.append('bp_code', selectedSupplier.value);

        try {
            const response = await fetch(API_Create_Performance_Report_Purchasing(), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload file');

            const result = await response.json();
            if (result.status) {
                Swal.fire('Success', 'File uploaded successfully', 'success');
                fetchPerformanceReport(selectedSupplier.value);
            } else {
                Swal.fire('Error', result.message, 'error');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            Swal.fire('Error', 'Failed to upload file. Please try again later.', 'error');
        }
    };

    async function downloadFile(attachedFile) {
        const token = localStorage.getItem('access_token');
    
        try {
          const response = await fetch(`${API_Download_Performance_Report()}${attachedFile}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
    
          if (!response.ok) {
            throw new Error('Failed to download file.');
          }
    
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = attachedFile;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error while downloading file:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to download file.',
          })
        }
    }

    return (
        <>
            <Breadcrumb pageName="Create Performance Report" />
            <div className="font-poppins bg-white">
                <div className="flex flex-col p-6">
                    <div className="flex justify-between items-center mb-4">
                        <Select
                            options={suppliers}
                            value={selectedSupplier}
                            onChange={handleSupplierChange}
                            placeholder="Select Supplier"
                            className="w-80"
                        />
                        <SearchBar placeholder="Search..." onSearchChange={setSearchQuery} />
                    </div>

                    <form onSubmit={handleUpload} className="flex flex-col items-center">
                        <div className="flex mb-4 justify-start w-full">
                            <div className='gap-2'>
                                <label htmlFor="month-picker" className="mr-4 text-base">
                                    Periode
                                </label>
                                <input
                                    type="month"
                                    id="month-picker"
                                    value={period}
                                    onChange={handlePeriodChange}
                                    className="pl-4 pr-4 border rounded-md"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 justify-start w-full">
                            <label className="block dark:text-white">
                                Attach file
                            </label>
                            <input
                                type="file"
                                className="text-sm cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-2 file:px-4 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                                onChange={handleFileChange}
                            />
                            <button
                                type="submit"
                                className=" px-5 py-2 bg-blue-500 text-white text-xs rounded-md align-bottom justify-center">
                                    Upload
                            </button>
                        </div>
                    </form>

                    <div className="relative overflow-x-auto shadow-md rounded-lg border border-gray-300 mt-5">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="text-base text-gray-700">
                                <tr>
                                    <th
                                        className="py-3 text-center border-b border-b-gray-400 cursor-pointer w-40"
                                        onClick={() => handleSort('no')}
                                    >
                                        No
                                    </th>
                                    <th
                                        className="py-3 text-center border-b border-b-gray-400 cursor-pointer w-36"
                                        onClick={() => handleSort('periode')}
                                    >
                                        <span className="flex items-center justify-center">
                                            {sortConfig.key === 'periode' ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <FaSortUp className="mr-1" />
                                                ) : (
                                                    <FaSortDown className="mr-1" />
                                                )
                                            ) : (
                                                <FaSortDown className="opacity-50 mr-1" />
                                            )}
                                            Periode
                                        </span>
                                    </th>
                                    <th
                                        className="py-3 text-center border-b border-b-gray-400 cursor-pointer w-36"
                                        onClick={() => handleSort('filedata')}
                                    >
                                        File Name
                                    </th>
                                    <th
                                        className="py-3 text-center border-b border-b-gray-400 cursor-pointer w-36"
                                        onClick={() => handleSort('attachedFile')}
                                    >
                                        Attached File
                                    </th>
                                    <th
                                        className="py-3 text-center border-b border-b-gray-400 cursor-pointer w-36"
                                        onClick={() => handleSort('upload_at')}
                                    >
                                        <span className="flex items-center justify-center">
                                            {sortConfig.key === 'upload_at' ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <FaSortUp className="mr-1" />
                                                ) : (
                                                    <FaSortDown className="mr-1" />
                                                )
                                            ) : (
                                                <FaSortDown className="opacity-50 mr-1" />
                                            )}
                                            Created At
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => (
                                        <tr key={index} className="odd:bg-white even:bg-gray-50 border-b">
                                            <td className="px-2 py-4 text-center">{index + 1}</td>
                                            <td className="px-2 py-4 text-center">{row.periode}</td>
                                            <td className="px-2 py-4 text-center">{row.filedata}</td>
                                            <td className="px-2 py-4 text-center">
                                                <button
                                                    onClick={() => downloadFile(row.attachedFile)}
                                                    className="px-2 py-1 hover:scale-110"
                                                >
                                                    <FaFilePdf className="text-red-500 text-2xl" />
                                                </button>
                                            </td>
                                            <td className="px-2 py-4 text-center">{row.upload_at}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        totalRows={filteredData.length}
                        rowsPerPage={rowsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </>
    );
};

export default CreatePerformanceReport;