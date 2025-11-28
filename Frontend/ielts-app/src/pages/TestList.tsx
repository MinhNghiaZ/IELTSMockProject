import { TestCardNew } from "../components/student/TestCard";
import { useEffect, useState } from "react";
import type { TestWithAuthorName } from "../types/Test";
import { useSearchParams } from "react-router-dom";
import { getFilteredTests } from "../services/testService";
import Pagination from "../components/utils/Pagination";

function TestList() {
  const [tests, setTests] = useState<TestWithAuthorName[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 9;
  const startIndex = (currentPage - 1) * testsPerPage;
  const endIndex = startIndex + testsPerPage;
  const currentTests = tests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const fetchFilteredTests = async () => {
      setLoading(true);
      try {
        const skillNames = searchParams.getAll("skillName");
        const instructorNames = searchParams.getAll("instructorName");
        const searchTerm = searchParams.get("search");
        const sortBy = searchParams.get("sort");

        const data = await getFilteredTests({
          skillName: skillNames.length > 0 ? skillNames : undefined,
          instructorName:
            instructorNames.length > 0 ? instructorNames : undefined,
          search: searchTerm || undefined,
          sort: sortBy || undefined,
        });

        const activeTests = data.filter(test => {
          return test.isActive === true;
        })
        setTests(activeTests);
        
        // Reset to first page when filters change
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching filtered tests:", error);
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredTests();
  }, [searchParams]);

  return (
    <div className="row">
      {loading ? (
        <div className="col-12 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading tests...</p>
        </div>
      ) : currentTests.length > 0 ? (
        currentTests.map((test, idx) => (
          <TestCardNew
            key={test.id || idx}
            id ={test.id}
            image="/assets/img/ielts-banner.jpeg"
            adminAvatar="/assets/img/user/user-00.jpg"
            adminName={test.instructorName.toUpperCase()}
            title={test.testName}
            rating={4.9}
            reviewCount={test.submissionCount}
            skillType={test.typeName}
          />
        ))
      ) : (
        <div className="col-12 text-center">
          <p>No tests found for the selected filters.</p>
          <p>Try adjusting your filter criteria.</p>
        </div>
      )}
      
      {/* Pagination */}
      <div className="col-md-12">
        <Pagination
          totalItems={tests.length}
          currentPage={currentPage}
          itemsPerPage={testsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

    </div>
  );
}

export default TestList;
