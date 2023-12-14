// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            connect();
        }
    });

    if (window.settings.username) connect();
})

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {

        $('#stateText').text('Connecting...');

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Connected to roomId ${state.roomId}`);

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert('no username entered');
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
    $('#roomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Earned Diamonds: <b>${diamondsCount.toLocaleString()}</b>`)
}

function generateUsernameLink(data) {
    return `${data.uniqueId}`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new message to the chat container
 */
// ... (previous code)

function addChatItem(color, data, text, summarize) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    let message = $(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>

            </span>
        </div>
    `);

    container.append(message);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}


// ... (previous code)

function addGiftItem(data) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid="${streakId}" class="gift-item">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Repeat: <b class="repeat-count" style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                            </td>
                        </tr>
                    </table>
                </div>
            </span>
            <div class="thankyou-message">${generateUsernameLink(data)}  شكرا</div>
        </div>
    `;

    container.append(html);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);

    // Play sound
    playGiftSound();

    // Show thank you message in the middle of the screen
    showThankYouMessage(data);

    // Call the function to play the gift sound
    handleGiftReceived();

    // Check if a thank-you message is not currently being displayed, show the next one
    if (!isShowingThankYou) {
        displayNextThankYouMessage();
    }
}

// ... (remaining code)

// ... (remaining code)

// Queue to manage thank-you messages
let thankYouQueue = [];
let isShowingThankYou = false; // Flag to track whether a thank-you message is currently being displayed

// Function to show thank you message in the middle of the screen
// Function to show thank you message in the middle of the screen
// Function to show thank you message in the middle of the screen
// Function to show thank you message in the middle-left of the screen
function showThankYouMessage(data) {
    // Check if the message is related to a gift
    if (data && data.giftId) {
        // Check if a thank-you message is already in the queue for this gift
        if (!thankYouQueue.some(item => item.giftId === data.giftId)) {
            // Add the thank-you message to the queue
            thankYouQueue.push(data);

            // If a thank-you message is not currently being displayed, show the next one
            if (!isShowingThankYou) {
                displayNextThankYouMessage();
            }
        }
    }
}

// Function to display the next thank-you message in the queue
function displayNextThankYouMessage() {
    // If the queue is not empty, show the next thank-you message
    if (thankYouQueue.length > 0) {
        isShowingThankYou = true;

        let data = thankYouQueue.shift(); // Get the next message from the queue

        let thankYouMessage = $(`
            <div class="thankyou-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #2fb816; font-size: 4em; z-index: 9999; text-align: center;">
                <img class="miniprofilepicture" src="${data.profilePictureUrl}" alt="Profile Picture">
                <div>تمد من زود <br>${generateUsernameLink(data)} شكرا!</div>
            </div>
        `);

        // Append the thank-you message to the body
        $('body').append(thankYouMessage);

        // Hide the message after 10 seconds
        setTimeout(() => {
            thankYouMessage.fadeOut(500, () => {
                thankYouMessage.remove(); // Remove the message from the DOM after fading out
                isShowingThankYou = false; // Set the flag to false after hiding the message
                // Restore the background color of the entire page to its original state
                $('body').css('background-color', ''); 
                // Show chat and gift containers
                $('.chatcontainer, .giftcontainer').show();
                displayNextThankYouMessage(); // Show the next thank-you message in the queue
            });
        }, 5000);
    }
}


// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`));

        // Thank users who liked the stream
        if (msg.likeCount > 0) {
            // Customize your thank-you message here
            const thankYouMessage = `❤️❤️❤️❤️شكرًا❤️❤️❤️❤️`;
            
            // Use a function similar to addGiftItem for like thanks
            addLikeThanksItem({ profilePictureUrl: 'URL_TO_YOUR_PROFILE_PICTURE', describe: thankYouMessage });
        }
    }
});

// Function to add thank you message for likes
function addLikeThanksItem(data) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    let html = `
        <div class="thankyou-message">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>${data.describe}</span>
        </div>
    `;

    container.append(html);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}


// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#21b2c2', msg, 'joined', true);
    }, joinMsgDelay);
})

// New chat comment received
connection.on('chat', (msg) => {
    const command = msg.comment.trim().toLowerCase();

    switch (command) {
        case 'اكرم':
            // Change the background color
            changeBackgroundColor();
            break;
        // Add more commands as needed
        default:
            // Handle regular chat messages
            addChatItem('', msg, msg.comment);
            break;
    }
})

// New gift received
connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateRoomStats();
    }

    if (window.settings.showGifts === "0") return;

    addGiftItem(data);
})

// share, follow
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

connection.on('streamEnd', () => {
    $('#stateText').text('Stream ended.');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})

// Function to change the background color
function changeBackgroundColor() {
    // Set the background color to black for both .chatcontainer and .giftcontainer
    $('.chatcontainer, .giftcontainer').css('background-color', '#000000');
}

// ... (previous code)

// Quiz Game Variables
let quizGameActive = false;
let currentQuestionIndex = 0;
let quizQuestions = [
    {
        question: "ما هي عاصمة مصر؟",
        options: ["A) القاهرة", "B) الرياض", "C) بغداد"],
        correctAnswer: "A"
    },
    {
        question: "ما هو اللغة الرسمية في المملكة العربية السعودية؟",
        options: ["A) الإنجليزية", "B) العربية", "C) الفرنسية"],
        correctAnswer: "B"
    },
    {
        question: "ما هي عاصمة فرنسا؟",
        options: ["A) باريس", "B) لندن", "C) روما"],
        correctAnswer: "A"
    },
    {
        question: "ما هي عاصمة إيطاليا؟",
        options: ["A) برلين", "B) مدريد", "C) روما"],
        correctAnswer: "C"
    },
    {
        question: "ما هي عاصمة اليابان؟",
        options: ["A) طوكيو", "B) بكين", "C) سول"],
        correctAnswer: "A"
    },
    {
        question: "ما هو اللون الأخضر في الطيف اللوني؟",
        options: ["A) الأحمر", "B) الأخضر", "C) الأزرق"],
        correctAnswer: "B"
    },
    {
        question: "ما هي عاصمة ألمانيا؟",
        options: ["A) باريس", "B) لندن", "C) برلين"],
        correctAnswer: "C"
    },
    {
        question: "ما هو العدد الذري للكربون؟",
        options: ["A) 6", "B) 8", "C) 12"],
        correctAnswer: "A"
    },
    {
        question: "ما هو الجبل الأعلى في العالم؟",
        options: ["A) جبل إيفرست", "B) جبل كيليمنجارو", "C) جبل فينسون"],
        correctAnswer: "A"
    },
    {
        question: "ما هي عاصمة روسيا؟",
        options: ["A) موسكو", "B) سانت بطرسبرج", "C) كييف"],
        correctAnswer: "A"
    },
    {
        question: "ما هو العملة الرسمية في اليابان؟",
        options: ["A) الدولار الأمريكي", "B) اليورو", "C) الين الياباني"],
        correctAnswer: "C"
    },
    {
        question: "ما هو الكوكب الرابع في النظام الشمسي؟",
        options: ["A) المريخ", "B) المشتري", "C) الزهرة"],
        correctAnswer: "A"
    },
    {
        question: "ما هو الطعام الذي يعتبر مأكولًا رئيسيًا في اليابان؟",
        options: ["A) السوشي", "B) البيتزا", "C) البرجر"],
        correctAnswer: "A"
    },
    {
        question: "ما هو اللون الأزرق في الطيف اللوني؟",
        options: ["A) الأحمر", "B) الأخضر", "C) الأزرق"],
        correctAnswer: "C"
    },
    {
        question: "ما هو العدد الذري للأكسجين؟",
        options: ["A) 6", "B) 8", "C) 16"],
        correctAnswer: "B"
    },
    {
        question: "ما هي عاصمة إسبانيا؟",
        options: ["A) مدريد", "B) باريس", "C) لشبونة"],
        correctAnswer: "A"
    },
    {
        question: "ما هو الحيوان الوطني لأستراليا؟",
        options: ["A) الكنغر", "B) الكوالا", "C) الإمو"],
        correctAnswer: "B"
    },
    {
        question: "ما هو العملة الرسمية في ألمانيا؟",
        options: ["A) اليورو", "B) الدولار الأمريكي", "C) الروبل الروسي"],
        correctAnswer: "A"
    },
    {
        question: "ما هو أكبر كوكب في النظام الشمسي؟",
        options: ["A) المريخ", "B) المشتري", "C) الزهرة"],
        correctAnswer: "B"
    },
    {
        question: "ما هي عاصمة البرازيل؟",
        options: ["A) ريو دي جانيرو", "B) ساو باولو", "C) برازيليا"],
        correctAnswer: "C"
    },
    {
        question: "ما هو الحيوان الوطني لكندا؟",
        options: ["A) الرنة", "B) الدب الكندي", "C) النسر الذهبي"],
        correctAnswer: "A"
    },
    {
        question: "ما هو أكبر محيط في العالم؟",
        options: ["A) المحيط الأطلسي", "B) المحيط الهندي", "C) المحيط الهادئ"],
        correctAnswer: "C"
    },
    {
        question: "ما هي عاصمة تركيا؟",
        options: ["A) إسطنبول", "B) أنقرة", "C) بورصة"],
        correctAnswer: "B"
    },
    {
        question: "ما هو الحيوان الوطني للولايات المتحدة الأمريكية؟",
        options: ["A) النمر", "B) البالد أمريكان إيغل", "C) البوفالو"],
        correctAnswer: "B"
    },

];

// Listen for chat messages related to the Quiz game
connection.on('chat', (msg) => {
    const command = msg.comment.trim().toLowerCase();

    if (quizGameActive) {
        // Process user input during the Quiz game
        switch (command) {
            case 'a':
            case 'b':
            case 'c':
                // Process user's answer
                processUserAnswer(msg, command);
                break;
        }
    } else {
        // Check for a command to start the Quiz game
        if (command === '!startquiz') {
            startQuizGame();
        }
    }
});

// Function to start the Quiz game
function startQuizGame() {
    quizGameActive = true;
    currentQuestionIndex = 0;
    sendQuizQuestion();
}

// Function to send the current quiz question to the chat
// Function to send the current quiz question to the chat
// Function to send the current quiz question to the chat
function sendQuizQuestion() {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const questionMessage = `السؤال ${currentQuestionIndex + 1}: ${currentQuestion.question}<br>${currentQuestion.options.join('<br>')}</div>`;
    addChatItem('', { uniqueId: 'QuizBot' }, questionMessage);
}



// Function to process user's answerz
function processUserAnswer(user, answer) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer.toLowerCase();

    const color = isCorrect ? 'green' : 'red';
    const message = isCorrect
        ? `${generateUsernameLink(user)} جواب صحيح `
        : `${generateUsernameLink(user)} جواب خطأ. ${currentQuestion.correctAnswer}  الجواب الصحيح هو  .`;

    addChatItem(color, { uniqueId: 'QuizBot' }, message);

    // Move to the next question or end the game
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        sendQuizQuestion();
    } else {
        endQuizGame();
    }
}


// Function to end the Quiz game
function endQuizGame() {
    quizGameActive = false;
    addChatItem('', { uniqueId: 'QuizBot' }, 'انتهت اللعبة شكرا على الإشتراك');
}

// ... (remaining code)

// ... (remaining code)
