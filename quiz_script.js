// --- ধ্রুবক (Constants) ---
const MARKS_FOR_CORRECT = 1;
const MARKS_FOR_WRONG = 0.33; 
const TOTAL_TIME_MINUTES = 15; 
const QUIZ_STORAGE_KEY = 'mockTestProgress'; // লোকাল স্টোরেজ কী

// --- গ্লোবাল ভেরিয়েবল ---
let quizData = []; 
let totalTimeInSeconds = TOTAL_TIME_MINUTES * 60;
let remainingTime;
let timerInterval;
let userAnswers = [];
let reviewStatus = [];
let currentQuiz = 0;
let testFileName = ''; // বর্তমান টেস্ট ফাইলের নাম সেভ করার জন্য

// --- HTML এলিমেন্ট সিলেকশন ---
const timerDisplay = document.getElementById('timer-display');
const quiz = document.getElementById('quiz');
const answerEls = document.querySelectorAll('.answer');
const questionEl = document.getElementById('question');
const a_text = document.getElementById('a_text');
const b_text = document.getElementById('b_text');
const c_text = document.getElementById('c_text');
const d_text = document.getElementById('d_text');
const paletteGrid = document.getElementById('palette-grid');
const finalSubmitBtn = document.getElementById('final-submit-btn');
const clearBtn = document.getElementById('clear-btn');
const markReviewBtn = document.getElementById('mark-review-btn');
const saveNextBtn = document.getElementById('save-next-btn');

// --- প্রধান কুইজ শুরু করার ফাংশন ---
async function startQuiz() {
    // ১. URL থেকে টেস্ট ফাইলের নাম বের করা
    const params = new URLSearchParams(window.location.search);
    testFileName = params.get('test'); // 'wbp_math_1', 'ssc_gd_science_1'

    if (!testFileName) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: 'Noto Sans Bengali', sans-serif;"><h1>ত্রুটি</h1><p>কোনো টেস্ট ফাইল নির্বাচন করা হয়নি।</p><a href="index.html" style="color: #007bff; text-decoration: none; font-weight: 700;">&larr; হোম পেজে ফিরে যান</a></div>`;
        return;
    }

    try {
        // --- *** পরিবর্তন এখানে *** ---
        // 'data/' ফোল্ডারের পাথ (path) আবার যোগ করা হলো
        const response = await fetch(`data/${testFileName}.json`); 
        
        if (!response.ok) {
            throw new Error('Test file not found');
        }
        quizData = await response.json(); // প্রশ্নগুলো লোড হলো

        // ৩. সেভ করা ডেটা লোড করার চেষ্টা
        const savedProgress = localStorage.getItem(`${QUIZ_STORAGE_KEY}_${testFileName}`);

        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            if (progress.answers && progress.answers.length === quizData.length) {
                userAnswers = progress.answers;
                reviewStatus = progress.review;
                remainingTime = progress.time;
                currentQuiz = progress.current;
            } else {
                initializeNewQuiz();
            }
        } else {
            initializeNewQuiz();
        }
        
        createPalette();
        loadQuiz();
        startTimer();

    } catch (error) {
        console.error('Error:', error);
        // --- *** পরিবর্তন এখানে *** ---
        // এরর মেসেজটি এখন 'data/' ফোল্ডার দেখাবে
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: 'Noto Sans Bengali', sans-serif;"><h1>ত্রুটি</h1><p>টেস্ট ফাইলটি (data/${testFileName}.json) লোড করা সম্ভব হয়নি।</p><p>ফাইলটি কি data ফোল্ডারে আছে?</p><a href="index.html" style="color: #007bff; text-decoration: none; font-weight: 700;">&larr; হোম পেজে ফিরে যান</a></div>`;
    }
}

// কুইজ নতুন করে শুরু করার ফাংশন
function initializeNewQuiz() {
    userAnswers = new Array(quizData.length).fill(undefined);
    reviewStatus = new Array(quizData.length).fill(false);
    remainingTime = totalTimeInSeconds;
    currentQuiz = 0;
}

// অগ্রগতি সেভ করার ফাংশন
function saveProgress() {
    const progress = {
        answers: userAnswers,
        review: reviewStatus,
        time: remainingTime,
        current: currentQuiz
    };
    localStorage.setItem(`${QUIZ_STORAGE_KEY}_${testFileName}`, JSON.stringify(progress));
}

// --- প্যালেট তৈরি করা ---
function createPalette() {
    paletteGrid.innerHTML = '';
    quizData.forEach((_, index) => {
        const paletteBtn = document.createElement('button');
        paletteBtn.innerText = index + 1;
        paletteBtn.classList.add('palette-btn');
        paletteBtn.addEventListener('click', () => {
            jumpToQuestion(index);
        });
        paletteGrid.appendChild(paletteBtn);
    });
}

// --- প্যালেট স্টাইল আপডেট করা ---
function updatePaletteStyles() {
    const buttons = paletteGrid.querySelectorAll('.palette-btn');
    buttons.forEach((btn, index) => {
        btn.classList.remove('current', 'answered', 'unanswered', 'marked', 'marked-answered');
        const isAnswered = userAnswers[index] !== undefined;
        const isMarked = reviewStatus[index] === true;
        if (isAnswered && isMarked) btn.classList.add('marked-answered');
        else if (isAnswered) btn.classList.add('answered');
        else if (isMarked) btn.classList.add('marked');
        else btn.classList.add('unanswered');
        if (index === currentQuiz) btn.classList.add('current');
    });
}

// --- নির্দিষ্ট প্রশ্নে যাওয়া ---
function jumpToQuestion(index) {
    currentQuiz = index;
    loadQuiz();
}

// --- প্রশ্ন লোড করা ---
function loadQuiz() {
    deselectAnswers(); 
    if (userAnswers[currentQuiz] !== undefined) {
        document.getElementById(userAnswers[currentQuiz]).checked = true;
    }
    const currentQuizData = quizData[currentQuiz];
    questionEl.innerText = `${currentQuiz + 1}. ${currentQuizData.question}`;
    a_text.innerText = currentQuizData.a;
    b_text.innerText = currentQuizData.b;
    c_text.innerText = currentQuizData.c;
    d_text.innerText = currentQuizData.d;
    
    updatePaletteStyles();
    if (currentQuiz === quizData.length - 1) saveNextBtn.innerText = "Save";
    else saveNextBtn.innerText = "Save & Next";
}

// --- টাইমার ফাংশন ---
function startTimer() {
    updateTimerDisplay(); // প্রথমে একবার সময় দেখানোর জন্য
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    remainingTime--;
    updateTimerDisplay();
    if (remainingTime < 0) {
        endQuiz(); 
    } else {
        saveProgress(); // প্রতি সেকেন্ডে সেভ
    }
}

function updateTimerDisplay() {
    if (remainingTime < 0) remainingTime = 0;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- পরীক্ষা শেষ করা এবং ফলাফল দেখানো ---
function endQuiz() {
    localStorage.removeItem(`${QUIZ_STORAGE_KEY}_${testFileName}`);
    clearInterval(timerInterval);
    let score = 0, correctCount = 0, wrongCount = 0, unansweredCount = 0;

    userAnswers.forEach((answer, index) => {
        if (answer === undefined) unansweredCount++;
        else if (answer === quizData[index].correct) {
            correctCount++;
            score += MARKS_FOR_CORRECT;
        } else {
            wrongCount++;
            score -= MARKS_FOR_WRONG;
        }
    });

    if (score < 0) score = 0;

    timerDisplay.style.display = 'none';
    document.querySelector('.page-wrapper').style.display = 'none';

    let solutionHTML = `<div class="solution-container">`;
    solutionHTML += `<h1>আপনার ফলাফল</h1>`;
    // স্কোরকার্ড
    solutionHTML += `<div class="scorecard">
        <div>মোট স্কোর: <strong>${score.toFixed(2)} / ${quizData.length * MARKS_FOR_CORRECT}</strong></div>
        <div>সঠিক উত্তর: <span class="score-correct">${correctCount}</span></div>
        <div>ভুল উত্তর: <span class="score-wrong">${wrongCount}</span></div>
        <div>উত্তর দেননি: <span class="score-unanswered">${unansweredCount}</span></div>
    </div>`;
    solutionHTML += `<h2 class="results-title">বিস্তারিত সমাধান</h2>`;
    
    quizData.forEach((quizItem, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === quizItem.correct;
        solutionHTML += `<div class="solution-question">`;
        solutionHTML += `<h3>${index + 1}. ${quizItem.question}</h3>`;
        solutionHTML += `<ul class="options-list">`;
        ['a', 'b', 'c', 'd'].forEach(optionKey => {
            let optionClass = 'option-item';
            if (optionKey === quizItem.correct) optionClass += ' actual-correct';
            if (optionKey === userAnswer && !isCorrect) optionClass += ' user-wrong';
            if (optionKey === userAnswer && isCorrect) optionClass += ' user-correct';
            
            solutionHTML += `<li class="${optionClass}">${quizItem[optionKey]}</li>`; 
        });
        solutionHTML += `</ul>`;
        if (quizItem.explanation) {
             solutionHTML += `<div class="explanation"><strong>সঠিক ব্যাখ্যা:</strong> ${quizItem.explanation}</div>`;
        }
        solutionHTML += `</div>`;
    });
    solutionHTML += `<button class="reload-btn" onclick="window.location.href = 'index.html'">হোম পেজে ফিরে যান</button>`;
    solutionHTML += `</div>`;
    
    document.body.innerHTML = solutionHTML;
    document.body.style.display = 'block';
    document.body.style.alignItems = 'flex-start';

    const scorecardStyle = document.createElement('style');
    scorecardStyle.innerHTML = `
        .scorecard { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f0f2f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; font-size: 1.1rem; }
        @media (max-width: 600px) { .scorecard { grid-template-columns: 1fr; } }
        .scorecard div:first-child { grid-column: 1 / -1; font-size: 1.5rem; font-weight: 700; color: #007bff; }
        .score-correct { color: #389e0d; font-weight: 700; }
        .score-wrong { color: #a8071a; font-weight: 700; }
        .score-unanswered { color: #555; font-weight: 700; }
    `;
    document.head.appendChild(scorecardStyle);
}

// --- ইউটিলিটি ফাংশন ---
function getSelected() {
    let answer = undefined;
    answerEls.forEach(answerEl => {
        if (answerEl.checked) answer = answerEl.id;
    });
    return answer;
}

function deselectAnswers() {
    answerEls.forEach(answerEl => answerEl.checked = false);
}

// --- বাটন ক্লিক ইভেন্ট ---
saveNextBtn.addEventListener('click', () => {
    const answer = getSelected();
    if (answer) {
        userAnswers[currentQuiz] = answer;
        reviewStatus[currentQuiz] = false;
    }
    if (currentQuiz < quizData.length - 1) {
        currentQuiz++;
        loadQuiz();
    } else {
        updatePaletteStyles();
        alert("এটি শেষ প্রশ্ন। পরীক্ষা শেষ করতে 'Submit Test' বাটনে ক্লিক করুন।");
    }
});

markReviewBtn.addEventListener('click', () => {
    const answer = getSelected();
    if (answer) userAnswers[currentQuiz] = answer;
    reviewStatus[currentQuiz] = true;
    
    if (currentQuiz < quizData.length - 1) {
        currentQuiz++;
        loadQuiz();
    } else {
        updatePaletteStyles();
        alert("এটি শেষ প্রশ্ন। পরীক্ষা শেষ করতে 'Submit Test' বাটনে ক্লিক করুন।");
    }
});

clearBtn.addEventListener('click', () => {
    userAnswers[currentQuiz] = undefined;
    deselectAnswers();
    updatePaletteStyles();
});

finalSubmitBtn.addEventListener('click', () => {
    const answer = getSelected();
    if (answer) {
        userAnswers[currentQuiz] = answer;
        reviewStatus[currentQuiz] = false;
    }
    
    const unansweredCount = userAnswers.filter(ans => ans === undefined).length;
    const markedCount = reviewStatus.filter((status, index) => status === true && userAnswers[index] === undefined).length; 

    let confirmMsg = `আপনি কি সত্যিই পরীক্ষাটি সাবমিট করতে চান?`;
    if (unansweredCount > 0 || markedCount > 0) {
        let parts = [];
        if (unansweredCount > 0) parts.push(`${unansweredCount} টি উত্তর না দেওয়া`);
        if (markedCount > 0) parts.push(`${markedCount} টি মার্ক করে রাখা`);
        confirmMsg = `আপনার এখনও ${parts.join(' এবং ')} প্রশ্ন রয়েছে।\nআপনি কি তবুও সাবমিট করতে চান?`;
    }

    if (confirm(confirmMsg)) {
        endQuiz();
    }
});

// --- কুইজ শুরু করুন ---
startQuiz();