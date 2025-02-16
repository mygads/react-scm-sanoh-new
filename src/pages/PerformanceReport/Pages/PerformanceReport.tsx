import { useEffect, useState } from 'react';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';
import Pagination from '../../../components/Table/Pagination';
import { API_Download_Performance_Report, API_Performance_Report } from '../../../api/api';
import SearchMonth from '../../../components/Table/SearchMonth';
import SearchBar from '../../../components/Table/SearchBar';
import { FaFile, FaFileExcel, FaFilePdf, FaFileWord, FaSortDown, FaSortUp } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';

const PerformanceReport = () => {
  type DataType = {
    no: string;
    periode: string;
    upload_at: string;
    filedata: string;
    attachedFile: string;
  };
  
  const [data, setData] = useState<DataType[]>([]);
  const [filteredData, setFilteredData] = useState<DataType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof DataType; direction: 'asc' | 'desc' }>({ key: 'periode', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  
  // Fetch data from API
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    const fetchData = async () => {
      try {
        const response = await fetch(API_Performance_Report(), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();
        setData(result.data.map((item: { po_listing_no: any; date: any; upload_at: any; file: any; }) => ({
          no: item.po_listing_no,
          periode: formatDate(item.date),
          upload_at: item.upload_at,
          filedata: item.file.split('_').slice(1).join('_'),
          attachedFile: item.file
        })));
        setFilteredData(result.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error) {
          toast.error(`Failed to fetch data: ${error.message}`);
        } else {
          toast.error('Failed to fetch data: An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function formatDate(dateString: string | number | Date) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format to YYYY-MM-DD
  }
  

  // Handle search by file name
  useEffect(() => {
    let filtered = [...data];

    // Filter by month if selected
    if (selectedMonth) {
      filtered = filtered.filter((row) =>
        row.periode.startsWith(selectedMonth)
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((row) =>
        row.filedata.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Konversi string ke Date jika kolom yang diurutkan adalah tanggal
      if (sortConfig.key === 'upload_at' || sortConfig.key === 'periode') {
        const aDateValue = new Date(aValue);
        const bDateValue = new Date(bValue);

        if (aDateValue < bDateValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aDateValue > bDateValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      } else {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
    });

    setFilteredData(filtered);
  }, [searchQuery, selectedMonth, sortConfig, data]);

  // Paginated data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => setCurrentPage(page);
  

  // Handle sorting
  const handleSort = (key: keyof DataType) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  async function downloadFile(attachedFile: string) {
    const token = localStorage.getItem('access_token');
    const toastId = toast.loading('Preparing download...', { progress: 0 });

    const downloadPromise = async () => {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            toast.update(toastId, {
              render: `Downloading... ${progress}%`,
              progress: progress / 100,
            });
          }
        };

        xhr.onload = async () => {
          if (xhr.status === 200) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachedFile;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            resolve('Download complete');
          } else {
            reject(new Error('Download failed'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };

        xhr.open('GET', `${API_Download_Performance_Report()}${attachedFile}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.responseType = 'blob';
        xhr.send();
      });
    };

    try {
      await downloadPromise();
      toast.update(toastId, {
        render: 'Download complete!', 
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      toast.update(toastId, {
        render: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
      toast.error('Failed to download file');
    }
  }
   

  return (
    <>
      <ToastContainer position="top-right" />
      <Breadcrumb pageName="Performance Report" />
      <div className="font-poppins bg-white ">
        <div className="flex flex-col p-2 md:p-4 lg:p-6 space-y-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
                <SearchMonth 
                  selectedMonth={selectedMonth} 
                  setSelectedMonth={setSelectedMonth}
                />
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3">
                <SearchBar
                  placeholder="Search file name..."
                  onSearchChange={setSearchQuery}
                />
              </div>
            </div>

            <div className="relative overflow-hidden shadow-md rounded-lg border border-gray-300 mt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border-x border-b border-gray-200 w-[5%]">No</th>
                      <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border-x border-b border-gray-200 cursor-pointer w-[20%]" onClick={() => handleSort('periode')}>
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
                      <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border-x border-b border-gray-200 w-[35%]">File Name</th>
                      <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border-x border-b border-gray-200 w-[20%]">Attached File</th>
                      <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border-x border-b border-gray-200 cursor-pointer w-[20%]" onClick={() => handleSort('upload_at')}>
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
                        Upload At
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      Array.from({ length: rowsPerPage }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </td>
                        </tr>
                      ))
                    ) : paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-center whitespace-nowrap">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            {row.periode ? new Date(row.periode).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'No period'}
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{row.filedata}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap flex items-center justify-center">
                            <button onClick={() => downloadFile(row.attachedFile)} className="px-2 hover:scale-125">
                              {row.attachedFile?.endsWith('.pdf') && <FaFilePdf className="w-6 h-6 text-blue-900" />}
                              {(row.attachedFile?.endsWith('.doc') || row.attachedFile?.endsWith('.docx')) && <FaFileWord className="w-6 h-6 text-blue-500" />}
                              {(row.attachedFile?.endsWith('.xls') || row.attachedFile?.endsWith('.xlsx')) && <FaFileExcel className="w-6 h-6 text-green-500" />}
                              {!row.attachedFile?.endsWith('.pdf') && !row.attachedFile?.endsWith('.doc') && !row.attachedFile?.endsWith('.docx') && !row.attachedFile?.endsWith('.xls') && !row.attachedFile?.endsWith('.xlsx') && <FaFile className="w-6 h-6 text-yellow-600" />}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{row.upload_at}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-gray-500">No data available for now</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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

export default PerformanceReport;