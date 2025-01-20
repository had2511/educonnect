document.addEventListener('DOMContentLoaded', function() {
    const teacherAuthButton = document.getElementById('teacherAuthButton');
    const studentAuthButton = document.getElementById('studentAuthButton');
    const tryAiButton = document.getElementById('tryAiButton');

    teacherAuthButton.addEventListener('click', function() {
        window.location.href = 'teacher_login.html';
    });

    studentAuthButton.addEventListener('click', function() {
        window.location.href = 'student_login.html';
    });

    tryAiButton.addEventListener('click', function() {
        window.location.href = 'https://amaljithuk-eduai.hf.space/';
    });
});