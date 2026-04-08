import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const {
    reviews,
    markReviewCompleted,
    feedbacks = [],
    students = [],
    teachers = [],
    addFeedback,
  } = useAppData();

  const [activeTab, setActiveTab] = useState("active");
  const [selectedFeedbackReview, setSelectedFeedbackReview] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});

  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === profile?.id) || null;
  }, [students, profile]);

  const assignedTeacher = useMemo(() => {
    if (!currentStudent?.teacherId) return null;
    return teachers.find((t) => t.id === currentStudent.teacherId) || null;
  }, [currentStudent, teachers]);

  const myReviews = useMemo(() => {
    return reviews.filter((review) => review.reviewer === profile?.id);
  }, [reviews, profile]);

  const peerSubmittedReviews = useMemo(() => {
    if (!currentStudent?.teacherId) return [];

    const sameTeacherStudentIds = students
      .filter((student) => student.teacherId === currentStudent.teacherId)
      .map((student) => student.id);

    return reviews.filter(
      (review) =>
        review.reviewer !== profile?.id &&
        sameTeacherStudentIds.includes(review.reviewer) &&
        review.status === "Completed"
    );
  }, [reviews, profile, students, currentStudent]);

  const totalReviews = myReviews.length;

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  function isActiveReview(review) {
    if (!review.startDate || !review.endDate) {
      return review.status !== "Completed";
    }

    return (
      review.status !== "Completed" &&
      review.startDate <= todayString &&
      review.endDate >= todayString
    );
  }

  function isUpcomingReview(review) {
    if (!review.startDate) return false;
    return review.startDate > todayString;
  }

  function isMissedDeadline(review) {
    if (!review.endDate) return false;
    return review.status !== "Completed" && review.endDate < todayString;
  }

  const activeReviews = myReviews.filter(isActiveReview);
  const upcomingReviews = myReviews.filter(isUpcomingReview);
  const completedReviews = myReviews.filter((r) => r.status === "Completed");
  const missedReviews = myReviews.filter(isMissedDeadline);

  function getReviewId(review) {
    return review.reviewId;
  }

  function handleFileSelect(review, file) {
    if (!file) return;

    const reviewId = getReviewId(review);
    if (!reviewId) return;

    setSelectedFiles((prev) => ({
      ...prev,
      [reviewId]: file,
    }));
  }

  async function handleSubmitReview(review) {
    const reviewIndex = reviews.findIndex((r) => r.reviewId === review.reviewId);
    if (reviewIndex === -1) return;

    const file = selectedFiles[review.reviewId];
    if (!file) return;

    await markReviewCompleted(reviewIndex, file);

    setSelectedFiles((prev) => {
      const updated = { ...prev };
      delete updated[review.reviewId];
      return updated;
    });

    setActiveTab("completed");
  }

  function getFeedbacksForReview(review) {
    return feedbacks.filter((fb) => fb.reviewId === review.reviewId);
  }

  function getStudentName(id) {
    const student = students.find((s) => s.id === id);
    return student ? student.name : id;
  }

  function handleFeedbackInput(reviewId, value) {
    setFeedbackInputs((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  }

  async function handleSubmitFeedback(review) {
    const text = feedbackInputs[review.reviewId];

    if (!text || !text.trim()) return;

    await addFeedback(review.reviewId, profile?.id, text);

    setFeedbackInputs((prev) => ({
      ...prev,
      [review.reviewId]: "",
    }));
  }

  function renderReviewList(list, emptyText) {
    if (list.length === 0) {
      return <p>{emptyText}</p>;
    }

    return list.map((review, index) => {
      const feedbackCount = getFeedbacksForReview(review).length;

      return (
        <div
          key={review.reviewId || index}
          style={{
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            <strong>{review.subject || "No Subject"}</strong>
          </div>

          <div>Group: {review.group || "Not assigned"}</div>
          <div>Status: {review.status}</div>
          <div>Start Date: {review.startDate || "-"}</div>
          <div>Deadline: {review.endDate || "-"}</div>

          {review.submittedAt && <div>Submitted At: {review.submittedAt}</div>}

          {review.fileName && (
            <div style={{ marginTop: "6px" }}>
              Uploaded File: {review.fileName}
            </div>
          )}

          {review.fileUrl && (
            <div style={{ marginTop: "6px" }}>
              <a
                href={`http://localhost:5000${review.fileUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                View Uploaded File
              </a>
            </div>
          )}

          <div style={{ marginTop: "8px" }}>
            Total Feedbacks: {feedbackCount}
          </div>

          <button
            className="primary-btn"
            style={{ marginTop: "8px", marginRight: "10px" }}
            onClick={() => setSelectedFeedbackReview(review)}
          >
            View Feedback
          </button>

          {review.status !== "Completed" && !isMissedDeadline(review) && (
            <div style={{ marginTop: "12px" }}>
              <input
                type="file"
                onChange={(e) => handleFileSelect(review, e.target.files[0])}
              />

              {selectedFiles[review.reviewId] && (
                <div style={{ marginTop: "8px" }}>
                  Selected File: {selectedFiles[review.reviewId].name}
                </div>
              )}

              <button
                className="primary-btn"
                style={{ marginTop: "10px" }}
                onClick={() => handleSubmitReview(review)}
              >
                Submit Review
              </button>
            </div>
          )}

          {review.status === "Completed" && (
            <button
              className="primary-btn"
              style={{ marginTop: "10px", background: "#16a34a" }}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          )}

          {isMissedDeadline(review) && (
            <div
              style={{
                marginTop: "8px",
                color: "#ef4444",
                fontWeight: "600",
              }}
            >
              Deadline Missed
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand">PeerColab</h1>
          <p>{profile?.full_name || "Student"}</p>
          <p style={{ textTransform: "capitalize", opacity: 0.8 }}>
            {profile?.role || "student"}
          </p>
        </div>

        <button className="primary-btn" onClick={signOut}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="admin-header">
          <h2>Student Dashboard</h2>
          <p>Track reviews, upload files, and manage submission progress</p>
        </div>

        <div className="card" style={{ marginBottom: "18px" }}>
          <h3>Assignment Status</h3>
          <div style={{ marginTop: "8px" }}>
            Teacher:{" "}
            <strong>{assignedTeacher ? assignedTeacher.name : "Not assigned yet"}</strong>
          </div>
          <div style={{ marginTop: "6px" }}>
            Status:{" "}
            <strong>
              {assignedTeacher
                ? "You can receive reviews from your teacher"
                : "Wait for admin to assign you to a teacher"}
            </strong>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Total Reviews</h3>
            <p>{totalReviews}</p>
          </div>

          <div
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("completed")}
          >
            <h3>Completed Reviews</h3>
            <p>{completedReviews.length}</p>
          </div>

          <div className="card">
            <h3>Pending Reviews</h3>
            <p>{totalReviews - completedReviews.length}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Active Reviews</h3>
            <p>{activeReviews.length}</p>
          </div>

          <div className="card">
            <h3>Upcoming Reviews</h3>
            <p>{upcomingReviews.length}</p>
          </div>

          <div className="card">
            <h3>Missed Deadlines</h3>
            <p>{missedReviews.length}</p>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <button
              className="primary-btn"
              onClick={() => setActiveTab("active")}
            >
              Active
            </button>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming
            </button>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("missed")}
            >
              Deadline Missed
            </button>

            <button
              className="primary-btn"
              onClick={() => setActiveTab("peerFeedback")}
            >
              Peer Feedback
            </button>
          </div>

          {activeTab === "active" && (
            <>
              <h3>Active Reviews</h3>
              {renderReviewList(activeReviews, "No active reviews")}
            </>
          )}

          {activeTab === "upcoming" && (
            <>
              <h3>Upcoming Reviews</h3>
              {renderReviewList(upcomingReviews, "No upcoming reviews")}
            </>
          )}

          {activeTab === "completed" && (
            <>
              <h3>Completed Reviews</h3>
              {renderReviewList(completedReviews, "No completed reviews")}
            </>
          )}

          {activeTab === "missed" && (
            <>
              <h3>Deadline Missed</h3>
              {renderReviewList(missedReviews, "No missed deadline reviews")}
            </>
          )}

          {activeTab === "peerFeedback" && (
            <>
              <h3>Give Feedback to Other Students</h3>

              {!assignedTeacher ? (
                <p>You need a teacher assignment before peer feedback becomes available</p>
              ) : peerSubmittedReviews.length === 0 ? (
                <p>No peer submissions available yet</p>
              ) : (
                peerSubmittedReviews.map((review, index) => (
                  <div
                    key={review.reviewId || index}
                    style={{
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <strong>{review.subject || "No Subject"}</strong>
                    </div>
                    <div>Submitted By: {getStudentName(review.reviewer)}</div>
                    <div>Group: {review.group || "Not assigned"}</div>
                    <div>Status: {review.status}</div>

                    {review.fileUrl && (
                      <div style={{ marginTop: "6px" }}>
                        <a
                          href={`http://localhost:5000${review.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Submission
                        </a>
                      </div>
                    )}

                    <textarea
                      placeholder="Write feedback here..."
                      value={feedbackInputs[review.reviewId] || ""}
                      onChange={(e) =>
                        handleFeedbackInput(review.reviewId, e.target.value)
                      }
                      style={{
                        width: "100%",
                        minHeight: "100px",
                        marginTop: "10px",
                        padding: "12px",
                        borderRadius: "12px",
                        border: "1px solid #334155",
                        background: "#020617",
                        color: "white",
                      }}
                    />

                    <button
                      className="primary-btn"
                      style={{ marginTop: "10px" }}
                      onClick={() => handleSubmitFeedback(review)}
                    >
                      Submit Feedback
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {selectedFeedbackReview && (
          <div className="card">
            <h3>Feedbacks</h3>

            <button
              className="primary-btn"
              style={{ marginBottom: "12px" }}
              onClick={() => setSelectedFeedbackReview(null)}
            >
              Close
            </button>

            {getFeedbacksForReview(selectedFeedbackReview).length === 0 ? (
              <p>No feedback yet</p>
            ) : (
              getFeedbacksForReview(selectedFeedbackReview).map((fb, i) => (
                <div
                  key={fb.feedbackId || i}
                  style={{
                    marginBottom: "12px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <strong>{getStudentName(fb.reviewerId)}</strong>
                  <div style={{ marginTop: "4px" }}>{fb.feedbackText}</div>
                  <div style={{ marginTop: "4px", opacity: 0.7 }}>
                    {fb.createdAt}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}