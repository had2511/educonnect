document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const chatButton = document.getElementById('chatButton');
    const chatModal = document.getElementById('chatModal');
    const closeModalButton = document.querySelector('.close');

    logoutButton.addEventListener('click', function() {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = 'index.html';
            } else {
                alert('Error logging out!');
            }
        })
        .catch(error => {
            console.error('Error logging out:', error);
            alert('Error logging out!');
        });
    });

    chatButton.addEventListener('click', function() {
        chatModal.style.display = 'block';
    });

    closeModalButton.addEventListener('click', function() {
        chatModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == chatModal) {
            chatModal.style.display = 'none';
        }
    });

    const subjectList = document.getElementById('subject-list');
    const teacherList = document.getElementById('teacher-list');
    const teachersSection = document.getElementById('teachers-section');
    const enrolledSection = document.getElementById('enrolled-section');
    const enrolledList = document.getElementById('enrolled-list');
    const welcomeMessage = document.getElementById('welcome-message');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSection = document.getElementById('feedback-section');
    const teacherSelect = document.getElementById('teacher-id');
    const assignmentsList = document.getElementById('assignments-list');
    const assignmentsSection = document.getElementById('assignments-section');
    const submissionsList = document.getElementById('submissions-list');

    // Fetch and display student dashboard data
    function fetchStudentDashboardData() {
        fetch('/student_dashboard_data')
            .then(response => response.json())
            .then(data => {
                welcomeMessage.textContent = `Welcome, ${data.studentName}`;

                if (data.enrollments.length > 0) {
                    enrolledSection.style.display = 'block'; // Show enrolled section if there are enrolled classes
                    feedbackSection.style.display = 'block'; // Show feedback section if there are enrolled classes
                    data.enrollments.forEach(enrollment => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <h4>${enrollment.teacherName} - ${enrollment.subject}</h4>
                            <p>Session Time: ${enrollment.session_time || 'Not scheduled'}</p>
                            <p>Google Meet Link: ${enrollment.meet_link ? `<a href="${enrollment.meet_link}" target="_blank">${enrollment.meet_link}</a>` : 'Not available'}</p>
                        `;
                        enrolledList.appendChild(li);

                        // Populate feedback form teacher select options
                        const option = document.createElement('option');
                        option.value = enrollment.teacherId;
                        option.textContent = `${enrollment.teacherName} - ${enrollment.subject}`;
                        teacherSelect.appendChild(option);
                    });
                } else {
                    enrolledSection.style.display = 'none'; // Hide enrolled section if no enrolled classes
                }
            })
            .catch(error => {
                console.error('Error fetching student dashboard data:', error);
            });
    }

    // Fetch and display available subjects
    function fetchAvailableSubjects() {
        fetch('/available_subjects')
            .then(response => response.json())
            .then(data => {
                subjectList.innerHTML = ''; // Clear the list before adding new items
                data.forEach(subject => {
                    const li = document.createElement('li');
                    li.textContent = subject;
                    li.addEventListener('click', () => {
                        fetchTeachers(subject);
                    });
                    subjectList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error fetching subjects:', error);
                const li = document.createElement('li');
                li.textContent = 'Error loading subjects';
                subjectList.appendChild(li);
            });
    }

    // Fetch and display teachers for selected subject
    function fetchTeachers(subject) {
        fetch(`/teachers?subject=${encodeURIComponent(subject)}`)
            .then(response => response.json())
            .then(data => {
                teacherList.innerHTML = ''; // Clear the list before adding new items
                data.forEach(teacher => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <h4>${teacher.name}</h4>
                        <p>Classes: ${teacher.classes}</p>
                        <p>Session Time: ${teacher.session_time || 'Not scheduled'}</p>
                        <p>Average Rating: ${teacher.rating ? teacher.rating.toFixed(1) : 'No ratings yet'}</p>
                        ${teacher.meet_link ? `<p>Google Meet Link: ${teacher.meet_link}</p>` : ''}
                        <a href="${teacher.youtube}" target="_blank">Watch Trial Video</a>
                        <form action="/enroll" method="post">
                            <input type="hidden" name="teacherId" value="${teacher.id}">
                            <button type="submit">Pay & Enroll</button>
                        </form>
                    `;
                    teacherList.appendChild(li);
                });
                teachersSection.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching teachers:', error);
                const li = document.createElement('li');
                li.textContent = 'Error loading teachers';
                teacherList.appendChild(li);
            });
    }

    // Handle feedback form submission
    feedbackForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const teacherId = document.getElementById('teacher-id').value;
        const rating = document.getElementById('rating').value;
        const comments = document.getElementById('comments').value;

        fetch('/submit_feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ teacherId, rating, comments })
        })
        .then(response => response.text())
        .then(result => {
            alert(result);
            feedbackForm.reset(); // Reset the form after successful submission
        })
        .catch(error => {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback!');
        });
    });

    // Fetch and display student submissions with feedback and marks
    function fetchSubmissions() {
        fetch('/student_submissions')
            .then(response => response.json())
            .then(data => {
                submissionsList.innerHTML = '';
                data.forEach(submission => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <h4>${submission.title}</h4>
                        <p>Submission: ${submission.submission}</p>
                        <p>Marks: ${submission.marks !== null ? submission.marks : 'Not evaluated yet'}</p>
                        <p>Feedback: ${submission.feedback || 'No feedback yet'}</p>
                    `;
                    submissionsList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error fetching submissions:', error);
            });
    }

    // Fetch and display assignments
    function fetchAssignments() {
        fetch('/view_assignments')
            .then(response => response.json())
            .then(data => {
                assignmentsList.innerHTML = ''; // Clear the list before adding new items
                data.forEach(assignment => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <h4>${assignment.title}</h4>
                        <p>${assignment.description}</p>
                        <p>Due Date: ${assignment.due_date}</p>
                        <p>Teacher: ${assignment.teacherName}</p>
                        <form class="submit-assignment-form">
                            <input type="hidden" name="assignmentId" value="${assignment.id}">
                            <label for="submission">Your Submission:</label>
                            <textarea name="submission" required></textarea>
                            <button type="submit">Submit Assignment</button>
                        </form>
                    `;
                    assignmentsList.appendChild(li);
                });
                assignmentsSection.style.display = 'block';

                // Add event listeners to submit assignment forms
                document.querySelectorAll('.submit-assignment-form').forEach(form => {
                    form.addEventListener('submit', function(event) {
                        event.preventDefault();
                        const assignmentId = form.querySelector('input[name="assignmentId"]').value;
                        const submission = form.querySelector('textarea[name="submission"]').value;

                        fetch('/submit_assignment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ assignmentId, submission })
                        })
                        .then(response => response.text())
                        .then(result => {
                            alert(result);
                            form.reset();
                        })
                        .catch(error => {
                            console.error('Error submitting assignment:', error);
                            alert('Error submitting assignment!');
                        });
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching assignments:', error);
            });
    }

    // Initial load of student dashboard data and available subjects
    fetchStudentDashboardData();
    fetchAvailableSubjects();
    fetchAssignments();
    fetchSubmissions();
});