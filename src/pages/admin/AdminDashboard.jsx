import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const {
    students,
    teachers,
    reviews,
    addStudent,
    addTeacher,
    deleteStudent,
    deleteTeacher,
    updateMarks,
    assignTeacherToStudent,
    fetchUsers,
  } = useAppData();

  const [screen, setScreen] = useState("home");
  const [editStudents, setEditStudents] = useState(false);
  const [editTeachers, setEditTeachers] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [showStudentProgressList, setShowStudentProgressList] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showTeacherList, setShowTeacherList] = useState(false);
  const [showAssignedTeacherStudents, setShowAssignedTeacherStudents] =
    useState(false);
  const [showAvailableStudentsForTeacher, setShowAvailableStudentsForTeacher] =
    useState(false);

  const [selectedStudentIdsForTeacher, setSelectedStudentIdsForTeacher] =
    useState([]);
  const [teacherMessage, setTeacherMessage] = useState("");

  const [newStudent, setNewStudent] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
  });

  const [newTeacher, setNewTeacher] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
  });

  const leaderboard = useMemo(() => {
    return [...students]
      .map((student) => {
        const receivedReviews = reviews.filter(
          (r) => r.reviewFor === student.id
        );

        const totalMarks = receivedReviews.reduce(
          (sum, r) => sum + Number(r.marks || 0),
          0
        );

        const avg =
          receivedReviews.length > 0
            ? (totalMarks / receivedReviews.length).toFixed(1)
            : "0.0";

        return {
          ...student,
          avg,
        };
      })
      .sort((a, b) => Number(b.avg) - Number(a.avg));
  }, [students, reviews]);

  function getStudentAssignedReviews(studentId) {
    return reviews.filter((r) => r.reviewer === studentId);
  }

  function getStudentReceivedReviews(studentId) {
    return reviews.filter((r) => r.reviewFor === studentId);
  }

  function getStudentCompletionPercentage(studentId) {
    const assigned = getStudentAssignedReviews(studentId);
    if (assigned.length === 0) return 0;

    const completed = assigned.filter((r) => r.status === "Completed").length;
    return Math.round((completed / assigned.length) * 100);
  }

  function getStudentAverageMarks(studentId) {
    const received = getStudentReceivedReviews(studentId);
    if (received.length === 0) return "0.0";

    const total = received.reduce((sum, r) => sum + Number(r.marks || 0), 0);
    return (total / received.length).toFixed(1);
  }

  function getTeacherStudents(teacherId) {
    return students.filter((s) => s.teacherId === teacherId);
  }

  function getOverallStudentAnalysis() {
    if (students.length === 0) {
      return {
        avgCompletion: 0,
        completedStudents: 0,
        pendingStudents: 0,
      };
    }

    const percentages = students.map((s) =>
      getStudentCompletionPercentage(s.id)
    );

    const avgCompletion = Math.round(
      percentages.reduce((sum, p) => sum + p, 0) / students.length
    );

    const completedStudents = percentages.filter((p) => p === 100).length;
    const pendingStudents = students.length - completedStudents;

    return {
      avgCompletion,
      completedStudents,
      pendingStudents,
    };
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name || !newStudent.email) return;

    await addStudent(newStudent);

    setNewStudent({
      id: "",
      name: "",
      email: "",
      password: "",
    });
  }

  async function handleAddTeacher(e) {
    e.preventDefault();
    if (!newTeacher.id || !newTeacher.name || !newTeacher.email) return;

    await addTeacher(newTeacher);

    setNewTeacher({
      id: "",
      name: "",
      email: "",
      password: "",
    });
  }

  function handleStudentCheckboxChange(studentId) {
    setSelectedStudentIdsForTeacher((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });
  }

  async function handleAssignStudentsToTeacher() {
    if (!selectedTeacher || selectedStudentIdsForTeacher.length === 0) return;

    let successCount = 0;

    for (const studentId of selectedStudentIdsForTeacher) {
      const ok = await assignTeacherToStudent(studentId, selectedTeacher.id);
      if (ok) successCount++;
    }

    await fetchUsers();

    setSelectedStudentIdsForTeacher([]);
    setShowAvailableStudentsForTeacher(false);
    setShowAssignedTeacherStudents(true);

    if (successCount > 0) {
      setTeacherMessage("Students assigned successfully ✅");
    } else {
      setTeacherMessage("Assignment failed ❌");
    }
  }

  async function handleRemoveStudentFromTeacher(studentId) {
    if (!selectedTeacher || !studentId) return;

    const ok = await assignTeacherToStudent(studentId, null);
    await fetchUsers();
    setShowAssignedTeacherStudents(true);
    setTeacherMessage(ok ? "Student removed successfully ✅" : "Remove failed ❌");
  }

  const overall = getOverallStudentAnalysis();
  const markedReviewsCount = reviews.filter(
    (r) => Number(r.marks || 0) > 0
  ).length;

  const availableStudentsForTeacher = selectedTeacher
    ? students.filter((student) => !student.teacherId)
    : [];

  const assignedStudentsForSelectedTeacher = selectedTeacher
    ? students.filter((student) => student.teacherId === selectedTeacher.id)
    : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand">PeerColab</h1>
          <p>{profile?.full_name || "Admin"}</p>
          <p style={{ textTransform: "capitalize", opacity: 0.8 }}>
            {profile?.role || "admin"}
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
              <h2>Admin Dashboard</h2>
              <p>Manage students, teachers, reviews, and performance tracking</p>
            </div>

            <div className="dashboard-grid">
              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setScreen("students");
                  setSelectedStudent(null);
                  setShowStudentList(false);
                  setShowStudentProgressList(false);
                }}
              >
                <h3>Total Students</h3>
                <p>{students.length}</p>
              </div>

              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setScreen("teachers");
                  setSelectedTeacher(null);
                  setShowTeacherList(false);
                  setShowAssignedTeacherStudents(false);
                  setShowAvailableStudentsForTeacher(false);
                }}
              >
                <h3>Total Teachers</h3>
                <p>{teachers.length}</p>
              </div>

              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => setScreen("reviews")}
              >
                <h3>Total Reviews</h3>
                <p>{reviews.length}</p>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Marks Assigned</h3>
                <p>{markedReviewsCount}</p>
              </div>

              <div className="card">
                <h3>Average Completion</h3>
                <p>{overall.avgCompletion}%</p>
              </div>

              <div className="card">
                <h3>Completed Students</h3>
                <p>{overall.completedStudents}</p>
              </div>
            </div>

            <div className="card">
              <h3>🏆 Leaderboard</h3>
              {leaderboard.length === 0 ? (
                <p>No students yet</p>
              ) : (
                leaderboard.map((student, index) => (
                  <div key={student.id} style={{ marginBottom: "10px" }}>
                    {index + 1}. {student.name} — Avg Marks: {student.avg}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {screen === "reviews" && (
          <>
            <div className="admin-header">
              <h2>All Reviews</h2>
              <p>See every review, status, and marks in one place</p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <button className="primary-btn" onClick={() => setScreen("home")}>
                Back
              </button>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Total Reviews</h3>
                <p>{reviews.length}</p>
              </div>

              <div className="card">
                <h3>Completed Reviews</h3>
                <p>{reviews.filter((r) => r.status === "Completed").length}</p>
              </div>

              <div className="card">
                <h3>Marks Assigned</h3>
                <p>{markedReviewsCount}</p>
              </div>
            </div>

            <div className="card">
              <h3>Review List</h3>
              {reviews.length === 0 ? (
                <p>No reviews available</p>
              ) : (
                reviews.map((review, index) => (
                  <div
                    key={review.reviewId || index}
                    style={{
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <strong>{review.group || "No Group"}</strong>
                    <div>Reviewer: {review.reviewer}</div>
                    <div>Status: {review.status}</div>
                    <div>Marks: {review.marks}/100</div>

                    <div style={{ marginTop: "8px" }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={review.marks}
                        onChange={(e) => updateMarks(index, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {screen === "students" && !selectedStudent && (
          <>
            <div className="admin-header">
              <h2>Students Management</h2>
              <p>View all students, track progress, and manage the student list</p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <button
                className="primary-btn"
                onClick={() => {
                  setScreen("home");
                  setEditStudents(false);
                }}
              >
                Back
              </button>

              <button
                className="primary-btn"
                onClick={() => setEditStudents(!editStudents)}
              >
                {editStudents ? "Close Edit" : "Edit"}
              </button>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Total Students</h3>
                <p>{students.length}</p>
              </div>

              <div className="card">
                <h3>Average Completion</h3>
                <p>{overall.avgCompletion}%</p>
              </div>

              <div className="card">
                <h3>Marks Assigned</h3>
                <p>{markedReviewsCount}</p>
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ marginBottom: 0 }}>All Students Progress Analysis</h3>

                <button
                  className="primary-btn"
                  onClick={() =>
                    setShowStudentProgressList(!showStudentProgressList)
                  }
                >
                  {showStudentProgressList ? "▲ Hide" : "▼ Show"}
                </button>
              </div>

              {students.length === 0 ? (
                <p>No students available</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Overall Progress of {students.length} Students</span>
                    <span>{overall.avgCompletion}%</span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "14px",
                      background: "#1e293b",
                      borderRadius: "999px",
                      overflow: "hidden",
                      marginBottom: showStudentProgressList ? "18px" : "0",
                    }}
                  >
                    <div
                      style={{
                        width: `${overall.avgCompletion}%`,
                        height: "100%",
                        background:
                          "linear-gradient(135deg, #2563eb, #7c3aed)",
                      }}
                    />
                  </div>

                  {showStudentProgressList &&
                    students.map((student) => {
                      const percent = getStudentCompletionPercentage(student.id);

                      return (
                        <div key={student.id} style={{ marginBottom: "18px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span>{student.name}</span>
                            <span>{percent}%</span>
                          </div>

                          <div
                            style={{
                              width: "100%",
                              height: "10px",
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
                    })}
                </>
              )}
            </div>

            {editStudents && (
              <div className="card">
                <h3>Add New Student</h3>
                <form className="form-grid" onSubmit={handleAddStudent}>
                  <input
                    placeholder="Student ID"
                    value={newStudent.id}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, id: e.target.value })
                    }
                  />
                  <input
                    placeholder="Student Name"
                    value={newStudent.name}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Student Email"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                  />
                  <input
                    placeholder="Student Password"
                    value={newStudent.password}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, password: e.target.value })
                    }
                  />
                  <button className="primary-btn" type="submit">
                    Add Student
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ marginBottom: 0 }}>Student List</h3>
                <button
                  className="primary-btn"
                  onClick={() => setShowStudentList(!showStudentList)}
                >
                  {showStudentList ? "▲ Hide" : "▼ Show"}
                </button>
              </div>

              {showStudentList && (
                <>
                  {students.length === 0 ? (
                    <p>No students available</p>
                  ) : (
                    students.map((student, index) => {
                      const assignedTeacher = teachers.find(
                        (t) => t.id === student.teacherId
                      );

                      return (
                        <div
                          key={student.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "14px",
                            paddingBottom: "10px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedStudent(student);
                            }}
                          >
                            <strong>{student.name}</strong> — {student.id}
                            <div style={{ opacity: 0.8, marginTop: "4px" }}>
                              Teacher:{" "}
                              {assignedTeacher
                                ? `${assignedTeacher.name} (${assignedTeacher.id})`
                                : "Not assigned"}
                            </div>
                          </div>

                          {editStudents && (
                            <button
                              className="primary-btn"
                              onClick={() => deleteStudent(index)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
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

            <div style={{ marginBottom: "24px" }}>
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
                <h3>Completion</h3>
                <p>{getStudentCompletionPercentage(selectedStudent.id)}%</p>
              </div>

              <div className="card">
                <h3>Average Marks</h3>
                <p>{getStudentAverageMarks(selectedStudent.id)}</p>
              </div>
            </div>

            <div className="card">
              <h3>Teacher Assignment</h3>

              <div style={{ marginBottom: "12px" }}>
                <strong>
                  {(() => {
                    const assignedTeacher = teachers.find(
                      (t) => t.id === selectedStudent.teacherId
                    );

                    return assignedTeacher
                      ? `${assignedTeacher.name} (${assignedTeacher.id})`
                      : "Not assigned";
                  })()}
                </strong>
              </div>
            </div>

            <div className="card">
              <h3>Student Review & Work Analysis</h3>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>Work Progress</span>
                  <span>
                    {getStudentCompletionPercentage(selectedStudent.id)}%
                  </span>
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
                      width: `${getStudentCompletionPercentage(
                        selectedStudent.id
                      )}%`,
                      height: "100%",
                      background:
                        "linear-gradient(135deg, #2563eb, #7c3aed)",
                    }}
                  />
                </div>
              </div>

              <h4>Assigned Reviews</h4>
              {getStudentAssignedReviews(selectedStudent.id).length === 0 ? (
                <p>No assigned reviews</p>
              ) : (
                getStudentAssignedReviews(selectedStudent.id).map((review, i) => (
                  <div key={review.reviewId || i} style={{ marginBottom: "10px" }}>
                    <strong>{review.group || "No Group"}</strong> —{" "}
                    {review.status}
                  </div>
                ))
              )}

              <h4 style={{ marginTop: "20px" }}>Received Marks</h4>
              {getStudentReceivedReviews(selectedStudent.id).length === 0 ? (
                <p>No received reviews yet</p>
              ) : (
                getStudentReceivedReviews(selectedStudent.id).map((review, i) => (
                  <div key={review.reviewId || i} style={{ marginBottom: "10px" }}>
                    <strong>{review.group || "No Group"}</strong> —{" "}
                    {review.marks}/100
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {screen === "teachers" && !selectedTeacher && (
          <>
            <div className="admin-header">
              <h2>Teachers Management</h2>
              <p>View teachers, manage the teacher list, and track assigned students</p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <button
                className="primary-btn"
                onClick={() => {
                  setScreen("home");
                  setEditTeachers(false);
                }}
              >
                Back
              </button>

              <button
                className="primary-btn"
                onClick={() => setEditTeachers(!editTeachers)}
              >
                {editTeachers ? "Close Edit" : "Edit"}
              </button>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Total Teachers</h3>
                <p>{teachers.length}</p>
              </div>

              <div className="card">
                <h3>Total Assigned Students</h3>
                <p>{students.filter((s) => s.teacherId).length}</p>
              </div>

              <div className="card">
                <h3>Total Reviews</h3>
                <p>{reviews.length}</p>
              </div>
            </div>

            {editTeachers && (
              <div className="card">
                <h3>Add New Teacher</h3>
                <form className="form-grid" onSubmit={handleAddTeacher}>
                  <input
                    placeholder="Teacher ID"
                    value={newTeacher.id}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, id: e.target.value })
                    }
                  />
                  <input
                    placeholder="Teacher Name"
                    value={newTeacher.name}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Teacher Email"
                    value={newTeacher.email}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, email: e.target.value })
                    }
                  />
                  <input
                    placeholder="Teacher Password"
                    value={newTeacher.password}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, password: e.target.value })
                    }
                  />
                  <button className="primary-btn" type="submit">
                    Add Teacher
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ marginBottom: 0 }}>Teacher List</h3>
                <button
                  className="primary-btn"
                  onClick={() => setShowTeacherList(!showTeacherList)}
                >
                  {showTeacherList ? "▲ Hide" : "▼ Show"}
                </button>
              </div>

              {showTeacherList && (
                <>
                  {teachers.length === 0 ? (
                    <p>No teachers available</p>
                  ) : (
                    teachers.map((teacher, index) => {
                      const assignedCount = getTeacherStudents(teacher.id).length;

                      return (
                        <div
                          key={teacher.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "14px",
                            paddingBottom: "10px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setSelectedStudentIdsForTeacher([]);
                              setTeacherMessage("");
                              setShowAssignedTeacherStudents(false);
                              setShowAvailableStudentsForTeacher(false);
                            }}
                          >
                            <strong>{teacher.name}</strong> — {teacher.id}
                            <div style={{ opacity: 0.8, marginTop: "4px" }}>
                              Students:{" "}
                              {assignedCount > 0
                                ? `${assignedCount} assigned`
                                : "Not assigned"}
                            </div>
                          </div>

                          {editTeachers && (
                            <button
                              className="primary-btn"
                              onClick={() => deleteTeacher(index)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </>
        )}

        {screen === "teachers" && selectedTeacher && (
          <>
            <div className="admin-header">
              <h2>{selectedTeacher.name}</h2>
              <p>{selectedTeacher.email}</p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <button
                className="primary-btn"
                onClick={() => setSelectedTeacher(null)}
              >
                Back
              </button>
            </div>

            <div className="card">
              <h3>Teacher Details</h3>
              <div style={{ marginBottom: "8px" }}>
                <strong>ID:</strong> {selectedTeacher.id}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Name:</strong> {selectedTeacher.name}
              </div>
              <div>
                <strong>Email:</strong> {selectedTeacher.email}
              </div>
            </div>

            <div className="card">
              <h3>Assign / Edit Students</h3>

              <div style={{ marginBottom: "12px" }}>
                <strong>
                  {assignedStudentsForSelectedTeacher.length > 0
                    ? `${assignedStudentsForSelectedTeacher.length} students assigned`
                    : "Not assigned"}
                </strong>
              </div>

              <button
                className="primary-btn"
                onClick={() =>
                  setShowAvailableStudentsForTeacher(
                    !showAvailableStudentsForTeacher
                  )
                }
              >
                {showAvailableStudentsForTeacher
                  ? "▲ Hide Students"
                  : "▼ Select Students"}
              </button>

              {showAvailableStudentsForTeacher && (
                <div style={{ marginTop: "14px" }}>
                  {availableStudentsForTeacher.length === 0 ? (
                    <p style={{ marginBottom: "12px" }}>
                      No unassigned students available
                    </p>
                  ) : (
                    <div style={{ marginBottom: "12px" }}>
                      {availableStudentsForTeacher.map((student) => (
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
                            checked={selectedStudentIdsForTeacher.includes(
                              student.id
                            )}
                            onChange={() =>
                              handleStudentCheckboxChange(student.id)
                            }
                          />
                          <span>
                            {student.name} ({student.id})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    className="primary-btn"
                    style={{ marginTop: "12px" }}
                    onClick={handleAssignStudentsToTeacher}
                  >
                    Save Student Assignment
                  </button>
                </div>
              )}

              {teacherMessage && (
                <p style={{ marginTop: "10px" }}>{teacherMessage}</p>
              )}
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ marginBottom: 0 }}>Assigned Students</h3>
                <button
                  className="primary-btn"
                  onClick={() =>
                    setShowAssignedTeacherStudents(!showAssignedTeacherStudents)
                  }
                >
                  {showAssignedTeacherStudents ? "▲ Hide" : "▼ Show"}
                </button>
              </div>

              {showAssignedTeacherStudents && (
                <>
                  {assignedStudentsForSelectedTeacher.length === 0 ? (
                    <p>No students assigned</p>
                  ) : (
                    assignedStudentsForSelectedTeacher.map((student) => {
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
                              marginBottom: "6px",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span>
                              <strong>{student.name}</strong> — {student.id}
                            </span>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span>{percent}%</span>
                              <button
                                className="primary-btn"
                                onClick={() =>
                                  handleRemoveStudentFromTeacher(student.id)
                                }
                              >
                                Remove
                              </button>
                            </div>
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
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}