document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessage = document.getElementById('welcome-message');
    const uploadAssignmentForm = document.getElementById('uploadAssignmentForm');
    const submissionsList = document.getElementById('submissions-list');
    const submissionsSection = document.getElementById('submissions-section');
    const enrolledList = document.getElementById('enrolled-list');
    const enrolledSection = document.getElementById('enrolled-section');
    const updateSessionForm = document.getElementById('updateSessionForm');
    const ratingsList = document.getElementById('ratings-list');
    const ratingsSection = document.getElementById('ratings-section');

    // Fetch and display teacher's name
    function fetchTeacherName() {
        fetch('/teacher_name')
            .then(response => response.json())
            .then(data => {
                welcomeMessage.textContent = `Welcome, ${data.name}`;
            })
            .catch(error => {
                console.error('Error fetching teacher name:', error);
            });
    }

    // Fetch and display enrolled students
    function fetchEnrolledStudents() {
        fetch('/teacher_dashboard_data')
            .then(response => response.json())
            .then(data => {
                if (data.enrolledStudents.length > 0) {
                    enrolledList.innerHTML = '';
                    data.enrolledStudents.forEach(student => {
                        const li = document.createElement('li');
                        li.textContent = `${student.name} (${student.email})`;
                        enrolledList.appendChild(li);
                    });
                    enrolledSection.style.display = 'block';
                } else {
                    enrolledSection.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching enrolled students:', error);
            });
    }

    // Fetch and display ratings and feedback
    function fetchRatings() {
        fetch('/teacher_ratings')
            .then(response => response.json())
            .then(data => {
                if (data.ratings.length > 0) {
                    ratingsList.innerHTML = '';
                    data.ratings.forEach(rating => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <p><strong>Rating:</strong> ${rating.rating}</p>
                            <p><strong>Comments:</strong> ${rating.comments}</p>
                            <p><strong>Student:</strong> ${rating.studentName}</p>
                        `;
                        ratingsList.appendChild(li);
                    });
                    ratingsSection.style.display = 'block';
                } else {
                    ratingsSection.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching ratings:', error);
            });
    }

    // Handle session update form submission
    updateSessionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const session_time = document.getElementById('session_time').value;
        const meet_link = document.getElementById('meet_link').value;

        fetch('/update_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_time, meet_link })
        })
        .then(response => response.text())
        .then(result => {
            alert(result);
            updateSessionForm.reset();
        })
        .catch(error => {
            console.error('Error updating session and Google Meet link:', error);
            alert('Error updating session and Google Meet link!');
        });
    });

    // Handle assignment upload
    uploadAssignmentForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const due_date = document.getElementById('due_date').value;

        fetch('/upload_assignment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, due_date })
        })
        .then(response => response.text())
        .then(result => {
            alert(result);
            uploadAssignmentForm.reset();
        })
        .catch(error => {
            console.error('Error uploading assignment:', error);
            alert('Error uploading assignment!');
        });
    });

    // Fetch and display submissions
    function fetchSubmissions() {
        fetch('/view_submissions')
            .then(response => response.json())
            .then(data => {
                submissionsList.innerHTML = '';
                data.forEach(submission => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <h4>${submission.assignmentTitle} - ${submission.studentName}</h4>
                        <p>Submission: ${submission.submission}</p>
                        <p>Marks: ${submission.marks !== null ? submission.marks : 'Not evaluated'}</p>
                        <p>Feedback: ${submission.feedback || 'No feedback'}</p>
                        <form class="evaluate-form">
                            <input type="hidden" name="submissionId" value="${submission.id}">
                            <label for="marks">Marks:</label>
                            <input type="number" name="marks" min="0" required>
                            <label for="feedback">Feedback:</label>
                            <textarea name="feedback"></textarea>
                            <button type="submit">Evaluate</button>
                        </form>
                    `;
                    submissionsList.appendChild(li);
                });
                submissionsSection.style.display = 'block';

                // Add event listeners to evaluate forms
                document.querySelectorAll('.evaluate-form').forEach(form => {
                    form.addEventListener('submit', function(event) {
                        event.preventDefault();
                        const submissionId = form.querySelector('input[name="submissionId"]').value;
                        const marks = form.querySelector('input[name="marks"]').value;
                        const feedback = form.querySelector('textarea[name="feedback"]').value;

                        fetch('/evaluate_submission', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ submissionId, marks, feedback })
                        })
                        .then(response => response.text())
                        .then(result => {
                            alert(result);
                            fetchSubmissions();
                        })
                        .catch(error => {
                            console.error('Error evaluating submission:', error);
                            alert('Error evaluating submission!');
                        });
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching submissions:', error);
            });
    }

    // Initial load of teacher dashboard data
    fetchTeacherName();
    fetchEnrolledStudents();
    fetchRatings();
    fetchSubmissions();
});