const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ENSURE UPLOAD FOLDER =================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ================= DATABASE =================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Harsha@2257",
  database: "peercolab",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.log("DB ERROR:", err);
  } else {
    console.log("MySQL Connected ✅");
  }
});

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("PeerColab backend running ✅");
});

// ================= AUTH =================
app.post("/signup", (req, res) => {
  const { id, full_name, email, password, role } = req.body;

  const sql =
    "INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [id, full_name, email, password, role], (err, result) => {
    if (err) {
      console.log("SIGNUP ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "Signup successful ✅",
      result,
    });
  });
});

app.post("/login", (req, res) => {
  const { id, password } = req.body;

  const sql =
    "SELECT * FROM users WHERE (id = ? OR email = ?) AND password = ?";

  db.query(sql, [id, id, password], (err, result) => {
    if (err) {
      console.log("LOGIN ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    if (result.length > 0) {
      res.json({
        success: true,
        user: result[0],
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials ❌",
      });
    }
  });
});

// ================= USERS =================
app.get("/users", (req, res) => {
  const sql =
    "SELECT id, full_name, email, password, role, teacher_id FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("GET USERS ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json(result);
  });
});

app.post("/users", (req, res) => {
  const { id, full_name, email, password, role } = req.body;

  const sql =
    "INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [id, full_name, email, password, role], (err, result) => {
    if (err) {
      console.log("ADD USER ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "User added successfully ✅",
      result,
    });
  });
});

app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM users WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("DELETE USER ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully 🗑️",
      result,
    });
  });
});

// ================= ASSIGN TEACHER =================
app.post("/assign-teacher", (req, res) => {
  const { studentId, teacherId } = req.body;

  console.log("ASSIGN REQUEST =>", { studentId, teacherId });

  const sql =
    "UPDATE users SET teacher_id = ? WHERE id = ? AND role = 'student'";

  db.query(sql, [teacherId || null, studentId], (err, result) => {
    if (err) {
      console.log("ASSIGN ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    console.log("ASSIGN RESULT =>", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found or update not applied",
      });
    }

    res.json({
      success: true,
      message: "Teacher assigned successfully ✅",
      result,
    });
  });
});

// ================= REVIEWS =================
app.get("/reviews", (req, res) => {
  const sql = `
    SELECT 
      review_id,
      subject,
      group_name,
      reviewer_id,
      teacher_id,
      status,
      marks,
      file_name,
      file_path,
      original_file_name,
      submitted_at,
      start_date,
      end_date
    FROM reviews
    ORDER BY review_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("GET REVIEWS ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json(result);
  });
});

app.post("/reviews", (req, res) => {
  const { subject, group_name, reviewer_id, teacher_id, start_date, end_date } =
    req.body;

  const sql = `
    INSERT INTO reviews
    (subject, group_name, reviewer_id, teacher_id, status, marks, file_name, file_path, original_file_name, submitted_at, start_date, end_date)
    VALUES (?, ?, ?, ?, 'Pending', 0, '', '', '', '', ?, ?)
  `;

  db.query(
    sql,
    [subject, group_name, reviewer_id, teacher_id, start_date, end_date],
    (err, result) => {
      if (err) {
        console.log("CREATE REVIEW ERROR =>", err);
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Review created successfully ✅",
        result,
      });
    }
  );
});

app.post("/reviews/:id/upload", upload.single("file"), (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const fileName = req.file.filename;
  const filePath = `/uploads/${req.file.filename}`;
  const originalFileName = req.file.originalname;
  const submittedAt = new Date().toLocaleString();

  const sql = `
    UPDATE reviews
    SET
      status = 'Completed',
      file_name = ?,
      file_path = ?,
      original_file_name = ?,
      submitted_at = ?
    WHERE review_id = ?
  `;

  db.query(
    sql,
    [fileName, filePath, originalFileName, submittedAt, id],
    (err, result) => {
      if (err) {
        console.log("UPLOAD REVIEW FILE ERROR =>", err);
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "File uploaded successfully ✅",
        result,
      });
    }
  );
});

app.put("/reviews/:id/marks", (req, res) => {
  const { id } = req.params;
  const { marks } = req.body;

  const sql = "UPDATE reviews SET marks = ? WHERE review_id = ?";

  db.query(sql, [marks, id], (err, result) => {
    if (err) {
      console.log("UPDATE MARKS ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "Marks updated successfully ✅",
      result,
    });
  });
});

// ================= FEEDBACKS =================
app.get("/feedbacks", (req, res) => {
  const sql = `
    SELECT
      feedback_id,
      review_id,
      reviewer_id,
      feedback_text,
      created_at
    FROM feedbacks
    ORDER BY feedback_id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("GET FEEDBACKS ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json(result);
  });
});

app.post("/feedbacks", (req, res) => {
  const { review_id, reviewer_id, feedback_text } = req.body;
  const created_at = new Date().toLocaleString();

  const sql = `
    INSERT INTO feedbacks
    (review_id, reviewer_id, feedback_text, created_at)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [review_id, reviewer_id, feedback_text, created_at],
    (err, result) => {
      if (err) {
        console.log("ADD FEEDBACK ERROR =>", err);
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Feedback added successfully ✅",
        result,
      });
    }
  );
});

app.delete("/feedbacks/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM feedbacks WHERE feedback_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("DELETE FEEDBACK ERROR =>", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully 🗑️",
      result,
    });
  });
});

// ================= START =================
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});