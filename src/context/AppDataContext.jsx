import { createContext, useContext, useEffect, useState } from "react";

const AppDataContext = createContext();

const API_URL = "https://peercolab-backend-production.up.railway.app";

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

      const normalizedUsers = Array.isArray(data)
        ? data.map((u) => ({
            ...u,
            id: String(u.id || "").trim(),
            email: String(u.email || "").trim(),
            full_name: String(u.full_name || "").trim(),
            teacher_id: u.teacher_id ? String(u.teacher_id).trim() : "",
            role: String(u.role || "").trim().toLowerCase(),
          }))
        : [];

      const teacherList = normalizedUsers
        .filter((u) => u.role === "teacher")
        .map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
        }));

      const studentList = normalizedUsers
        .filter((u) => u.role === "student")
        .map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          teacherId: u.teacher_id || "",
        }));

      setTeachers(teacherList);
      setStudents(studentList);

      console.log("Fetched users:", normalizedUsers);
      console.log("Teachers:", teacherList);
      console.log("Students:", studentList);
    } catch (err) {
      console.log("Fetch users error:", err);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      const data = await res.json();

      const reviewList = Array.isArray(data)
        ? data.map((r) => ({
            reviewId: Number(r.review_id),
            subject: String(r.subject || "").trim(),
            group: String(r.group_name || "").trim(),
            reviewer: String(r.reviewer_id || "").trim(),
            teacherId: String(r.teacher_id || "").trim(),
            status: String(r.status || "").trim(),
            marks: Number(r.marks || 0),
            fileName: String(r.original_file_name || r.file_name || "").trim(),
            fileUrl:
              r.file_name && String(r.file_name).trim() !== ""
                ? `${API_URL}/files/${String(r.file_name).trim()}`
                : "",
            submittedAt: r.submitted_at || "",
            startDate: r.start_date ? String(r.start_date).split("T")[0] : "",
            endDate: r.end_date ? String(r.end_date).split("T")[0] : "",
          }))
        : [];

      setReviews(reviewList);
      console.log("Reviews:", reviewList);
    } catch (err) {
      console.log("Fetch reviews error:", err);
    }
  }

  async function fetchFeedbacks() {
    try {
      const res = await fetch(`${API_URL}/feedbacks`);
      const data = await res.json();

      const feedbackList = Array.isArray(data)
        ? data.map((f) => ({
            feedbackId: Number(f.feedback_id),
            reviewId: Number(f.review_id),
            reviewerId: String(f.reviewer_id || "").trim(),
            feedbackText: String(f.feedback_text || "").trim(),
            createdAt: f.created_at || "",
          }))
        : [];

      setFeedbacks(feedbackList);
      console.log("Feedbacks:", feedbackList);
    } catch (err) {
      console.log("Fetch feedbacks error:", err);
    }
  }

  async function addStudent(student) {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: String(student.id || "").trim(),
          full_name: String(student.name || "").trim(),
          email: String(student.email || "").trim().toLowerCase(),
          password: String(student.password || "student123").trim(),
          role: "student",
        }),
      });

      if (!response.ok) return false;

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

      const response = await fetch(`${API_URL}/users/${student.id}`, {
        method: "DELETE",
      });

      if (!response.ok) return false;

      await fetchUsers();
      return true;
    } catch (error) {
      console.log("Delete student error:", error);
      return false;
    }
  }

  async function addTeacher(teacher) {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: String(teacher.id || "").trim(),
          full_name: String(teacher.name || "").trim(),
          email: String(teacher.email || "").trim().toLowerCase(),
          password: String(teacher.password || "teacher123").trim(),
          role: "teacher",
        }),
      });

      if (!response.ok) return false;

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

      const response = await fetch(`${API_URL}/users/${teacher.id}`, {
        method: "DELETE",
      });

      if (!response.ok) return false;

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
        body: JSON.stringify({
          studentId: String(studentId || "").trim(),
          teacherId: String(teacherId || "").trim(),
        }),
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
      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: String(subject || "").trim(),
          group_name: String(group || "").trim(),
          reviewer_id: String(reviewer || "").trim(),
          teacher_id: String(teacherId || "").trim(),
          start_date: startDate || "",
          end_date: endDate || "",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("Assign review failed:", text);
        return false;
      }

      await fetchReviews();
      return true;
    } catch (error) {
      console.log("Assign review error:", error);
      return false;
    }
  }

  async function deleteReview(reviewId) {
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("Delete review failed:", data);
        return false;
      }

      await fetchReviews();
      return true;
    } catch (error) {
      console.log("Delete review error:", error);
      return false;
    }
  }

  async function markReviewCompleted(index, file) {
    try {
      const review = reviews[index];
      if (!review?.reviewId || !file) return false;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/reviews/${review.reviewId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("Upload review file failed:", data);
        return false;
      }

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

      const response = await fetch(`${API_URL}/reviews/${review.reviewId}/marks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marks: Number(marks),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("Update marks failed:", data);
        return false;
      }

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
      const response = await fetch(`${API_URL}/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          review_id: Number(reviewId),
          reviewer_id: String(reviewerId || "").trim(),
          feedback_text: String(feedbackText || "").trim(),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("Add feedback failed:", text);
        return false;
      }

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

      const response = await fetch(`${API_URL}/feedbacks/${feedback.feedbackId}`, {
        method: "DELETE",
      });

      if (!response.ok) return false;

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
        deleteReview,
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