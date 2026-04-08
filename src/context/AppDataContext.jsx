import { createContext, useContext, useEffect, useState } from "react";

const AppDataContext = createContext();

const API_URL = "http://localhost:5000";

export function AppDataProvider({ children }) {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchReviews();
    fetchFeedbacks();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();

      const teacherList = data
        .filter((u) => u.role === "teacher")
        .map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
        }));

      const studentList = data
        .filter((u) => u.role === "student")
        .map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          teacherId: u.teacher_id || "",
        }));

      setTeachers(teacherList);
      setStudents(studentList);
    } catch (err) {
      console.log("Fetch users error:", err);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      const data = await res.json();

      const reviewList = data.map((r) => ({
        reviewId: r.review_id,
        subject: r.subject,
        group: r.group_name,
        reviewer: r.reviewer_id,
        teacherId: r.teacher_id,
        status: r.status,
        marks: Number(r.marks || 0),
        fileName: r.original_file_name || r.file_name || "",
        fileUrl: r.file_path || "",
        submittedAt: r.submitted_at || "",
        startDate: r.start_date ? String(r.start_date).split("T")[0] : "",
        endDate: r.end_date ? String(r.end_date).split("T")[0] : "",
      }));

      setReviews(reviewList);
    } catch (err) {
      console.log("Fetch reviews error:", err);
    }
  }

  async function fetchFeedbacks() {
    try {
      const res = await fetch(`${API_URL}/feedbacks`);
      const data = await res.json();

      const feedbackList = data.map((f) => ({
        feedbackId: f.feedback_id,
        reviewId: f.review_id,
        reviewerId: f.reviewer_id,
        feedbackText: f.feedback_text,
        createdAt: f.created_at,
      }));

      setFeedbacks(feedbackList);
    } catch (err) {
      console.log("Fetch feedbacks error:", err);
    }
  }

  async function addStudent(student) {
    try {
      await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: student.id,
          full_name: student.name,
          email: student.email,
          password: student.password || "student123",
          role: "student",
        }),
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.log("Add student error:", error);
      return false;
    }
  }

  async function deleteStudent(index) {
    try {
      const student = students[index];
      if (!student) return false;

      await fetch(`${API_URL}/users/${student.id}`, {
        method: "DELETE",
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.log("Delete student error:", error);
      return false;
    }
  }

  async function addTeacher(teacher) {
    try {
      await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: teacher.id,
          full_name: teacher.name,
          email: teacher.email,
          password: teacher.password || "teacher123",
          role: "teacher",
        }),
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.log("Add teacher error:", error);
      return false;
    }
  }

  async function deleteTeacher(index) {
    try {
      const teacher = teachers[index];
      if (!teacher) return false;

      await fetch(`${API_URL}/users/${teacher.id}`, {
        method: "DELETE",
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.log("Delete teacher error:", error);
      return false;
    }
  }

  async function assignTeacherToStudent(studentId, teacherId) {
    try {
      const response = await fetch(`${API_URL}/assign-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, teacherId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("Assign teacher failed:", data);
        return false;
      }

      await fetchUsers();
      return true;
    } catch (error) {
      console.log("Assign teacher error:", error);
      return false;
    }
  }

  async function assignReview(
    group,
    reviewer,
    startDate,
    endDate,
    subject,
    teacherId = ""
  ) {
    try {
      await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          group_name: group,
          reviewer_id: reviewer,
          teacher_id: teacherId,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      await fetchReviews();
      return true;
    } catch (error) {
      console.log("Assign review error:", error);
      return false;
    }
  }

  async function markReviewCompleted(index, file) {
    try {
      const review = reviews[index];
      if (!review?.reviewId || !file) return false;

      const formData = new FormData();
      formData.append("file", file);

      await fetch(`${API_URL}/reviews/${review.reviewId}/upload`, {
        method: "POST",
        body: formData,
      });

      await fetchReviews();
      return true;
    } catch (error) {
      console.log("Upload review file error:", error);
      return false;
    }
  }

  async function updateMarks(index, marks) {
    try {
      const review = reviews[index];
      if (!review?.reviewId) return false;

      await fetch(`${API_URL}/reviews/${review.reviewId}/marks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marks: Number(marks),
        }),
      });

      await fetchReviews();
      return true;
    } catch (error) {
      console.log("Update marks error:", error);
      return false;
    }
  }

  async function addFeedback(reviewId, reviewerId, feedbackText) {
    if (!feedbackText?.trim()) return false;

    try {
      await fetch(`${API_URL}/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          review_id: reviewId,
          reviewer_id: reviewerId,
          feedback_text: feedbackText,
        }),
      });

      await fetchFeedbacks();
      return true;
    } catch (error) {
      console.log("Add feedback error:", error);
      return false;
    }
  }

  async function deleteFeedback(index) {
    try {
      const feedback = feedbacks[index];
      if (!feedback?.feedbackId) return false;

      await fetch(`${API_URL}/feedbacks/${feedback.feedbackId}`, {
        method: "DELETE",
      });

      await fetchFeedbacks();
      return true;
    } catch (error) {
      console.log("Delete feedback error:", error);
      return false;
    }
  }

  return (
    <AppDataContext.Provider
      value={{
        students,
        teachers,
        reviews,
        feedbacks,
        fetchUsers,
        fetchReviews,
        fetchFeedbacks,
        addStudent,
        deleteStudent,
        addTeacher,
        deleteTeacher,
        assignTeacherToStudent,
        assignReview,
        markReviewCompleted,
        updateMarks,
        addFeedback,
        deleteFeedback,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}