import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const { students, reviews, assignReview, updateMarks, feedbacks = [] } =
    useAppData();

  const [screen, setScreen] = useState("home");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [marksInputs, setMarksInputs] = useState({});
  const [savedMarks, setSavedMarks] = useState({});

  const [form, setForm] = useState({
    subject: "",
    group: "",
    reviewer: "",
    startDate: "",
    endDate: "",
  });

  const myStudents = useMemo(() => {
    return students.filter((s) => s.teacherId === profile?.id);
  }, [students, profile]);

  const myReviews = useMemo(() => {
    return reviews.filter((r) =>
      myStudents.some((s) => s.id === r.reviewer)
    );
  }, [reviews, myStudents]);

  const completedReviews = myReviews.filter(
    (r) => r.status === "Completed"
  ).length;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function getStudentAssignedReviews(studentId) {
    return reviews.filter((r) => r.reviewer === studentId);
  }

  function getStudentCompletionPercentage(studentId) {
    const assigned = getStudentAssignedReviews(studentId);
    if (assigned.length === 0) return 0;

    const completed = assigned.filter((r) => r.status === "Completed").length;
    return Math.round((completed / assigned.length) * 100);
  }

  function getOverallClassProgress() {
    if (myStudents.length === 0) return 0;

    const total = myStudents.reduce(
      (sum, student) => sum + getStudentCompletionPercentage(student.id),
      0
    );

    return Math.round(total / myStudents.length);
  }

  async function handleCreateReview(e) {
    e.preventDefault();

    if (
      !form.subject ||
      !form.group ||
      !form.reviewer ||
      !form.startDate ||
      !form.endDate
    ) {
      return;
    }

    await assignReview(
      form.group,
      form.reviewer,
      form.startDate,
      form.endDate,
      form.subject,
      profile?.id
    );

    setForm({
      subject: "",
      group: "",
      reviewer: "",
      startDate: "",
      endDate: "",
    });

    setShowCreateReview(false);
    setScreen("reviews");
  }

  function getRealReviewIndex(review) {
    return reviews.findIndex((r) => r === review);
  }

  function getFeedbackCount(review) {
    const realIndex = getRealReviewIndex(review);
    return feedbacks.filter((f) => f.reviewIndex === realIndex).length;
  }

  function getStudentName(id) {
    const student = students.find((s) => s.id === id);
    return student ? student.name : id;
  }

  function handleMarksInput(review, value) {
    const realIndex = getRealReviewIndex(review);

    setMarksInputs((prev) => ({
      ...prev,
      [realIndex]: value,
    }));

    setSavedMarks((prev) => ({
      ...prev,
      [realIndex]: false,
    }));
  }

  async function handleSaveMarks(review) {
    const realIndex = getRealReviewIndex(review);

    const value =
      marksInputs[realIndex] !== undefined
        ? marksInputs[realIndex]
        : review.marks || 0;

    await updateMarks(realIndex, value);

    setSavedMarks((prev) => ({
      ...prev,
      [realIndex]: true,
    }));
  }

  function getInputValue(review) {
    const realIndex = getRealReviewIndex(review);

    return marksInputs[realIndex] !== undefined
      ? marksInputs[realIndex]
      : review.marks || 0;
  }

  function renderMarksSection(review) {
    const realIndex = getRealReviewIndex(review);
    const isSaved = savedMarks[realIndex];

    return (
      <div style={{ marginTop: "10px" }}>
        <label>Marks</label>
        <input
          type="number"
          min="0"
          max="100"
          value={getInputValue(review)}
          onChange={(e) => handleMarksInput(review, e.target.value)}
          style={{ marginTop: "6px" }}
        />

        <button
          className="primary-btn"
          style={{
            marginTop: "10px",
            background: isSaved ? "#22c55e" : undefined,
            cursor: isSaved ? "not-allowed" : "pointer",
          }}
          disabled={!!isSaved}
          onClick={() => handleSaveMarks(review)}
        >
          {isSaved ? "Saved ✅" : "Save Marks"}
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand">PeerColab</h1>
          <p>{profile?.full_name || "Teacher"}</p>
          <p style={{ textTransform: "capitalize", opacity: 0.8 }}>
            {profile?.role || "teacher"}
          </p>
        </div>

        <button className="primary-btn" onClick={signOut}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {screen === "home" && (
          <>
            <div className="admin-header">
              <h2>Teacher Dashboard</h2>
              <p>Manage assigned students, reviews, uploads, and marks</p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "20px",
              }}
            >
              <button
                className="primary-btn"
                onClick={() => setShowCreateReview(!showCreateReview)}
              >
                {showCreateReview ? "Close Create Review" : "Create Review"}
              </button>
            </div>

            <div className="dashboard-grid">
              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => setScreen("students")}
              >
                <h3>My Students</h3>
                <p>{myStudents.length}</p>
              </div>

              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => setScreen("reviews")}
              >
                <h3>Total Reviews</h3>
                <p>{myReviews.length}</p>
              </div>

              <div className="card">
                <h3>Completed Reviews</h3>
                <p>{completedReviews}</p>
              </div>
            </div>

            <div className="card">
              <h3>Class Progress</h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>Overall Submission Progress</span>
                <span>{getOverallClassProgress()}%</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "14px",
                  background: "#1e293b",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${getOverallClassProgress()}%`,
                    height: "100%",
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  }}
                />
              </div>
            </div>

            {showCreateReview && (
              <div className="card">
                <h3>Create Review</h3>

                <form className="form-grid" onSubmit={handleCreateReview}>
                  <input
                    name="subject"
                    placeholder="Subject / Course Name"
                    value={form.subject}
                    onChange={handleChange}
                  />

                  <input
                    name="group"
                    placeholder="Group Name"
                    value={form.group}
                    onChange={handleChange}
                  />

                  <select
                    name="reviewer"
                    value={form.reviewer}
                    onChange={handleChange}
                  >
                    <option value="">Select Student</option>
                    {myStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.id})
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                  />

                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                  />

                  <button className="primary-btn" type="submit">
                    Assign Review
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {screen === "students" && !selectedStudent && (
          <>
            <div className="admin-header">
              <h2>My Students</h2>
              <p>Only students assigned to you are visible here</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button className="primary-btn" onClick={() => setScreen("home")}>
                Back
              </button>
            </div>

            <div className="card">
              <h3>Students List</h3>

              {myStudents.length === 0 ? (
                <p>No students assigned to you yet</p>
              ) : (
                myStudents.map((student) => {
                  const percent = getStudentCompletionPercentage(student.id);

                  return (
                    <div
                      key={student.id}
                      style={{
                        marginBottom: "18px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>
                          <strong>{student.name}</strong> — {student.id}
                        </span>
                        <span>{percent}%</span>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: "12px",
                          background: "#1e293b",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            background:
                              "linear-gradient(135deg, #2563eb, #7c3aed)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {screen === "students" && selectedStudent && (
          <>
            <div className="admin-header">
              <h2>{selectedStudent.name}</h2>
              <p>{selectedStudent.email}</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button
                className="primary-btn"
                onClick={() => setSelectedStudent(null)}
              >
                Back
              </button>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Assigned Reviews</h3>
                <p>{getStudentAssignedReviews(selectedStudent.id).length}</p>
              </div>

              <div className="card">
                <h3>Completed</h3>
                <p>{getStudentCompletionPercentage(selectedStudent.id)}%</p>
              </div>

              <div className="card">
                <h3>Pending</h3>
                <p>
                  {getStudentAssignedReviews(selectedStudent.id).length -
                    getStudentAssignedReviews(selectedStudent.id).filter(
                      (r) => r.status === "Completed"
                    ).length}
                </p>
              </div>
            </div>

            <div className="card">
              <h3>Progress</h3>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>Review Submission Progress</span>
                <span>{getStudentCompletionPercentage(selectedStudent.id)}%</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "14px",
                  background: "#1e293b",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${getStudentCompletionPercentage(selectedStudent.id)}%`,
                    height: "100%",
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3>Submitted Reviews & Marks</h3>
              {getStudentAssignedReviews(selectedStudent.id).length === 0 ? (
                <p>No reviews assigned</p>
              ) : (
                getStudentAssignedReviews(selectedStudent.id).map((review, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <strong>{review.subject || "No Subject"}</strong>
                    </div>
                    <div>Group: {review.group}</div>
                    <div>Status: {review.status}</div>
                    <div>Start: {review.startDate || "-"}</div>
                    <div>Deadline: {review.endDate || "-"}</div>
                    <div>
                      File: {review.fileName ? review.fileName : "Not uploaded yet"}
                    </div>

                    {review.fileUrl && (
                      <div style={{ marginTop: "6px" }}>
                        <a href={review.fileUrl} target="_blank" rel="noreferrer">
                          View Uploaded File
                        </a>
                      </div>
                    )}

                    <div style={{ marginTop: "6px" }}>
                      Feedback Count: {getFeedbackCount(review)}
                    </div>

                    {renderMarksSection(review)}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {screen === "reviews" && (
          <>
            <div className="admin-header">
              <h2>Reviews</h2>
              <p>Track all review activity, uploads, and marks</p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <button className="primary-btn" onClick={() => setScreen("home")}>
                Back
              </button>

              <button
                className="primary-btn"
                onClick={() => {
                  setScreen("home");
                  setShowCreateReview(true);
                }}
              >
                Create Review
              </button>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Total Reviews</h3>
                <p>{myReviews.length}</p>
              </div>

              <div className="card">
                <h3>Completed Reviews</h3>
                <p>{completedReviews}</p>
              </div>

              <div className="card">
                <h3>Pending Reviews</h3>
                <p>{myReviews.length - completedReviews}</p>
              </div>
            </div>

            <div className="card">
              <h3>All Reviews List</h3>

              {myReviews.length === 0 ? (
                <p>No reviews created yet</p>
              ) : (
                myReviews.map((review, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <strong>{review.subject || "No Subject"}</strong>
                    </div>
                    <div>Group: {review.group}</div>
                    <div>Reviewer: {getStudentName(review.reviewer)}</div>
                    <div>Status: {review.status}</div>
                    <div>Start Date: {review.startDate || "-"}</div>
                    <div>Deadline: {review.endDate || "-"}</div>
                    <div>
                      Submitted File:{" "}
                      {review.fileName ? review.fileName : "Not uploaded yet"}
                    </div>

                    {review.fileUrl && (
                      <div style={{ marginTop: "6px" }}>
                        <a href={review.fileUrl} target="_blank" rel="noreferrer">
                          View Uploaded File
                        </a>
                      </div>
                    )}

                    <div style={{ marginTop: "6px" }}>
                      Feedback Count: {getFeedbackCount(review)}
                    </div>

                    {renderMarksSection(review)}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}