export function buildGameHTML(lang) {
  return `
<!-- HOME SCREEN -->
<div id="home" class="screen active">
  <a href="/" class="home-link">🏠 ← עוֹד מִשְׂחָקִים בְּ״לְמַד וּשְׂחַק״</a>
  <h1>${lang.homeTitle}</h1>
  <h2>${lang.homeSubtitle}</h2>
  <div class="home-stats">
    <div class="stat-badge points" id="totalScore">⭐ 0</div>
    <div class="stat-badge progress" id="progressBadge">📖 0/1000</div>
  </div>
  <div class="page-nav">
    <button class="page-arrow" id="prevPage" onclick="changePage(-1)">◀</button>
    <div class="page-dots" id="pageDots"></div>
    <button class="page-arrow" id="nextPage" onclick="changePage(1)">▶</button>
  </div>
  <button class="abc-btn" id="abcBtn" onclick="showAbcMenu()"><span style="font-size:2.1rem">🔤</span> לִמּוּד אוֹתִיּוֹת</button>
  <div class="stage-grid" id="stageGrid"></div>
  <div class="page-nav" id="pageNavBottom">
    <button class="page-arrow" id="prevPageBottom" onclick="changePage(-1)">◀</button>
    <div class="page-dots" id="pageDotsBottom"></div>
    <button class="page-arrow" id="nextPageBottom" onclick="changePage(1)">▶</button>
  </div>
  <button class="mix-btn" id="mixBtn" onclick="startPageMixQuiz()" style="display:none">🔀 מבחן מעורבב</button>
  <button class="sentence-btn" id="sentenceBtn" onclick="startSentenceQuiz()">📝 מִבְחָן מִשְׁפָּטִים</button>
  <div class="ad-container" id="adBannerHome"></div>
  <a href="https://forms.gle/xvJm6NVwngBcELEg9" target="_blank" style="display:block;width:100%;text-align:center;padding:12px;margin-top:12px;border-radius:14px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-size:.95rem;font-weight:700;text-decoration:none;box-shadow:0 4px 16px rgba(139,92,246,.3);-webkit-tap-highlight-color:transparent">💬 שלחו לנו משוב</a>
  <button class="reset-btn" onclick="resetProgress()">🗑️ איפוס התקדמות</button>
</div>

<!-- ABC MENU SCREEN -->
<div id="abcChoice" class="screen">
  <button class="back-btn" onclick="goHome()">⬅ חֲזָרָה</button>
  <h1>${lang.alphabetTitle}</h1>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="showAbcLearn()">📖 לִלְמוֹד אוֹתִיּוֹת</button>
  </div>
  <div class="btn-row">
    <button class="btn btn-success" onclick="startAbcQuiz(false)">📝 מִבְחָן: אוֹת ← שֵׁם <span id="abcScoreFwd" style="opacity:.8"></span></button>
  </div>
  <div class="btn-row">
    <button class="btn btn-purple" onclick="startAbcQuiz(true)">🔄 מִבְחָן: שֵׁם ← אוֹת <span id="abcScoreRev" style="opacity:.8"></span></button>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" style="background:#f97316" onclick="showAbcDictionary()">📖 מִלּוֹן אוֹתִיּוֹת</button>
  </div>
  <div class="btn-row">
    <div class="btn" style="background:#e2e8f0;color:var(--text);cursor:default;width:100%;text-align:center">⭐ ניקוד: <span id="abcTotalScore" style="font-weight:900;color:var(--primary)">0</span></div>
  </div>
</div>

<!-- ALPHABET LEARN SCREEN -->
<div id="alphabet" class="screen">
  <button class="back-btn" onclick="showAbcMenu()">⬅ חֲזָרָה לַתַּפְרִיט</button>
  <h1>${lang.alphabetTitle}</h1>
  <h2>לחץ על אות כדי לשמוע את השם שלה</h2>
  <div class="letter-grid" id="letterGrid"></div>
</div>

<!-- ABC DICTIONARY SCREEN -->
<div id="abcDictionary" class="screen">
  <button class="back-btn" onclick="showAbcMenu()">⬅ חֲזָרָה לַתַּפְרִיט</button>
  <h1>📖 מִלּוֹן אוֹתִיּוֹת</h1>
  <div class="dict-list" id="abcDictList"></div>
</div>

<!-- ABC QUIZ SCREEN -->
<div id="abcQuiz" class="screen">
  <button class="back-btn" onclick="showAbcMenu()">⬅ חֲזָרָה לַתַּפְרִיט</button>
  <div class="counter" id="abcQuizCounter">1 / 10</div>
  <div class="progress-bar"><div class="fill" id="abcQuizProgress"></div></div>
  <div class="score-display" id="abcQuizScore">✅ 0 / 0</div>
  <div class="quiz-word" id="abcQuizLetter" style="font-size:4rem"></div>
  <button class="speak-btn" id="abcQuizSpeak" onclick="sayWord(abcQuizCurrentSound)">🔊</button>
  <div class="quiz-options" id="abcQuizOptions" style="grid-template-columns:1fr 1fr"></div>
  <div class="correction" id="abcCorrection" style="display:none"></div>
</div>

<!-- ABC RESULTS SCREEN -->
<div id="abcResults" class="screen">
  <h1>📊 תוצאות מבחן אותיות</h1>
  <div class="stars" id="abcResultStars"></div>
  <div class="result-score" id="abcResultScore"></div>
  <div class="result-msg" id="abcResultMsg"></div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="showAbcMenu()">🔤 תַּפְרִיט אוֹתִיּוֹת</button>
  </div>
  <div style="margin-top:12px">
    <button class="btn btn-primary" style="background:#64748b" onclick="goHome()">🏠 חזרה</button>
  </div>
</div>

<!-- LEARN SCREEN -->
<div id="learn" class="screen">
  <button class="back-btn" onclick="startLearn(currentStage)">⬅ חֲזָרָה לַתַּפְרִיט</button>
  <div class="counter" id="learnCounter">1 / 10</div>
  <div class="progress-bar"><div class="fill" id="learnProgress"></div></div>
  <div class="word-card" id="wordCard" ontouchend="revealTranslation()" onclick="revealTranslation()">
    <div class="word-foreign" id="wordForeign"></div>
    <div class="word-icon" id="wordIcon"></div>
    <div class="word-native" id="wordNative"></div>
    <div class="tap-hint" id="tapHint">👆 לחץ לתרגום</div>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" id="prevWordBtn" onclick="prevWord()" style="background:#94a3b8">⬅️ הקודם</button>
    <button class="btn btn-primary" id="nextWordBtn" onclick="nextWord()">הבא ➡️</button>
    <button class="speak-btn" onclick="sayWord()">🔊</button>
  </div>
</div>

<!-- DICTIONARY SCREEN -->
<div id="dictionary" class="screen">
  <button class="back-btn" onclick="startLearn(currentStage)">⬅ חֲזָרָה לַתַּפְרִיט</button>
  <h1 id="dictTitle">📖 מִלּוֹן</h1>
  <div class="dict-list" id="dictList"></div>
</div>

<!-- STAGE MENU SCREEN -->
<div id="choice" class="screen">
  <button class="back-btn" onclick="goHome()">⬅ חֲזָרָה</button>
  <h1 id="stageMenuTitle"></h1>
  <h2 id="stageMenuCat"></h2>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="startLearnGo()">📖 לִלְמוֹד מִלִּים</button>
  </div>
  <div class="btn-row">
    <button class="btn btn-success" onclick="startQuiz(false)">${lang.quizForwardLabel} <span id="scoreFwd" style="opacity:.8"></span></button>
  </div>
  <div class="btn-row">
    <button class="btn btn-purple" onclick="startQuiz(true)">${lang.quizReverseLabel} <span id="scoreRev" style="opacity:.8"></span></button>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" style="background:#f97316" onclick="showDictionary()">📖 מִלּוֹן</button>
  </div>
  <div class="btn-row">
    <div class="btn" style="background:#e2e8f0;color:var(--text);cursor:default;width:100%;text-align:center">⭐ ניקוד שלב: <span id="stageTotalScore" style="font-weight:900;color:var(--primary)">0/20</span></div>
  </div>
</div>

<!-- SENTENCE QUIZ SCREEN -->
<div id="sentenceQuiz" class="screen">
  <button class="back-btn" onclick="goHome()">⬅ חֲזָרָה</button>
  <h2 style="margin-bottom:4px">📝 מִבְחָן מִשְׁפָּטִים</h2>
  <div class="counter" id="sentenceCounter">1 / 10</div>
  <div class="progress-bar"><div class="fill" id="sentenceProgress"></div></div>
  <div class="score-display" id="sentenceScore">✅ 0 / 0</div>
  <div class="sentence-foreign" id="sentenceForeign"></div>
  <button class="speak-btn" onclick="sayWord(document.getElementById('sentenceForeign').textContent)">🔊</button>
  <div class="sentence-options" id="sentenceOptions"></div>
  <div class="correction" id="sentenceCorrection" style="display:none"></div>
</div>

<!-- SENTENCE RESULTS SCREEN -->
<div id="sentenceResults" class="screen">
  <h1>📊 תּוֹצָאוֹת מִשְׁפָּטִים</h1>
  <div class="stars" id="sentenceResultStars"></div>
  <div class="result-score" id="sentenceResultScore"></div>
  <div class="result-msg" id="sentenceResultMsg"></div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="goHome()">🏠 חֲזָרָה</button>
  </div>
</div>

<!-- QUIZ SCREEN -->
<div id="quiz" class="screen">
  <button class="back-btn" onclick="startLearn(currentStage)">⬅ חֲזָרָה לַתַּפְרִיט</button>
  <div class="counter" id="quizCounter">1 / 10</div>
  <div class="progress-bar"><div class="fill" id="quizProgress"></div></div>
  <div class="score-display" id="quizScore">✅ 0 / 0</div>
  <div id="quizEmoji" class="quiz-emoji" style="display:none"></div>
  <div class="quiz-word" id="quizWord"></div>
  <button class="speak-btn" id="quizSpeak" onclick="isReverse?sayNative(document.getElementById('quizWord').textContent):sayWord(document.getElementById('quizWord').textContent)">🔊</button>
  <div class="quiz-options" id="quizOptions"></div>
  <div class="correction" id="correction" style="display:none"></div>
</div>

<!-- RESULTS SCREEN -->
<div id="results" class="screen">
  <h1>📊 תוצאות</h1>
  <div class="stars" id="resultStars"></div>
  <div class="result-score" id="resultScore"></div>
  <div class="result-msg" id="resultMsg"></div>
  <div id="nextPageEncourage" style="display:none;margin:16px 0;padding:16px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:14px;text-align:center;width:100%">
    <div style="font-size:1rem;font-weight:700;color:#16a34a;margin-bottom:8px">🌟 מעולה! אתה מוכן להמשיך!</div>
    <button class="btn btn-success" onclick="goToNextPage()" style="width:100%">➡️ לעמוד הבא - עוד מילים חדשות!</button>
  </div>
  <div class="ad-container" id="adBannerResults"></div>
  <div class="btn-row">
    <button class="btn btn-primary" id="resultStageBtn" onclick="startLearn(currentStage)">🏠 תַּפְרִיט שָׁלָב</button>
  </div>
  <div style="margin-top:12px">
    <button class="btn btn-primary" style="background:#64748b" onclick="goHome()">🏠 חזרה</button>
  </div>
  <a href="https://forms.gle/xvJm6NVwngBcELEg9" target="_blank" style="display:inline-block;margin-top:16px;font-size:.85rem;color:var(--muted);text-decoration:underline;-webkit-tap-highlight-color:transparent">💬 מה דעתכם על המשחק?</a>
</div>

<!-- PAYWALL SCREEN -->
<div id="paywall" class="screen">
  <button class="back-btn" onclick="goHome()">⬅ חזרה</button>
  <div style="text-align:center;padding:20px 0">
    <div style="font-size:4rem">🔒</div>
    <h1 style="margin:16px 0 8px">עוד 500 מילים בדרך!</h1>
    <h2 style="color:var(--muted)">שלבים 51-100 כוללים 500 מילים נוספות</h2>
    <div style="margin:20px 0;padding:16px;background:linear-gradient(135deg,#dbeafe,#ede9fe);border-radius:14px">
      <div style="font-size:1.1rem;font-weight:700;color:var(--primary);margin-bottom:6px">🚀 בקרוב!</div>
      <p style="font-size:.9rem;color:var(--text);line-height:1.6;margin:0">התוכן הנוסף יהיה זמין בקרוב במחיר מיוחד.<br>נעדכן אתכם כשיהיה מוכן!</p>
    </div>
    <div class="paywall-features">
      <div class="feat-title">מה יהיה כלול?</div>
      <div class="feat-list">
        ✅ כל 1000 המילים (100 שלבים)<br>
        ✅ מבחנים מעורבבים<br>
        ✅ ללא פרסומות<br>
        ✅ גישה לכל החיים
      </div>
    </div>
    <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:20px">
      <p style="font-size:.9rem;color:var(--muted);margin-bottom:10px">יש לך קוד קופון?</p>
      <div style="display:flex;gap:8px">
        <input id="promoInput" type="text" placeholder="הזן קוד קופון" style="flex:1;border:2px solid #e2e8f0;border-radius:var(--radius);padding:12px;font-size:.95rem;text-align:center;direction:ltr;outline:none" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#e2e8f0'">
        <button class="btn btn-primary" onclick="redeemPromo()" style="min-width:auto;padding:12px 18px">🎁</button>
      </div>
      <div id="promoMsg" style="font-size:.85rem;margin-top:8px;text-align:center;display:none"></div>
    </div>
  </div>
</div>

<div class="modal-overlay" id="lockMsgOverlay" onclick="closeLockMsg()">
  <div class="login-card" onclick="event.stopPropagation()">
    <div class="login-card-icon">🔒</div>
    <h3>השלב נעול</h3>
    <p id="lockMsgText"></p>
    <button class="google-btn" onclick="closeLockMsg()" style="background:var(--primary)">הבנתי!</button>
  </div>
</div>

<div class="login-overlay" id="loginOverlay">
  <div class="login-card">
    <div class="login-card-icon">🔐</div>
    <h3>שמור את ההתקדמות שלך!</h3>
    <p>התחבר עם Google כדי לשמור את הציונים שלך ולהמשיך מכל מכשיר</p>
    <button class="google-btn" onclick="doOverlayLogin()">התחבר עם Google</button>
    <button class="dismiss-link" onclick="dismissLoginOverlay()">אולי מאוחר יותר</button>
  </div>
</div>

<button class="share-fab" onclick="shareApp()">🔗 שתף</button>
`;
}
