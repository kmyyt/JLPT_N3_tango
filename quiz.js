// =========================================================================
// 5단계: quiz.js — 4지선다 퀴즈, 주관식 테스트(직접 입력·히라가나 타일·예외규칙), 오답노트
// - index.html, style.css, data.js, study.js와 연동
// =========================================================================

let mcqSession = null;

let subjSession = null;
let subjAnswerBuffer = "";
let subjGraded = false;
let subjCorrect = false;

// -------------------------------------------------------------------------
// 1. 공통 출제 설정 및 범위/커스텀 단어장/암기 상태 필터링
// -------------------------------------------------------------------------
function getFilteredQuestionPool(scope, deckId = "", yearCategory = "ALL") {
  const state = StudyStore.getState();

  let pool = VOCAB_DATA.filter((item) => {
    if (yearCategory && yearCategory !== "ALL" && !item.years.includes(yearCategory)) {
      return false;
    }
    if (scope === "DECK") {
      const targetDeck = state.decks.find((d) => d.id === deckId);
      if (!targetDeck) return false;
      return targetDeck.wordIds.includes(item.id);
    }
    if (scope === "FAV") {
      return StudyStore.isFavorite(item.id);
    }
    if (scope === "unsure_unknown") {
      return ["unsure", "unknown"].includes(StudyStore.getStatus(item.id));
    }
    if (scope === "known" || scope === "unsure" || scope === "unknown") {
      return StudyStore.getStatus(item.id) === scope;
    }
    return true;
  });

  if (!pool.length) {
    pool = [...VOCAB_DATA];
  }
  return pool;
}

function buildMcqDistractors(targetItem, fieldName, correctValue) {
  const candidates = shuffleArray(VOCAB_DATA.filter((v) => v.id !== targetItem.id));
  const picked = [];

  for (const cand of candidates) {
    const val = cand[fieldName];
    if (val && val !== correctValue && !picked.includes(val)) {
      picked.push(val);
    }
    if (picked.length === 3) break;
  }

  const fallbackChoices =
    fieldName === "reading"
      ? ["よみかた ほじょ 1", "よみかた ほじょ 2", "よみかた ほじょ 3"]
      : ["관련 뜻 보기 1", "관련 뜻 보기 2", "관련 뜻 보기 3"];

  for (const fb of fallbackChoices) {
    if (picked.length === 3) break;
    if (fb !== correctValue && !picked.includes(fb)) {
      picked.push(fb);
    }
  }

  return picked.slice(0, 3);
}

// -------------------------------------------------------------------------
// 2. 4지선다 퀴즈 탭
// -------------------------------------------------------------------------
function startMcqQuiz(overrideItems = null) {
  let pool;
  let countVal;
  let shouldShuffle = true;

  if (Array.isArray(overrideItems) && overrideItems.length > 0) {
    pool = [...overrideItems];
    countVal = "ALL";
    shouldShuffle = true;
  } else {
    const scope = document.getElementById("quizScopeSelect")?.value || "ALL";
    const deckId = document.getElementById("quizDeckSelect")?.value || "";
    const yearCat = document.getElementById("quizYearCategorySelect")?.value || "ALL";
    countVal = document.getElementById("quizCountSelect")?.value || "10";
    shouldShuffle = document.getElementById("quizShuffleChk")?.checked ?? true;

    if (scope === "DECK" && !deckId) {
      alert("커스텀 단어장을 먼저 선택해 주세요.");
      return;
    }

    pool = getFilteredQuestionPool(scope, deckId, yearCat);
  }

  if (shouldShuffle) {
    pool = shuffleArray(pool);
  }

  const limit = countVal === "ALL" ? pool.length : Math.min(Number(countVal) || 10, pool.length);
  const chosenItems = pool.slice(0, limit);

  const questions = chosenItems.map((target) => {
    const hasSynonym = Boolean(target.synonym);
    const roll = Math.random();
    let mode = "meaning";
    if (hasSynonym && roll < 0.32) {
      mode = "synonym";
    } else if (roll < 0.66) {
      mode = "reading";
    }

    let promptHtml = "";
    let correctAnswer = target.meaning;
    let distractors = [];

    if (mode === "synonym") {
      correctAnswer = target.synonym;
      promptHtml = `다음 단어(<strong lang="ja">${escapeHtml(target.word)}</strong> · ${escapeHtml(target.meaning)})와 의미가 가장 가까운 유의표현을 고르세요.`;
      distractors = buildMcqDistractors(target, "synonym", correctAnswer);
      if (distractors.length < 3) {
        const extra = buildMcqDistractors(target, "meaning", correctAnswer);
        for (const item of extra) {
          if (!distractors.includes(item)) distractors.push(item);
          if (distractors.length === 3) break;
        }
      }
    } else if (mode === "reading") {
      correctAnswer = target.reading;
      promptHtml = `다음 단어의 올바른 히라가나 읽기를 고르세요: <strong lang="ja" style="font-size:1.35rem;">${escapeHtml(target.word)}</strong>`;
      distractors = buildMcqDistractors(target, "reading", correctAnswer);
    } else {
      correctAnswer = target.meaning;
      promptHtml = `다음 단어(<strong lang="ja">${escapeHtml(target.word)}</strong> · <span lang="ja">${escapeHtml(target.reading)}</span>)의 올바른 한국어 뜻을 고르세요.`;
      distractors = buildMcqDistractors(target, "meaning", correctAnswer);
    }

    const options = shouldShuffle
      ? shuffleArray([correctAnswer, ...distractors])
      : [correctAnswer, ...distractors];

    return {
      item: target,
      mode,
      promptHtml,
      options,
      correctAnswer,
      answered: null
    };
  });

  mcqSession = {
    questions,
    index: 0,
    score: 0
  };

  const setupCard = document.getElementById("quizSetupCard");
  const playCard = document.getElementById("quizPlayCard");
  if (setupCard) setupCard.hidden = true;
  if (playCard) playCard.hidden = false;

  renderMcqQuestion();
}

function speakCurrentQuizWord() {
  if (!mcqSession || !mcqSession.questions[mcqSession.index]) return;
  speakJapanese(mcqSession.questions[mcqSession.index].item.word);
}

function renderMcqQuestion() {
  const playCard = document.getElementById("quizPlayCard");
  if (!playCard || !mcqSession) return;

  const q = mcqSession.questions[mcqSession.index];
  const total = mcqSession.questions.length;
  const isLast = mcqSession.index === total - 1;
  const isAnswered = q.answered !== null;
  const isRight = isAnswered && q.answered === q.correctAnswer;

  playCard.innerHTML = `
    <div class="quiz-top-meta">
      <span class="progress-badge">문항 ${mcqSession.index + 1} / ${total}</span>
      <span class="score-label">점수: ${mcqSession.score}</span>
      <button type="button" id="mcqSpeakBtn" class="mini-btn" data-tts-role="quiz-word">🔊 발음 듣기</button>
    </div>

    <div class="subj-prompt-box">
      <p style="font-size:1.05rem;">${q.promptHtml}</p>
      ${q.item.example ? `
        <p class="example-ja" lang="ja" style="margin-top:10px;">${escapeHtml(q.item.example)}</p>
        <p class="example-meaning">${escapeHtml(q.item.exampleMeaning || "")}</p>
      ` : ""}
    </div>

    <div class="quiz-options-list">
      ${q.options.map((opt, idx) => {
        let stateClass = "";
        if (isAnswered) {
          if (opt === q.correctAnswer) stateClass = "is-correct";
          else if (opt === q.answered) stateClass = "is-wrong";
        }
        const isJaChoice = q.mode === "reading" || q.mode === "synonym";
        return `
          <button
            type="button"
            class="quiz-option-btn ${stateClass}"
            data-option-index="${idx}"
            ${isJaChoice ? 'lang="ja"' : ""}
            ${isAnswered ? "disabled" : ""}
          >
            ${idx + 1}. ${escapeHtml(opt)}
          </button>
        `;
      }).join("")}
    </div>

    ${isAnswered ? `
      <div class="feedback-box ${isRight ? "is-correct" : "is-wrong"}">
        <strong>${isRight ? "✅ 정답입니다!" : `❌ 오답입니다. 정답: ${escapeHtml(q.correctAnswer)}`}</strong>
        <p style="margin-top:6px;">
          <span lang="ja"><strong>${escapeHtml(q.item.word)}</strong> (${escapeHtml(q.item.reading)})</span>
          — ${escapeHtml(q.item.meaning)} · <span class="badge pos-badge">${escapeHtml(StudyStore.getPosNote(q.item))}</span>
        </p>
      </div>
    ` : ""}

    <div class="quiz-footer-actions">
      ${isAnswered ? `
        <button type="button" id="mcqNextBtn" class="action-btn primary">
          ${isLast ? "퀴즈 결과 보기" : "다음 문제 →"}
        </button>
      ` : ""}
      <button type="button" id="mcqQuitBtn" class="action-btn">설정으로 돌아가기</button>
    </div>
  `;

  document.getElementById("mcqSpeakBtn")?.addEventListener("click", speakCurrentQuizWord);

  playCard.querySelectorAll(".quiz-option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (q.answered !== null) return;
      const chosen = q.options[Number(btn.dataset.optionIndex)];
      q.answered = chosen;
      if (chosen === q.correctAnswer) {
        mcqSession.score += 1;
      } else {
        StudyStore.recordWrongAnswer(q.item.id, "4지선다 퀴즈", chosen);
        refreshAllStudyUI();
      }
      renderMcqQuestion();
    });
  });

  document.getElementById("mcqNextBtn")?.addEventListener("click", () => {
    if (!isLast) {
      mcqSession.index += 1;
      renderMcqQuestion();
    } else {
      renderMcqResult();
    }
  });

  document.getElementById("mcqQuitBtn")?.addEventListener("click", resetMcqToSetup);
}

function renderMcqResult() {
  const playCard = document.getElementById("quizPlayCard");
  if (!playCard || !mcqSession) return;

  const total = mcqSession.questions.length;
  const pct = total ? Math.round((mcqSession.score / total) * 100) : 0;
  const wrongItems = mcqSession.questions
    .filter((q) => q.answered !== q.correctAnswer)
    .map((q) => q.item);

  playCard.innerHTML = `
    <h2 class="section-title">4지선다 퀴즈 결과</h2>
    <p style="font-size:1.15rem; margin:12px 0 16px;">
      최종 점수: <strong>${mcqSession.score} / ${total}</strong> (${pct}%)
    </p>
    <div class="button-group">
      <button type="button" id="mcqRetryAllBtn" class="action-btn primary">다시 풀기</button>
      ${wrongItems.length > 0 ? `
        <button type="button" id="mcqRetryWrongBtn" class="action-btn danger">
          틀린 단어만 다시 풀기 (${wrongItems.length}개)
        </button>
      ` : ""}
      <button type="button" id="mcqBackSetupBtn" class="action-btn">설정 화면으로</button>
    </div>
  `;

  document.getElementById("mcqRetryAllBtn")?.addEventListener("click", () => startMcqQuiz());
  document.getElementById("mcqBackSetupBtn")?.addEventListener("click", resetMcqToSetup);
  document.getElementById("mcqRetryWrongBtn")?.addEventListener("click", () => startMcqQuiz(wrongItems));
}

function resetMcqToSetup() {
  mcqSession = null;
  const playCard = document.getElementById("quizPlayCard");
  const setupCard = document.getElementById("quizSetupCard");
  if (playCard) {
    playCard.hidden = true;
    playCard.innerHTML = "";
  }
  if (setupCard) setupCard.hidden = false;
  refreshAllStudyUI();
}

// -------------------------------------------------------------------------
// 3. 주관식 테스트 탭 (직접 입력 + 히라가나 타일 + 히라가나 전용 단어 예외 규칙)
// -------------------------------------------------------------------------
function createKanaTileSet(reading) {
  const targetChars = Array.from(String(reading || "").trim());
  const decoys = [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
    "ら", "り", "る", "れ", "ろ",
    "わ", "を", "ん", "っ", "ー"
  ];

  const tiles = [...targetChars];
  const desiredTotal = Math.max(targetChars.length + 3, Math.min(12, targetChars.length + 6));
  while (tiles.length < desiredTotal) {
    const pick = decoys[Math.floor(Math.random() * decoys.length)];
    tiles.push(pick);
  }

  return shuffleArray(tiles).map((ch, idx) => ({
    id: `kana_tile_${idx}_${ch}`,
    ch,
    used: false
  }));
}

function startSubjectiveTest(overrideItems = null) {
  let pool;
  let countVal;
  let shouldShuffle = true;

  if (Array.isArray(overrideItems) && overrideItems.length > 0) {
    pool = [...overrideItems];
    countVal = "ALL";
    shouldShuffle = true;
  } else {
    const scope = document.getElementById("subjScopeSelect")?.value || "ALL";
    const deckId = document.getElementById("subjDeckSelect")?.value || "";
    countVal = document.getElementById("subjCountSelect")?.value || "10";
    shouldShuffle = document.getElementById("subjShuffleChk")?.checked ?? true;

    if (scope === "DECK" && !deckId) {
      alert("커스텀 단어장을 먼저 선택해 주세요.");
      return;
    }

    pool = getFilteredQuestionPool(scope, deckId, "ALL");
  }

  if (shouldShuffle) {
    pool = shuffleArray(pool);
  }

  const limit = countVal === "ALL" ? pool.length : Math.min(Number(countVal) || 10, pool.length);
  const selected = pool.slice(0, limit);

  subjSession = {
    questions: selected.map((item) => ({
      item,
      kanaOnlyException: isKanaOnlyWord(item.word),
      tiles: createKanaTileSet(item.reading)
    })),
    index: 0,
    score: 0
  };

  const setupCard = document.getElementById("subjSetupCard");
  const playCard = document.getElementById("subjPlayCard");
  if (setupCard) setupCard.hidden = true;
  if (playCard) playCard.hidden = false;

  prepareSubjectiveQuestion();
}

function prepareSubjectiveQuestion() {
  subjAnswerBuffer = "";
  subjGraded = false;
  subjCorrect = false;
  if (!subjSession) return;
  const q = subjSession.questions[subjSession.index];
  q.tiles.forEach((t) => {
    t.used = false;
  });
  renderSubjectiveQuestion();
}

function speakCurrentSubjWord() {
  if (!subjSession || !subjSession.questions[subjSession.index]) return;
  speakJapanese(subjSession.questions[subjSession.index].item.word);
}

function renderSubjectiveQuestion() {
  if (!subjSession) return;
  const q = subjSession.questions[subjSession.index];
  const item = q.item;
  const total = subjSession.questions.length;
  const isLast = subjSession.index === total - 1;

  const inputMode = document.getElementById("subjInputModeSelect")?.value || "both";
  const hideMeaning = document.getElementById("subjHideMeaningChk")?.checked ?? false;
  const firstHint = document.getElementById("subjFirstCharHintChk")?.checked ?? false;

  const progressEl = document.getElementById("subjProgressText");
  const ruleBadgeEl = document.getElementById("subjRuleBadge");
  const scoreEl = document.getElementById("subjScoreText");
  const kindEl = document.getElementById("subjPromptKind");
  const wordEl = document.getElementById("subjPromptWord");
  const meaningEl = document.getElementById("subjPromptMeaning");
  const hintEl = document.getElementById("subjHintArea");

  if (progressEl) progressEl.textContent = `${subjSession.index + 1} / ${total}`;
  if (scoreEl) scoreEl.textContent = `점수: ${subjSession.score}`;

  // 예외 규칙: 표기가 히라가나로만 된 단어는 한글 뜻을 제시하고 히라가나 직접 입력 또는 타일 선택으로 출제
  if (q.kanaOnlyException) {
    if (ruleBadgeEl) {
      ruleBadgeEl.hidden = false;
      ruleBadgeEl.textContent = "예외 규칙: 히라가나 전용 단어 → 뜻 제시 · 히라가나 입력/타일";
    }
    if (kindEl) kindEl.textContent = "한글 뜻을 보고 히라가나를 입력하세요";
    if (wordEl) {
      wordEl.hidden = true;
      wordEl.textContent = "";
    }
    if (meaningEl) {
      meaningEl.hidden = false;
      meaningEl.textContent = `뜻: ${item.meaning}`;
      meaningEl.classList.remove("is-revealed");
    }
  } else {
    if (ruleBadgeEl) {
      ruleBadgeEl.hidden = true;
      ruleBadgeEl.textContent = "";
    }
    if (kindEl) kindEl.textContent = "단어의 히라가나 읽기를 입력하세요";
    if (wordEl) {
      wordEl.hidden = false;
      wordEl.textContent = item.word;
    }
    if (meaningEl) {
      if (hideMeaning) {
        meaningEl.hidden = true;
        meaningEl.textContent = "";
      } else {
        meaningEl.hidden = false;
        meaningEl.textContent = `뜻: ${item.meaning}`;
        meaningEl.classList.remove("is-revealed");
      }
    }
  }

  if (hintEl) {
    if (firstHint) {
      const firstChar = Array.from(item.reading)[0] || "";
      hintEl.hidden = false;
      hintEl.innerHTML = `💡 첫글자 힌트: <span lang="ja">${escapeHtml(firstChar)}</span>`;
    } else {
      hintEl.hidden = true;
      hintEl.innerHTML = "";
    }
  }

  // 입력 방식 토글 (typing / tiles / both)
  const typingWrap = document.getElementById("subjDirectInputWrap");
  const tilesWrap = document.getElementById("subjTileInputWrap");
  if (typingWrap) typingWrap.hidden = inputMode === "tiles";
  if (tilesWrap) tilesWrap.hidden = inputMode === "typing";

  const directInput = document.getElementById("subjDirectInput");
  if (directInput) {
    directInput.value = subjAnswerBuffer;
    directInput.disabled = subjGraded;
  }

  const trayEl = document.getElementById("subjSelectedTray");
  if (trayEl) {
    trayEl.textContent = subjAnswerBuffer || "타일을 순서대로 클릭하세요";
  }

  const tilesGrid = document.getElementById("subjKanaTilesGrid");
  if (tilesGrid) {
    tilesGrid.innerHTML = q.tiles
      .map(
        (tile) => `
        <button
          type="button"
          class="kana-tile-btn ${tile.used ? "is-used" : ""}"
          data-tile-id="${escapeHtml(tile.id)}"
          lang="ja"
          ${tile.used || subjGraded ? "disabled" : ""}
        >
          ${escapeHtml(tile.ch)}
        </button>
      `
      )
      .join("");

    tilesGrid.querySelectorAll(".kana-tile-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (subjGraded) return;
        const tile = q.tiles.find((t) => t.id === btn.dataset.tileId);
        if (!tile || tile.used) return;
        tile.used = true;
        subjAnswerBuffer += tile.ch;
        renderSubjectiveQuestion();
      });
    });
  }

  const backBtn = document.getElementById("subjBackspaceBtn");
  const clearBtn = document.getElementById("subjClearTilesBtn");
  if (backBtn) backBtn.disabled = subjGraded;
  if (clearBtn) clearBtn.disabled = subjGraded;

  const submitBtn = document.getElementById("subjSubmitBtn");
  const nextBtn = document.getElementById("subjNextBtn");
  if (submitBtn) submitBtn.hidden = subjGraded;
  if (nextBtn) {
    nextBtn.hidden = !subjGraded;
    nextBtn.textContent = isLast ? "테스트 결과 보기" : "다음 문제 →";
  }

  const feedbackBox = document.getElementById("subjFeedbackBox");
  if (feedbackBox) {
    if (!subjGraded) {
      feedbackBox.hidden = true;
      feedbackBox.className = "feedback-box";
      feedbackBox.innerHTML = "";
    } else {
      feedbackBox.hidden = false;
      feedbackBox.className = `feedback-box ${subjCorrect ? "is-correct" : "is-wrong"}`;
      feedbackBox.innerHTML = `
        <strong>${subjCorrect ? "✅ 정답입니다!" : `❌ 오답입니다. 정답 히라가나: <span lang="ja">${escapeHtml(item.reading)}</span>`}</strong>
        <p style="margin-top:6px;">
          <span lang="ja"><strong>${escapeHtml(item.word)}</strong> (${escapeHtml(item.reading)})</span>
          — ${escapeHtml(item.meaning)}
        </p>
      `;
    }
  }
}

function gradeSubjectiveQuestion() {
  if (!subjSession || subjGraded) return;
  const directInput = document.getElementById("subjDirectInput");
  if (directInput && !directInput.hidden) {
    subjAnswerBuffer = directInput.value;
  }

  const q = subjSession.questions[subjSession.index];
  const userAns = subjAnswerBuffer.trim();
  const expected = q.item.reading.trim();

  subjGraded = true;
  subjCorrect = userAns === expected;

  if (subjCorrect) {
    subjSession.score += 1;
  } else {
    StudyStore.recordWrongAnswer(q.item.id, "주관식 테스트", userAns);
    refreshAllStudyUI();
  }

  renderSubjectiveQuestion();
}

function renderSubjectiveResult() {
  const playCard = document.getElementById("subjPlayCard");
  const setupCard = document.getElementById("subjSetupCard");
  if (!playCard || !subjSession) return;

  const total = subjSession.questions.length;
  const pct = total ? Math.round((subjSession.score / total) * 100) : 0;

  alert(`주관식 테스트 완료! 점수: ${subjSession.score} / ${total} (${pct}%)`);
  subjSession = null;
  playCard.hidden = true;
  if (setupCard) setupCard.hidden = false;
  refreshAllStudyUI();
}

// -------------------------------------------------------------------------
// 4. 오답노트 탭 (자동 기록·누적 오답 횟수·전역 가림 연동·재도전·복습 완료)
// -------------------------------------------------------------------------
function getWrongVocabEntries() {
  const wrongLog = StudyStore.getState().wrongLog || {};
  return Object.entries(wrongLog)
    .map(([id, meta]) => {
      const item = VOCAB_DATA.find((v) => v.id === id);
      if (!item) return null;
      return { item, meta };
    })
    .filter(Boolean)
    .sort((a, b) => (b.meta.count || 0) - (a.meta.count || 0));
}

function renderWrongNote() {
  const wrap = document.getElementById("wrongNoteListWrap");
  if (!wrap) return;

  const entries = getWrongVocabEntries();
  if (!entries.length) {
    wrap.innerHTML = `<p class="helper-note" style="text-align:center; padding:20px;">기록된 오답 단어가 없습니다. 4지선다 퀴즈나 주관식 테스트에서 틀린 단어가 자동으로 기록됩니다.</p>`;
    return;
  }

  wrap.innerHTML = `
    <table class="wrong-table">
      <thead>
        <tr>
          <th>단어 / 읽기</th>
          <th>뜻</th>
          <th>누적 오답 횟수</th>
          <th>최근 틀린 유형 · 입력</th>
          <th>복습 완료</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(({ item, meta }) => {
          const kanaOnly = isKanaOnlyWord(item.word);
          return `
            <tr data-wrong-id="${escapeHtml(item.id)}">
              <td>
                <strong lang="ja" data-kana-only-headword="${kanaOnly}">${escapeHtml(item.word)}</strong>
                <span lang="ja" class="maskable-reading" tabindex="0" style="color:var(--text-muted); margin-left:4px;">(${escapeHtml(item.reading)})</span>
              </td>
              <td>
                <span class="maskable-meaning" tabindex="0">${escapeHtml(item.meaning)}</span>
              </td>
              <td>
                <span class="wrong-count-pill">${escapeHtml(meta.count)}회</span>
              </td>
              <td class="helper-note">
                ${escapeHtml(meta.lastMode || "-")} · "${escapeHtml(meta.lastInput || "-")}"
              </td>
              <td>
                <button type="button" class="mini-btn resolve-wrong-btn" data-id="${escapeHtml(item.id)}">복습 완료</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll(".resolve-wrong-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      StudyStore.resolveWrongAnswer(btn.dataset.id);
      refreshAllStudyUI();
    });
  });
}

// -------------------------------------------------------------------------
// 5. 퀴즈 · 주관식 · 오답노트 이벤트 초기화
// -------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startQuizBtn")?.addEventListener("click", () => startMcqQuiz());
  document.getElementById("startSubjBtn")?.addEventListener("click", () => startSubjectiveTest());

  document.getElementById("subjDirectInput")?.addEventListener("input", (e) => {
    subjAnswerBuffer = e.target.value;
  });

  document.getElementById("subjDirectInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !subjGraded) {
      e.preventDefault();
      gradeSubjectiveQuestion();
    }
  });

  document.getElementById("subjBackspaceBtn")?.addEventListener("click", () => {
    if (!subjSession || subjGraded || !subjAnswerBuffer.length) return;
    const chars = Array.from(subjAnswerBuffer);
    const removed = chars.pop();
    subjAnswerBuffer = chars.join("");
    const q = subjSession.questions[subjSession.index];
    const usedTile = q.tiles.find((t) => t.used && t.ch === removed);
    if (usedTile) usedTile.used = false;
    renderSubjectiveQuestion();
  });

  document.getElementById("subjClearTilesBtn")?.addEventListener("click", () => {
    if (!subjSession || subjGraded) return;
    subjAnswerBuffer = "";
    const q = subjSession.questions[subjSession.index];
    q.tiles.forEach((t) => {
      t.used = false;
    });
    renderSubjectiveQuestion();
  });

  document.getElementById("subjSubmitBtn")?.addEventListener("click", gradeSubjectiveQuestion);

  document.getElementById("subjNextBtn")?.addEventListener("click", () => {
    if (!subjSession) return;
    if (subjSession.index < subjSession.questions.length - 1) {
      subjSession.index += 1;
      prepareSubjectiveQuestion();
    } else {
      renderSubjectiveResult();
    }
  });

  document.getElementById("subjQuitBtn")?.addEventListener("click", () => {
    subjSession = null;
    const playCard = document.getElementById("subjPlayCard");
    const setupCard = document.getElementById("subjSetupCard");
    if (playCard) playCard.hidden = true;
    if (setupCard) setupCard.hidden = false;
    refreshAllStudyUI();
  });

  document.getElementById("subjSpeakBtn")?.addEventListener("click", speakCurrentSubjWord);

  ["subjInputModeSelect", "subjHideMeaningChk", "subjFirstCharHintChk"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      if (subjSession) renderSubjectiveQuestion();
    });
  });

  // 오답노트 액션
  document.getElementById("retryWrongMcqBtn")?.addEventListener("click", () => {
    const items = getWrongVocabEntries().map((e) => e.item);
    if (!items.length) {
      alert("재도전할 오답 단어가 없습니다.");
      return;
    }
    switchTab("quiz");
    startMcqQuiz(items);
  });

  document.getElementById("retryWrongSubjBtn")?.addEventListener("click", () => {
    const items = getWrongVocabEntries().map((e) => e.item);
    if (!items.length) {
      alert("재도전할 오답 단어가 없습니다.");
      return;
    }
    switchTab("subjective");
    startSubjectiveTest(items);
  });

  document.getElementById("clearWrongLogsBtn")?.addEventListener("click", () => {
    if (!confirm("모든 오답 기록을 삭제하시겠습니까?")) return;
    StudyStore.clearAllWrongAnswers();
    refreshAllStudyUI();
  });
});
