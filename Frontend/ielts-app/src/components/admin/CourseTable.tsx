//import React from "react";
import { toast } from "react-toastify";
import { confirmToast } from "../layout/confirmToast";
import { deleteTest } from "../../services/testService";
import type { Test, TestWithAuthorName } from "../../types/Test";
import { useNavigate } from "react-router-dom";

interface CourseTableProps {
  tests: TestWithAuthorName[];
  onTestsChange: () => Promise<void>;
}

const formatDate = (isoLike: string | Date | undefined): string => {
        if (!isoLike) return "-";
        try {
            const d = typeof isoLike === "string" ? new Date(isoLike) : isoLike;
            if (Number.isNaN(d.getTime())) return String(isoLike);
            return d.toLocaleString();
        } catch {
            return String(isoLike);
        }
    };

function CourseTable({ tests, onTestsChange }: CourseTableProps) {
  async function handleDelete(id: number) {
    console.log("handleDelete called with id:", id);
    confirmToast(
      "Are you sure you want to delete this course?",
      async () => {
        console.log("Confirm button clicked, deleting test with id:", id);
        try {
          await deleteTest(id);
          await onTestsChange();
          toast.success("Course deleted successfully!");
        } catch (err) {
          console.error("Delete failed", err);
          toast.error("Failed to delete course. Please try again.");
        }
      },
      () => {
        // Optional cancel callback - just closes the toast
        console.log("Delete cancelled");
      }
    );
  }

  let navigate = useNavigate();

  function handleEdit(id: number) {
    navigate(`/edit-test/${id}`);
  }

  return (
    <>
      {tests.map((test, idx) => (
        <tr key={idx}>
          <td>
            <div className="d-flex align-items-center">
              <a className="avatar avatar-lg me-2 flex-shrink-0" onClick={() => handleEdit(test.id)}>
                <img
                  className="img-fluid object-fit-cover"
                  src="/assets/img/icon/graduation.svg"
                  alt=""
                />
              </a>
              <div>
                <h6 className="fw-medium mb-2">
                  <a onClick={() => handleEdit(test.id)}>{test.testName}</a>
                </h6>
              </div>
            </div>
          </td>
          {/* <td>{row.attempted}</td> */}
          {/* <td>{test.createdBy}</td> */}
          <td>{formatDate(test.createdAt)}</td>
          <td>{test.resource}</td>
          <td>
            <span className="badge badge-sm d-inline-flex align-items-center me-1"
              style={{ backgroundColor: test.isActive ? "#03C95A" : "#ff0000 " }}
            >
              {/* <i className="fa-solid fa-circle fs-5 me-1"></i>{row.status} */}
              {test.isActive ? "Active" : "Inactive"}
            </span>
          </td>
          <td>
            <div className="d-flex align-items-center">
              <a className="d-inline-flex fs-14 me-1 action-icon" onClick={() => handleEdit(test.id)}>
                <i className="isax isax-edit"></i>
              </a>
              <a onClick={() => handleDelete(test.id)} href="#" className="d-inline-flex fs-14 action-icon">
                <i className="isax isax-trash"></i>
              </a>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default CourseTable;
