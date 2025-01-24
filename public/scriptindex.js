document.addEventListener('DOMContentLoaded', function() {
    const teacherAuthButton = document.getElementById('teacherAuthButton');
    const studentAuthButton = document.getElementById('studentAuthButton');
    const tryAiButton = document.getElementById('tryAiButton');
    const aiModal = document.getElementById('aiModal');
    const closeModal = document.querySelector('.close');

    teacherAuthButton.addEventListener('click', function() {
        window.location.href = 'teacher_login.html';
    });

    studentAuthButton.addEventListener('click', function() {
        window.location.href = 'student_login.html';
    });

    tryAiButton.addEventListener('click', function() {
        aiModal.style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        aiModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === aiModal) {
            aiModal.style.display = 'none';
        }
    });
});