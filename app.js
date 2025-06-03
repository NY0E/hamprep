// Initialize question bank
let questionBank = { technician: [], general: [], extra: [] };
let progress = JSON.parse(localStorage.getItem('hamPrepProgress')) || {
    technician: { pass: 1, correct: 0, seen: [] },
    general: { pass: 1, correct: 0, seen: [] },
    extra: { pass: 1, correct: 0, seen: [] }
};
let currentExam = 'technician';
let currentQuestion = null;

// Load question pools from JSON files
async function loadQuestionPools() {
    try {
        const techResponse = await fetch('technician.json');
        questionBank.technician = await techResponse.json();
        const genResponse = await fetch('general.json');
        questionBank.general = await genResponse.json();
        const extraResponse = await fetch('extra.json');
        questionBank.extra = await extraResponse.json();
        loadQuestion();
    } catch (error) {
        console.error('Error loading question pools:', error);
        document.getElementById('question').textContent = 'Error loading questions. Check console.';
    }
}

function loadQuestion() {
    const examQuestions = questionBank[currentExam];
    if (examQuestions.length === 0) {
        document.getElementById('question').textContent = 'Loading questions...';
        return;
    }
    // Start with first 10 questions, expand based on proficiency
    let availableQuestions = examQuestions.filter(q => 
        progress[currentExam].seen.length < 10 ? examQuestions.indexOf(q) < 10 : true
    );
    if (progress[currentExam].correct / (progress[currentExam].seen.length || 1) < 0.8) {
        availableQuestions = availableQuestions.filter(q => examQuestions.indexOf(q) < 10);
    }
    const unseen = availableQuestions.filter(q => !progress[currentExam].seen.includes(q.id));
    const toShow = unseen.length > 0 ? unseen : availableQuestions;
    currentQuestion = toShow[Math.floor(Math.random() * toShow.length)];
    
    document.getElementById('question').textContent = currentQuestion.question;
    document.getElementById('reference').textContent = 'Reference: ' + currentQuestion.refs;
    const answersDiv = document.getElementById('answers');
    answersDiv.innerHTML = '';
    let answers = [currentQuestion.answers[currentQuestion.correct]];
    if (progress[currentExam].pass > 1) {
        // Pick one random incorrect answer
        let incorrectOptions = currentQuestion.answers
            .map((ans, index) => ({ ans, index }))
            .filter(opt => opt.index !== currentQuestion.correct);
        const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)].ans;
        answers.push(randomIncorrect);
        answers = answers.sort(() => Math.random() - 0.5); // Shuffle
    }
    answers.forEach(ans => {
        const div = document.createElement('div');
        div.className = 'answer';
        div.textContent = ans;
        div.onclick = () => checkAnswer(ans);
        answersDiv.appendChild(div);
    });
    document.getElementById('feedback').textContent = '';
    updateProgress();
}

function checkAnswer(selected) {
    const feedback = document.getElementById('feedback');
    const answers = document.querySelectorAll('.answer');
    const correctAnswer = currentQuestion.answers[currentQuestion.correct];
    if (!progress[currentExam].seen.includes(currentQuestion.id)) {
        progress[currentExam].seen.push(currentQuestion.id);
    }
    if (selected === correctAnswer) {
        feedback.textContent = 'Correct!';
        feedback.style.color = 'green';
        progress[currentExam].correct++;
        answers.forEach(ans => {
            if (ans.textContent === correctAnswer) ans.classList.add('correct');
        });
    } else {
        feedback.textContent = 'Incorrect! The right answer is: ' + correctAnswer;
        feedback.style.color = 'red';
        answers.forEach(ans => {
            if (ans.textContent === correctAnswer) ans.classList.add('correct');
            else ans.classList.add('incorrect');
        });
    }
    localStorage.setItem('hamPrepProgress', JSON.stringify(progress));
    if (progress[currentExam].seen.length >= questionBank[currentExam].length) {
        progress[currentExam].pass++;
        progress[currentExam].seen = [];
        progress[currentExam].correct = 0;
    }
    updateProgress();
}

function nextQuestion() {
    loadQuestion();
}

function updateProgress() {
    const total = progress[currentExam].seen.length || 1;
    document.getElementById('progress').textContent = 
        `Progress: ${progress[currentExam].correct}/${total} correct (Pass ${progress[currentExam].pass})`;
}

// Handle exam selection
document.getElementById('examLevel').addEventListener('change', (e) => {
    currentExam = e.target.value;
    loadQuestion();
});

// Initial load
loadQuestionPools();
