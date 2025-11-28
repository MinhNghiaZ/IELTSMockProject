import { useEffect, useState } from "react";
import CourseTable from "../components/admin/CourseTable";
import Pagination from "../components/utils/Pagination";
import { getTests } from "../services/testService";
import type { Test, TestWithAuthorName } from "../types/Test";
import { getTotalActiveTest, getTotalInactiveTest, getTotalTest } from "../services/userService";

function AdminCourse() {
  const [tests, setTests] = useState<TestWithAuthorName[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5; // Default items per page
  const [totalTests, setTotalTests] = useState<number>(0);
  const [activeTests, setActiveTests] = useState<number>(0);
  const [inactiveTests, setInactiveTests] = useState<number>(0);

  useEffect(() => {
    loadTests();
    const fetchData = async () => {
      const data1 = await getTotalTest();
      const data2 = await getTotalActiveTest();
      const data3 = await getTotalInactiveTest();
      setTotalTests(data1);
      setActiveTests(data2);
      setInactiveTests(data3);
    }

    fetchData();
  }, []);

  async function loadTests() {
    const data = await getTests();
    setTests(data);
  }

  // Filter tests based on search term
  const filteredTests = tests.filter(test => 
    test.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination for filtered results
  const totalItems = filteredTests.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredTests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  return (
    <div>
      {/* Course Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6">
          <div className="card bg-success">
            <div className="card-body">
              <h6 className="fw-medium mb-1 text-white">Total Tests</h6>
              <h4 className="fw-bold text-white">{totalTests}</h4>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="card bg-secondary">
            <div className="card-body">
              <h6 className="fw-medium mb-1 text-white">Total Active Tests</h6>
              <h4 className="fw-bold text-white">{activeTests}</h4>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="card bg-info">
            <div className="card-body">
              <h6 className="fw-medium mb-1 text-white">Total Inactive Tests</h6>
              <h4 className="fw-bold text-white">{inactiveTests}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title and Icons */}
      <div className="page-title d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-bold">Tests</h5>
        {/* <div className="d-flex align-items-center list-icons">
          <a href="#" className="active me-2"><i className="isax isax-task"></i></a>
          <a href="#"><i className="isax isax-element-3"></i></a>
        </div> */}
      </div>

      {/* Filter and Search */}
      <div className="row mb-3">
        {/* <div className="col-md-8">
          <div className="mb-3">
            <div className="dropdown">
              <a href="#" className="dropdown-toggle text-gray-6 btn rounded border d-inline-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false">
                Status
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1">Active</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Deactive</a></li>
              </ul>
            </div>
          </div>
        </div> */}
        <div className="col-md-4">
          <div className="input-icon mb-3">
            <span className="input-icon-addon">
              <i className="isax isax-search-normal-14"></i>
            </span>
            <input 
              type="text" 
              className="form-control form-control-md" 
              placeholder="Search by test name" 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="table-responsive custom-table">
        <table className="table">
          <thead className="thead-light">
            <tr>
              <th>Test Name</th>
              {/* <th>Attempt</th> */}
              <th>Created At</th>
              <th>Resource</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <CourseTable tests={currentTests} onTestsChange={loadTests} />
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default AdminCourse;