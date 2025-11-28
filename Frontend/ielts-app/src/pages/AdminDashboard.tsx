import React, { use, useEffect, useState } from "react";
import DashboardTable from "../components/admin/DashboardTable";
import type { Test, TestWithAuthorName } from "../types/Test";
import { getRecentlyTestByAdminId, getTests } from "../services/testService";
import CourseTable from "../components/admin/CourseTable";
import Pagination from "../components/utils/Pagination";
import { useAuth } from "../contexts/AuthContext";
import { getTotalStudentsByAdminId, getTotalSubmissionsByAdminId, getTotalTestsByAdminId } from "../services/userService";
import { countSubmissionByCondition, getMostPopularTest } from "../services/submissionService";

function AdminDashboard() {
  const [tests, setTests] = useState<TestWithAuthorName[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Default items per page
  const {user} = useAuth();
  const [totalCreatedTests, setTotalCreatedTests] = useState<number>(0);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [testsPerDay, setTestsPerDay] = useState<number>(0);
  const [testsPerWeek, setTestsPerWeek] = useState<number>(0);
  const [nameOfPopularTest, setNameOfPopularTest] = useState<string>("");
  useEffect(() => {
    loadTests();
    const fetchData = async () => {
      if(user) {
        const data1 = await getTotalTestsByAdminId(user.id);
        const data2 = await getTotalSubmissionsByAdminId(user.id);
        const data3 = await getTotalStudentsByAdminId(user.id);
        const data4 = await countSubmissionByCondition(new Date(), "day");
        const data5 = await countSubmissionByCondition(new Date(), "week");
        const data6 = await getMostPopularTest(user.id);
        setTotalCreatedTests(data1);
        setTotalSubmissions(data2);
        setTotalStudents(data3);
        setTestsPerDay(data4);
        setTestsPerWeek(data5);
        setNameOfPopularTest(data6);
      }
    }

    fetchData();
  }, []);

  async function loadTests() {
    if(!user) return;
    const data = await getRecentlyTestByAdminId(user.id);
    setTests(data);
  }

  // Calculate pagination for filtered results
  const totalItems = tests.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = tests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="row">
        {/* Dashboard widgets */}
        <div className="col-md-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="icon-box bg-primary-transparent me-2 me-xxl-3 flex-shrink-0">
                  <img src="/assets/img/icon/graduation.svg" alt="" />
                </span>
                <div>
                  <span className="d-block">Total Tests</span>
                  <h4 className="fs-24 mt-1">{totalCreatedTests}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="icon-box bg-secondary-transparent me-2 me-xxl-3 flex-shrink-0">
                  <img src="/assets/img/icon/book.svg" alt="" />
                </span>
                <div>
                  <span className="d-block">Total Submissions</span>
                  <h4 className="fs-24 mt-1">{totalSubmissions}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="icon-box bg-success-transparent me-2 me-xxl-3 flex-shrink-0">
                  <img src="/assets/img/icon/bookmark.svg" alt="" />
                </span>
                <div>
                  <span className="d-block">Total Students</span>
                  <h4 className="fs-24 mt-1">{totalStudents}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="icon-box bg-primary-transparent me-2 me-xxl-3 flex-shrink-0">
                  <img src="/assets/img/icon/graduation.svg" alt="" />
                </span>
                <div>
                  <span className="d-block">Today Submissions</span>
                  <h4 className="fs-24 mt-1">{testsPerDay}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <span className="icon-box bg-secondary-transparent me-2 me-xxl-3 flex-shrink-0">
                  <img src="/assets/img/icon/book.svg" alt="" />
                </span>
                <div>
                  <span className="d-block">Week Submissions</span>
                  <h4 className="fs-24 mt-1">{testsPerWeek}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <div className="card">
            <div className="card-body text-truncate">
              <div className="d-flex align-items-center">
                <span className="icon-box bg-success-transparent me-2 me-xxl-3 flex-shrink-0">
                  <img src="/assets/img/icon/bookmark.svg" alt="" />
                </span>
                <div className="flex-grow-1 overflow-hidden">
                  <span className="d-block">Most popular test</span>
                  <h4 
                    className="fs-24 mt-1 text-truncate" 
                    style={{ 
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={nameOfPopularTest}
                  >
                    {nameOfPopularTest}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h5 className="mb-3 fw-bold mt-4">Recently Created Tests</h5>
      {/* <div className="table-responsive custom-table">
        <DashboardTable />
      </div> */}
      {/* <div className="table-responsive custom-table">
        <table className="table">
          <thead className="thead-light">
            <tr>
              <th>Test Name</th>
              <th>Attempt</th>
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
      </div> */}
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

      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default AdminDashboard;
