import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const { students, reviews, assignReview, updateMarks, deleteReview } = useAppData();

  const [screen, setScreen] = useState("home");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCompletedSubject, setSelectedCompletedSubject] = useState(null);

  const [showCourseAllStudents, setShowCourseAllStudents] = useState(false);
  const [showCourseCompletedStudents, setShowCourseCompletedStudents] = useState(false);
  const [showCourseRemainingStudents, setShowCourseRemainingStudents] = useState(false);

  const [marksInputs, setMarksInputs] = useState({});
  const [savedMarks, setSavedMarks] = useState({});

  const [form, setForm] = useState({
    subject: "",
    group: "",
    reviewers: [],
    startDate: "",
    endDate: "",
  });

  const myStudents = useMemo(() => {
    return students.filter(
      (s) => String(s.teacherId || "").trim() === String(profile?.id || "").trim()
    );
  }, [students, profile]);

  const myReviews = useMemo(() => {
    return reviews.filter((r) =>
      myStudents.some(
        (s) => String(s.id || "").trim() === String(r.reviewer || "").trim()
      )
    );
  }, [reviews, myStudents]);

  const totalCoursesCount = useMemo(() => {
    const subjectSet = new Set(
      myReviews.map((review) => review.subject || "No Subject")
    );
    return subjectSet.size;
  }, [myReviews]);

  const completedReviews = myReviews.filter(
    (r) => String(r.status || "").trim().toLowerCase() === "completed"
  ).length;

  const pendingReviews = myReviews.filter(
    (r) => String(r.status || "").trim().toLowerCase() !== "completed"
  ).length;

  const totalSubjectGroups = useMemo(() => {
    const grouped = {};

    myReviews.forEach((review) => {
      const subjectName = review.subject || "No Subject";
      if (!grouped[subjectName]) grouped[subjectName] = [];
      grouped[subjectName].push(review);
    });

    return Object.entries(grouped).map(([subject, reviewList]) => ({
      subject,
      reviews: reviewList,
      total: reviewList.length,
      completed: reviewList.filter(
        (r) => String(r.status || "").trim().toLowerCase() === "completed"
      ).length,
      pending: reviewList.filter(
        (r) => String(r.status || "").trim().toLowerCase() !== "completed"
      ).length,
    }));
  }, [myReviews]);

  const completedSubjectGroups = useMemo(() => {
    const grouped = {};

    myReviews
      .filter((review) => String(review.status || "").trim().toLowerCase() === "completed")
      .forEach((review) => {
        const subjectName = review.subject || "No Subject";
        if (!grouped[subjectName]) grouped[subjectName] = [];
        grouped[subjectName].push(review);
      });

    return Object.entries(grouped).map(([subject, reviewList]) => ({
      subject,
      reviews: reviewList,
      total: reviewList.length,
    }));
  }, [myReviews]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleReviewerToggle(studentId) {
    setForm((prev) => ({
      ...prev,
      reviewers: prev.reviewers.includes(studentId)
        ? prev.reviewers.filter((id) => id !== studentId)
        : [...prev.reviewers, studentId],
    }));
  }

  function getStudentAssignedReviews(studentId) {
    return reviews.filter(
      (r) => String(r.reviewer || "").trim() === String(studentId || "").trim()
    );
  }

  function getStudentCompletionPercentage(studentId) {
    const assigned = getStudentAssignedReviews(studentId);
    if (assigned.length === 0) return 0;

    const completed = assigned.filter(
      (r) => String(r.status || "").trim().toLowerCase() === "completed"
    ).length;

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
      form.reviewers.length === 0 ||
      !form.startDate ||
      !form.endDate
    ) {
      return;
    }

    for (const reviewerId of form.reviewers) {
      await assignReview(
        form.group,
        reviewerId,
        form.startDate,
        form.endDate,
        form.subject,
        profile?.id
      );
    }

    setForm({
      subject: "",
      group: "",
      reviewers: [],
      startDate: "",
      endDate: "",
    });

    setShowStudentSelector(false);
    setShowCreateReview(false);
    setScreen("reviewsHome");
  }

  function getStudentName(id) {
    const student = students.find(
      (s) => String(s.id || "").trim() === String(id || "").trim()
    );
    return student ? student.name : id;
  }

  function handleMarksInput(review, value) {
    setMarksInputs((prev) => ({
      ...prev,
      [review.reviewId]: value,
    }));

    setSavedMarks((prev) => ({
      ...prev,
      [review.reviewId]: false,
    }));
  }

  async function handleSaveMarks(review) {
    const realIndex = reviews.findIndex(
      (r) => Number(r.reviewId) === Number(review.reviewId)
    );

    const value =
      marksInputs[review.reviewId] !== undefined
        ? marksInputs[review.reviewId]
        : review.marks || 0;

    await updateMarks(realIndex, value);

    setSavedMarks((prev) => ({
      ...prev,
      [review.reviewId]: true,
    }));
  }

  function getInputValue(review) {
    return marksInputs[review.reviewId] !== undefined
      ? marksInputs[review.reviewId]
      : review.marks || 0;
  }

  function renderMarksSection(review) {
    const isSaved = savedMarks[review.reviewId];

    return (
      <div style={{ marginTop: "10px" }}>
        <label>Marks (out of 10)</label>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value={getInputValue(review)}
            onChange={(e) => handleMarksInput(review, e.target.value)}
            style={{ marginTop: "6px", maxWidth: "140px" }}
          />

          <button
            className="primary-btn"
            style={{
              marginTop: "6px",
              background: isSaved ? "#22c55e" : undefined,
              cursor: isSaved ? "not-allowed" : "pointer",
            }}
            disabled={!!isSaved}
            onClick={() => handleSaveMarks(review)}
          >
            {isSaved ? "Saved ✅" : "Save Marks"}
          </button>
        </div>
      </div>
    );
  }

  async function handleDeleteReview(reviewId) {
    const ok = await deleteReview(reviewId);
    if (!ok) {
      alert("Failed to delete review");
    }
  }

  function getSubjectReviews(subjectName) {
    return myReviews.filter(
      (review) => (review.subject || "No Subject") === subjectName
    );
  }

  function getSubjectCompletedReviews(subjectName) {
    return getSubjectReviews(subjectName).filter(
      (review) => String(review.status || "").trim().toLowerCase() === "completed"
    );
  }

  function getSubjectRemainingReviews(subjectName) {
    return getSubjectReviews(subjectName).filter(
      (review) => String(review.status || "").trim().toLowerCase() !== "completed"
    );
  }

  function renderClassProgressDetails() {
    return (
      <div className="card">
        <h3>All Students Progress</h3>
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
                }}
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
                      background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  function renderTotalSubjectDetails(subjectName) {
    const subjectReviews = getSubjectReviews(subjectName);
    const completedList = getSubjectCompletedReviews(subjectName);
    const remainingList = getSubjectRemainingReviews(subjectName);

    return (
      <>
        <div className="dashboard-grid">
          <div
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCourseAllStudents(!showCourseAllStudents)}
          >
            <h3>Total Students</h3>
            <p>{subjectReviews.length}</p>
          </div>

          <div
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCourseCompletedStudents(!showCourseCompletedStudents)}
          >
            <h3>Completed Submission</h3>
            <p>{completedList.length}</p>
          </div>

          <div
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCourseRemainingStudents(!showCourseRemainingStudents)}
          >
            <h3>Remaining Students</h3>
            <p>{remainingList.length}</p>
          </div>
        </div>

        <div className="card">
          <h3>Course Summary</h3>
          <div style={{ marginBottom: "10px" }}>
            <strong>Subject:</strong> {subjectName}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>Completed:</strong> {completedList.length}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>Remaining:</strong> {remainingList.length}
          </div>
        </div>

        {showCourseAllStudents && (
          <div className="card">
            <h3>All Students In This Course</h3>
            {subjectReviews.length === 0 ? (
              <p>No students in this course</p>
            ) : (
              subjectReviews.map((review, index) => (
                <div
                  key={review.reviewId || index}
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <strong>{getStudentName(review.reviewer)}</strong> — {review.reviewer}
                  </div>
                  <div>Status: {review.status}</div>
                  <div>Group: {review.group}</div>
                  <div>Marks: {review.marks}/10</div>

                  <div style={{ marginTop: "10px" }}>
                    <button
                      className="primary-btn"
                      onClick={() => handleDeleteReview(review.reviewId)}
                    >
                      Delete Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showCourseCompletedStudents && (
          <div className="card">
            <h3>Completed Students</h3>
            {completedList.length === 0 ? (
              <p>No completed submissions yet</p>
            ) : (
              completedList.map((review, index) => (
                <div
                  key={review.reviewId || index}
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <strong>{getStudentName(review.reviewer)}</strong> — {review.reviewer}
                  </div>
                  <div>Status: {review.status}</div>
                  <div>Group: {review.group}</div>
                  <div>Start Date: {review.startDate || "-"}</div>
                  <div>Deadline: {review.endDate || "-"}</div>
                  <div>
                    Submitted File: {review.fileName ? review.fileName : "Not uploaded yet"}
                  </div>

                  {review.fileUrl && (
                    <div
                      style={{
                        marginTop: "6px",
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <a href={review.fileUrl} target="_blank" rel="noreferrer">
                        View Uploaded File
                      </a>
                      <a href={review.fileUrl} download>
                        Download File
                      </a>
                    </div>
                  )}

                  {renderMarksSection(review)}

                  <div style={{ marginTop: "10px" }}>
                    <button
                      className="primary-btn"
                      onClick={() => handleDeleteReview(review.reviewId)}
                    >
                      Delete Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showCourseRemainingStudents && (
          <div className="card">
            <h3>Remaining Students</h3>
            {remainingList.length === 0 ? (
              <p>No remaining students</p>
            ) : (
              remainingList.map((review, index) => (
                <div
                  key={review.reviewId || index}
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <strong>{getStudentName(review.reviewer)}</strong> — {review.reviewer}
                  </div>
                  <div>Status: {review.status}</div>
                  <div>Group: {review.group}</div>
                  <div>Start Date: {review.startDate || "-"}</div>
                  <div>Deadline: {review.endDate || "-"}</div>
                  <div>Submitted File: Not uploaded yet</div>

                  <div style={{ marginTop: "10px" }}>
                    <button
                      className="primary-btn"
                      onClick={() => handleDeleteReview(review.reviewId)}
                    >
                      Delete Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </>
    );
  }

  function renderCompletedSubjectDetails(subjectName) {
    const subjectReviews = getSubjectCompletedReviews(subjectName);

    return (
      <div className="card">
        <h3>Completed Reviews Under {subjectName}</h3>
        {subjectReviews.length === 0 ? (
          <p>No completed submissions</p>
        ) : (
          subjectReviews.map((review, index) => (
            <div
              key={review.reviewId || index}
              style={{
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <strong>{getStudentName(review.reviewer)}</strong> — {review.reviewer}
              </div>
              <div>Course: {review.subject || "No Subject"}</div>
              <div>Group: {review.group}</div>
              <div>Status: {review.status}</div>
              <div>Start Date: {review.startDate || "-"}</div>
              <div>Deadline: {review.endDate || "-"}</div>
              <div>
                Submitted File: {review.fileName ? review.fileName : "Not uploaded yet"}
              </div>

              {review.fileUrl && (
                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <a href={review.fileUrl} target="_blank" rel="noreferrer">
                    View Uploaded File
                  </a>
                  <a href={review.fileUrl} download>
                    Download File
                  </a>
                </div>
              )}

              <div style={{ marginTop: "8px" }}>
                Current Marks: {Number(review.marks || 0)}/10
              </div>

              {renderMarksSection(review)}

              <div style={{ marginTop: "10px" }}>
                <button
                  className="primary-btn"
                  onClick={() => handleDeleteReview(review.reviewId)}
                >
                  Delete Review
                </button>
              </div>
            </div>
          ))
        )}
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
                onClick={() => {
                  setScreen("reviewsHome");
                  setSelectedSubject(null);
                  setShowCourseAllStudents(false);
                  setShowCourseCompletedStudents(false);
                  setShowCourseRemainingStudents(false);
                }}
              >
                <h3>Total Courses</h3>
                <p>{totalCoursesCount}</p>
              </div>

              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setScreen("completedHome");
                  setSelectedCompletedSubject(null);
                }}
              >
                <h3>Completed Reviews</h3>
                <p>{completedReviews}</p>
              </div>

              <div className="card">
                <h3>Pending Reviews</h3>
                <p>{pendingReviews}</p>
              </div>
            </div>

            <div
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => setScreen("classProgress")}
            >
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

                  <div style={{ gridColumn: "1 / -1" }}>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ marginBottom: "12px" }}
                      onClick={() => setShowStudentSelector(!showStudentSelector)}
                    >
                      {showStudentSelector ? "▲ Hide Students" : "▼ Select Students"}
                    </button>

                    {showStudentSelector && (
                      <>
                        <label style={{ display: "block", marginBottom: "10px" }}>
                          Select Students
                        </label>

                        {myStudents.length === 0 ? (
                          <p>No students assigned to you</p>
                        ) : (
                          <div>
                            {myStudents.map((student) => (
                              <label
                                key={student.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  marginBottom: "10px",
                                  padding: "10px 12px",
                                  background: "rgba(255,255,255,0.03)",
                                  borderRadius: "12px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={form.reviewers.includes(student.id)}
                                  onChange={() => handleReviewerToggle(student.id)}
                                />
                                <span>
                                  {student.name} ({student.id})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button className="primary-btn" type="submit">
                    Assign Review
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {screen === "classProgress" && (
          <>
            <div className="admin-header">
              <h2>Class Progress</h2>
              <p>Each student's review completion progress</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button className="primary-btn" onClick={() => setScreen("home")}>
                Back
              </button>
            </div>

            {renderClassProgressDetails()}
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
                            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
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
                      (r) => String(r.status || "").trim().toLowerCase() === "completed"
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
                    key={review.reviewId || i}
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
                      <div
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <a href={review.fileUrl} target="_blank" rel="noreferrer">
                          View Uploaded File
                        </a>
                        <a href={review.fileUrl} download>
                          Download File
                        </a>
                      </div>
                    )}

                    {renderMarksSection(review)}

                    <div style={{ marginTop: "10px" }}>
                      <button
                        className="primary-btn"
                        onClick={() => handleDeleteReview(review.reviewId)}
                      >
                        Delete Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {screen === "reviewsHome" && !selectedSubject && (
          <>
            <div className="admin-header">
              <h2>Total Courses</h2>
              <p>Select a course to view full review details</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button className="primary-btn" onClick={() => setScreen("home")}>
                Back
              </button>
            </div>

            <div className="card">
              <h3>Course / Subject Buttons</h3>

              {totalSubjectGroups.length === 0 ? (
                <p>No reviews created yet</p>
              ) : (
                totalSubjectGroups.map((item, index) => (
                  <button
                    key={`${item.subject}-${index}`}
                    className="primary-btn"
                    style={{ marginRight: "12px", marginBottom: "12px" }}
                    onClick={() => {
                      setSelectedSubject(item.subject);
                      setShowCourseAllStudents(false);
                      setShowCourseCompletedStudents(false);
                      setShowCourseRemainingStudents(false);
                    }}
                  >
                    {item.subject}
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {screen === "reviewsHome" && selectedSubject && (
          <>
            <div className="admin-header">
              <h2>{selectedSubject}</h2>
              <p>Course-wise review tracking</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button
                className="primary-btn"
                onClick={() => setSelectedSubject(null)}
              >
                Back
              </button>
            </div>

            {renderTotalSubjectDetails(selectedSubject)}
          </>
        )}

        {screen === "completedHome" && !selectedCompletedSubject && (
          <>
            <div className="admin-header">
              <h2>Completed Reviews</h2>
              <p>Select a course to view completed submissions and marks</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button className="primary-btn" onClick={() => setScreen("home")}>
                Back
              </button>
            </div>

            <div className="card">
              <h3>Course / Subject Buttons</h3>

              {completedSubjectGroups.length === 0 ? (
                <p>No completed reviews yet</p>
              ) : (
                completedSubjectGroups.map((item, index) => (
                  <button
                    key={`${item.subject}-${index}`}
                    className="primary-btn"
                    style={{ marginRight: "12px", marginBottom: "12px" }}
                    onClick={() => setSelectedCompletedSubject(item.subject)}
                  >
                    {item.subject}
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {screen === "completedHome" && selectedCompletedSubject && (
          <>
            <div className="admin-header">
              <h2>{selectedCompletedSubject}</h2>
              <p>Completed submissions, files, and marks</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button
                className="primary-btn"
                onClick={() => setSelectedCompletedSubject(null)}
              >
                Back
              </button>
            </div>

            {renderCompletedSubjectDetails(selectedCompletedSubject)}
          </>
        )}
      </main>
    </div>
  );
}