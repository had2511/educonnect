const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');

const app = express();
const db = new sqlite3.Database('educonnect.db');  // SQLite database

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Add JSON body parser

// Configure express-session
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Create tables if they don't exist
// Create tables if they don't exist
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, class TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, classes TEXT, subject TEXT, youtube TEXT, session_time TEXT DEFAULT NULL, meet_link TEXT DEFAULT NULL)");
    db.run("CREATE TABLE IF NOT EXISTS enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, teacher_id INTEGER, FOREIGN KEY(student_id) REFERENCES students(id), FOREIGN KEY(teacher_id) REFERENCES teachers(id))");
    db.run("CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, teacher_id INTEGER, rating INTEGER, comments TEXT, FOREIGN KEY(student_id) REFERENCES students(id), FOREIGN KEY(teacher_id) REFERENCES teachers(id))");
    db.run("CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id INTEGER, title TEXT, description TEXT, due_date TEXT, FOREIGN KEY(teacher_id) REFERENCES teachers(id))");
    db.run("CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, assignment_id INTEGER, submission TEXT, marks INTEGER DEFAULT NULL, feedback TEXT DEFAULT NULL, FOREIGN KEY(student_id) REFERENCES students(id), FOREIGN KEY(assignment_id) REFERENCES assignments(id))");
});

// Serve static files (e.g., HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Handle teacher signup
app.post('/teacher_signup', (req, res) => {
    const { name, email, password, classes, subject, youtube } = req.body;
    const classesString = Array.isArray(classes) ? classes.join(',') : classes;

    db.run("INSERT INTO teachers (name, email, password, classes, subject, youtube) VALUES (?, ?, ?, ?, ?, ?)", 
           [name, email, password, classesString, subject, youtube], 
           function(err) {
        if (err) {
            return res.status(500).send("Error saving data");
        }
        res.send("Signup successful!");
    });
});
// Handle teacher login and store teacher name in session
app.post('/teacher_login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM teachers WHERE email = ? AND password = ?", [email, password], function(err, row) {
        if (err) {
            return res.status(500).send("Error logging in");
        }
        if (row) {
            req.session.teacherEmail = row.email; // Store teacher email in session
            req.session.teacherName = row.name;   // Store teacher name in session
            res.redirect('teacher_dashboard.html');
        } else {
            res.send("Invalid email or password");
        }
    });
});

// Endpoint to fetch teacher name for the dashboard
app.get('/teacher_name', (req, res) => {
    const teacherName = req.session.teacherName; // Get teacher name from session

    if (!teacherName) {
        return res.status(401).send("Unauthorized");
    }

    res.json({ name: teacherName });
});

// Handle teacher login and store teacher email in session
app.post('/teacher_login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM teachers WHERE email = ? AND password = ?", [email, password], function(err, row) {
        if (err) {
            return res.status(500).send("Error logging in");
        }
        if (row) {
            req.session.teacherEmail = row.email;
            //req.session.teacherName = row.name; // Store teacher email in session
            res.redirect('teacher_dashboard.html');
        } else {
            res.send("Invalid email or password");
        }
    });
});

// Handle student signup
app.post('/student_signup', (req, res) => {
    const { name, email, password, class: studentClass } = req.body;

    db.run("INSERT INTO students (name, email, password, class) VALUES (?, ?, ?, ?)", [name, email, password, studentClass], function(err) {
        if (err) {
            return res.status(500).send("Error saving data");
        }
        res.send("Signup successful!");
    });
});

// Handle student login and store student name in session
/*app.post('/student_login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM students WHERE email = ? AND password = ?", [email, password], function(err, row) {
        if (err) {
            return res.status(500).send("Error logging in");
        }
        if (row) {
            req.session.studentEmail = row.email; // Store student email in session
            req.session.studentName = row.name;   // Store student name in session
            res.redirect('student_dashboard.html');
        } else {
            res.send("Invalid email or password");
        }
    });
});*/
// Handle student login and store student name in session
app.post('/student_login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM students WHERE email = ? AND password = ?", [email, password], function(err, row) {
        if (err) {
            return res.status(500).send("Error logging in");
        }
        if (row) {
            req.session.studentEmail = row.email; // Store student email in session
            req.session.studentName = row.name;   // Store student name in session
            res.redirect('student_dashboard.html');
        } else {
            res.send("Invalid email or password");
        }
    });
});

// Fetch student dashboard data
app.get('/student_dashboard_data', (req, res) => {
    const studentEmail = req.session.studentEmail; // Get student email from session

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    // Get student name and enrolled classes
    db.get("SELECT name FROM students WHERE email = ?", [studentEmail], function(err, studentRow) {
        if (err || !studentRow) {
            return res.status(500).send("Error fetching student data");
        }

        db.all(`
            SELECT teachers.name AS teacherName, teachers.subject, teachers.session_time, teachers.meet_link 
            FROM enrollments 
            JOIN teachers ON enrollments.teacher_id = teachers.id 
            JOIN students ON enrollments.student_id = students.id 
            WHERE students.email = ?`, [studentEmail], function(err, enrollments) {
            if (err) {
                return res.status(500).send("Error fetching enrollments");
            }

            res.json({
                studentName: studentRow.name,
                enrollments: enrollments
            });
        });
    });
});
// Fetch feedback and ratings for a teacher
/*app.get('/teacher_feedback', (req, res) => {
    const teacherEmail = req.session.teacherEmail; // Get teacher email from session

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM teachers WHERE email = ?", [teacherEmail], function(err, teacherRow) {
        if (err || !teacherRow) {
            return res.status(500).send("Error fetching teacher data");
        }

        const teacherId = teacherRow.id;

        db.all("SELECT students.name AS studentName, feedback.rating, feedback.comments FROM feedback JOIN students ON feedback.student_id = students.id WHERE feedback.teacher_id = ?", [teacherId], function(err, feedbackRows) {
            if (err) {
                return res.status(500).send("Error fetching feedback data");
            }

            res.json(feedbackRows);
        });
    });
});
*/
// Handle feedback submission
// Handle feedback submission
app.post('/submit_feedback', (req, res) => {
    const { teacherId, rating, comments } = req.body;
    const studentEmail = req.session.studentEmail;

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM students WHERE email = ?", [studentEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching student ID");
        }

        const studentId = row.id;

        db.run("INSERT INTO feedback (student_id, teacher_id, rating, comments) VALUES (?, ?, ?, ?)", [studentId, teacherId, rating, comments], function(err) {
            if (err) {
                return res.status(500).send("Error submitting feedback");
            }
            res.send("Feedback submitted successfully!");
        });
    });
});
// Fetch enrolled students and feedback for teacher dashboard
// Fetch enrolled students and feedback for teacher dashboard
app.get('/teacher_dashboard_data', (req, res) => {
    const teacherEmail = req.session.teacherEmail; // Get teacher email from session

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM teachers WHERE email = ?", [teacherEmail], function(err, teacherRow) {
        if (err || !teacherRow) {
            return res.status(500).send("Error fetching teacher data");
        }

        const teacherId = teacherRow.id;

        db.all(`
            SELECT students.name, students.email 
            FROM students 
            JOIN enrollments ON students.id = enrollments.student_id 
            WHERE enrollments.teacher_id = ?`, [teacherId], function(err, enrolledStudents) {
            if (err) {
                return res.status(500).send("Error fetching enrolled students");
            }

            db.all("SELECT students.name AS studentName, feedback.rating, feedback.comments FROM feedback JOIN students ON feedback.student_id = students.id WHERE feedback.teacher_id = ?", [teacherId], function(err, feedbackRows) {
                if (err) {
                    return res.status(500).send("Error fetching feedback data");
                }

                res.json({
                    enrolledStudents: enrolledStudents,
                    feedback: feedbackRows
                });
            });
        });
    });
});

// Handle session update using teacher email from session
app.post('/update_session', (req, res) => {
    const { time, meetLink } = req.body;
    const teacherEmail = req.session.teacherEmail; // Get teacher email from session

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.run("UPDATE teachers SET session_time = ?, meet_link = ? WHERE email = ?", [time, meetLink, teacherEmail], function(err) {
        if (err) {
            console.error("Error updating session details:", err); // Log the error
            return res.status(500).send("Error updating session details");
        }
        res.send("Session details updated successfully!");
    });
});

// Fetch enrolled students
/*app.get('/enrolled_students', (req, res) => {
    const teacherEmail = req.session.teacherEmail; // Get teacher email from session

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.all(`
        SELECT students.name, students.email 
        FROM students 
        JOIN enrollments ON students.id = enrollments.student_id 
        JOIN teachers ON teachers.id = enrollments.teacher_id 
        WHERE teachers.email = ?`, [teacherEmail], function(err, rows) {
        if (err) {
            return res.status(500).send("Error fetching enrolled students");
        }
        res.json(rows);
    });
});
*/
// Fetch available subjects
app.get('/available_subjects', (req, res) => {
    db.all("SELECT DISTINCT subject FROM teachers", function(err, rows) {
        if (err) {
            return res.status(500).send("Error fetching subjects");
        }
        res.json(rows.map(row => row.subject));
    });
});

// Fetch teachers for a subject, exclude meet_link if not enrolled
app.get('/teachers', (req, res) => {
    const { subject } = req.query;
    const studentEmail = req.session.studentEmail; // Get student email from session

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    const studentClass = 1; // Replace with actual student class from session or request

    db.all("SELECT * FROM teachers WHERE subject = ? AND classes LIKE ?", [subject, `%${studentClass}%`], function(err, rows) {
        if (err) {
            return res.status(500).send("Error fetching teachers");
        }

        // Check if student is enrolled in each teacher's class
        const promises = rows.map(teacher => new Promise((resolve, reject) => {
            db.get("SELECT * FROM enrollments JOIN students ON enrollments.student_id = students.id WHERE enrollments.teacher_id = ? AND students.email = ?", [teacher.id, studentEmail], function(err, enrollment) {
                if (err) {
                    return reject(err);
                }
                if (!enrollment) {
                    teacher.meet_link = null; // Remove meet link if not enrolled
                }
                resolve(teacher);
            });
        }));

        Promise.all(promises)
            .then(teachers => res.json(teachers))
            .catch(err => res.status(500).send("Error processing enrollments"));
    });
});

// Handle enrollment and redirect to payment page
app.post('/enroll', (req, res) => {
    const { teacherId } = req.body;
    const studentEmail = req.session.studentEmail; // Get student email from session

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    // Get student ID from student email
    db.get("SELECT id FROM students WHERE email = ?", [studentEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching student ID");
        }

        const studentId = row.id;

        db.run("INSERT INTO enrollments (student_id, teacher_id) VALUES (?, ?)", [studentId, teacherId], function(err) {
            if (err) {
                return res.status(500).send("Error enrolling in class");
            }
            res.redirect('/payment.html');
        });
    });
});

// Handle payment and redirect to student dashboard
app.post('/payment', (req, res) => {
    // Payment processing logic here
    // After successful payment, redirect to student dashboard
    res.redirect('/student_dashboard.html');
});
// Handle feedback submission
app.post('/submit_feedback', (req, res) => {
    const { teacherId, rating, comments } = req.body;
    const studentEmail = req.session.studentEmail;

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM students WHERE email = ?", [studentEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching student ID");
        }

        const studentId = row.id;

        db.run("INSERT INTO feedback (student_id, teacher_id, rating, comments) VALUES (?, ?, ?, ?)", [studentId, teacherId, rating, comments], function(err) {
            if (err) {
                return res.status(500).send("Error submitting feedback");
            }
            res.send("Feedback submitted successfully!");
        });
    });
});
// Endpoint to upload assignments
app.post('/upload_assignment', (req, res) => {
    const { title, description, due_date } = req.body;
    const teacherEmail = req.session.teacherEmail;

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM teachers WHERE email = ?", [teacherEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching teacher ID");
        }

        const teacherId = row.id;

        db.run("INSERT INTO assignments (teacher_id, title, description, due_date) VALUES (?, ?, ?, ?)", [teacherId, title, description, due_date], function(err) {
            if (err) {
                return res.status(500).send("Error uploading assignment");
            }
            res.send("Assignment uploaded successfully!");
        });
    });
});

// Endpoint for students to view assignments
app.get('/view_assignments', (req, res) => {
    const studentEmail = req.session.studentEmail;

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM students WHERE email = ?", [studentEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching student ID");
        }

        const studentId = row.id;

        db.all("SELECT assignments.id, assignments.title, assignments.description, assignments.due_date, teachers.name AS teacherName FROM assignments JOIN enrollments ON assignments.teacher_id = enrollments.teacher_id JOIN teachers ON assignments.teacher_id = teachers.id WHERE enrollments.student_id = ?", [studentId], function(err, assignments) {
            if (err) {
                return res.status(500).send("Error fetching assignments");
            }
            res.json(assignments);
        });
    });
});

// Endpoint for students to submit assignments
app.post('/submit_assignment', (req, res) => {
    const { assignmentId, submission } = req.body;
    const studentEmail = req.session.studentEmail;

    if (!studentEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM students WHERE email = ?", [studentEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching student ID");
        }

        const studentId = row.id;

        db.run("INSERT INTO submissions (student_id, assignment_id, submission) VALUES (?, ?, ?)", [studentId, assignmentId, submission], function(err) {
            if (err) {
                return res.status(500).send("Error submitting assignment");
            }
            res.send("Assignment submitted successfully!");
        });
    });
});

// Endpoint for teachers to view and evaluate submissions
app.get('/view_submissions', (req, res) => {
    const teacherEmail = req.session.teacherEmail;

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.get("SELECT id FROM teachers WHERE email = ?", [teacherEmail], function(err, row) {
        if (err || !row) {
            return res.status(500).send("Error fetching teacher ID");
        }

        const teacherId = row.id;

        db.all("SELECT submissions.id, submissions.submission, submissions.marks, submissions.feedback, students.name AS studentName, assignments.title AS assignmentTitle FROM submissions JOIN assignments ON submissions.assignment_id = assignments.id JOIN students ON submissions.student_id = students.id WHERE assignments.teacher_id = ?", [teacherId], function(err, submissions) {
            if (err) {
                return res.status(500).send("Error fetching submissions");
            }
            res.json(submissions);
        });
    });
});

// Endpoint for teachers to provide marks and feedback
app.post('/evaluate_submission', (req, res) => {
    const { submissionId, marks, feedback } = req.body;
    const teacherEmail = req.session.teacherEmail;

    if (!teacherEmail) {
        return res.status(401).send("Unauthorized");
    }

    db.run("UPDATE submissions SET marks = ?, feedback = ? WHERE id = ?", [marks, feedback, submissionId], function(err) {
        if (err) {
            return res.status(500).send("Error evaluating submission");
        }
        res.send("Submission evaluated successfully!");
    });
});
function checkAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    next();
}
// Fetch ratings and feedback
app.get('/teacher_ratings', checkAuth, (req, res) => {
    const teacherId = req.session.user.id;

    db.all("SELECT feedback.rating, feedback.comments, students.name AS studentName FROM feedback JOIN students ON feedback.student_id = students.id WHERE feedback.teacher_id = ?", [teacherId], (err, rows) => {
        if (err) {
            return res.status(500).send("Error fetching ratings and feedback");
        }

        res.json({ ratings: rows });
    });
});
// Fetch average ratings for teachers
app.get('/teacher_ratings', (req, res) => {
    db.all("SELECT teacher_id, AVG(rating) as average_rating FROM feedback GROUP BY teacher_id", function(err, rows) {
        if (err) {
            return res.status(500).send("Error fetching ratings");
        }
        res.json(rows);
    });
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});