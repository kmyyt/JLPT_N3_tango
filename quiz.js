// =========================================================================
// 4단계: 4지선다 퀴즈, 주관식 테스트(히라가나 타일/예외규칙), 오답노트, 전역 단축키
// =========================================================================
let mcQuizState = null;
let subjQuizState = null;
let subjInputText = "";
let subjIsGraded = false;
let subjLastCorrect = false;

function getQuizPool(scope, category) {
  let pool = VOCAB_DATA.filter((v) => category === "ALL" || v.years.includes(category));
  if (scope === "FAV") {
    pool = pool.filter((v) => isFavoriteWord(v.id));
  } else if (scope === "unsure_unknown") {
    pool = pool.filter((v) => ["unsure", "unknown"].includes(getWordStatus(v.id)));
  } else if (scope === "unsure" || scope === "unknown") {
    pool = pool.filter((v) => getWordStatus(v.id) === scope);
  }
  return pool.length ? pool : [...VOCAB_DATA];
}

function buildSafeOptions(target, field, correctVal) {
  const candidates = shuffleList(VOCAB_DATA.filter((v) => v.id !== target.id));
  const picked = [];
  const fallbackPool = ["명사 뜻", "동사 의미", "형용사 의미", "부사 표현", "関連語彙", "別の読み方"];

  for (const cand of candidates) {
    const val = cand[field];
    if (val && val !== correctVal && !picked.includes(val)) {
      picked.push(val);
    }
    if (picked.length === 3) break;
  }

  for (const fb of fallbackPool) {
    if (picked.length === 3) break;
    if (fb !== correctVal && !picked.includes(fb)) {
      picked.push(fb);
    }
  }

  return shuffleList([correctVal, ...picked]);
}

function logWrongAnswer(wordId, modeLabel, userInput) {
  const prev = appState.wrongLog[wordId] || { count: 0 };
  appState.wrongLog[wordId] = {
    count: prev.count + 1,
    lastMode: modeLabel,
    lastInput: userInput || "",
    lastAt: new Date().toLocaleString("ko-KR")
  };
  saveAppState();
}

function launchMcQuiz(overrideList = null) {
  let pool;
  let countCfg;
  let shouldShuffle = true;

  if (overrideList && overrideList.length) {
    pool = [...overrideList];
    countCfg = pool.length;
  } else {
    const scope = document.getElementById("quizScopeSelect").value;
    const cat = document.getElementById("quizCategorySelect").value;
    countCfg = document.getElementById("quizCountSelect").value;
    shouldShuffle = document.getElementById("quizShuffleChk").checked;
    pool = getQuizPool(scope, cat);
  }

  if (shouldShuffle) pool = shuffleList(pool);
  const limit = countCfg === "ALL" ? pool.length : Math.min(Number(countCfg), pool.length);
  const selected = pool.slice(0, limit);

  const questions = selected.map((target) => {
    const askReading = Math.random() < 0.5;
    const field = askReading ? "reading" : "meaning";
    const correctAnswer = target[field];
    const options = buildSafeOptions(target, field, correctAnswer);

    return {
      item: target,
      prompt: askReading
        ? `다음 단어의 올바른 히라가나 읽기를 고르세요: <strong lang="ja" style="font-size:1.3rem;">${escapeText(target.word)}</strong>`
        : `다음 단어(<strong lang="ja">${escapeText(target.word)}</strong> · <span lang="ja">${escapeText(target.reading)}</span>)의 올바른 뜻을 고르세요.`,
      options,
      correctAnswer,
      chosen: null
    };
  });

  mcQuizState = { questions, index: 0, score: 0 };
  document.getElementById("quizSetupBox").classList.add("hidden");
  document.getElementById("quizPlayBox").classList.remove("hidden");
  renderMcQuestion();
}

function renderMcQuestion() {
  const box = document.getElementById("quizPlayBox");
  const q = mcQuizState.questions[mcQuizState.index];
  const total = mcQuizState.questions.length;

  box.innerHTML = `
    <div class="card-top" style="margin-bottom:10px;">
      <span class="badge">문항 ${mcQuizState.index + 1} / ${total}</span>
      <button type="button" id="mcSpeakBtn" class="btn">🔊 발음 듣기</button>
    </div>
    <p style="font-size:1.05rem;">${q.prompt}</p>
    <div class="choice-list">
      ${q.options.map((opt, idx) => {
        let cls = "btn choice-btn";
        if (q.chosen !== null) {
          if (opt === q.correctAnswer) cls += " correct";
          else if (opt === q.chosen) cls += " wrong";
        }
        return `<button type="button" class="${cls}" data-choice-idx="${idx}" ${q.chosen !== null ? "disabled" : ""}>${idx + 1}. ${escapeText(opt)}</button>`;
      }).join("")}
    </div>
    <div id="mcFeedbackSlot"></div>
  `;

  document.getElementById("mcSpeakBtn").addEventListener("click", () => speakJaText(q.item.word));

  box.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const picked = q.options[Number(btn.dataset.choiceIdx)];
      q.chosen = picked;
      const ok = picked === q.correctAnswer;
      if (ok) mcQuizState.score += 1;
      else logWrongAnswer(q.item.id, "4지선다 퀴즈", picked);
      renderMcQuestion();
    });
  });

  if (q.chosen !== null) {
    const ok = q.chosen === q.correctAnswer;
    const isLast = mcQuizState.index === total - 1;
    document.getElementById("mcFeedbackSlot").innerHTML = `
      <div class="feedback-box ${ok ? "ok" : "ng"}">
        <strong>${ok ? "✅ 정답입니다!" : `❌ 오답입니다. 정답: ${escapeText(q.correctAnswer)}`}</strong>
        <p style="font-size:0.88rem; margin-top:4px;"><span lang="ja">${escapeText(q.item.word)} (${escapeText(q.item.reading)})</span> — ${escapeText(q.item.meaning)} (${escapeText(getWordPosMemo(q.item))})</p>
        <p class="muted-text" style="margin-top:4px;" lang="ja">${escapeText(q.item.example)}</p>
        <p class="muted-text">${escapeText(q.item.exampleMeaning)}</p>
      </div>
      <div class="button-row" style="justify-content:space-between;">
        <button type="button" id="mcQuitBtn" class="btn">설정으로</button>
        <button type="button" id="mcNextBtn" class="btn btn-primary">${isLast ? "결과 보기" : "다음 문제 →"}</button>
      </div>
    `;

    document.getElementById("mcQuitBtn").addEventListener("click", closeMcQuizToSetup);
    document.getElementById("mcNextBtn").addEventListener("click", () => {
      if (!isLast) {
        mcQuizState.index += 1;
        renderMcQuestion();
      } else {
        renderMcSummary();
      }
    });
  }
}

function closeMcQuizToSetup() {
  document.getElementById("quizPlayBox").classList.add("hidden");
  document.getElementById("quizSetupBox").classList.remove("hidden");
  refreshStudyViews();
}

function renderMcSummary() {
  const box = document.getElementById("quizPlayBox");
  const total = mcQuizState.questions.length;
  const wrongItems = mcQuizState.questions.filter((q) => q.chosen !== q.correctAnswer).map((q) => q.item);
  box.innerHTML = `
    <h2 class="section-heading">4지선다 퀴즈 결과</h2>
    <p style="font-size:1.1rem; margin-bottom:12px;">점수: <strong>${mcQuizState.score} / ${total}</strong> (${Math.round((mcQuizState.score / total) * 100)}%)</p>
    <div class="button-row">
      <button type="button" id="mcRetryAllBtn" class="btn btn-primary">다시 풀기</button>
      ${wrongItems.length ? `<button type="button" id="mcRetryWrongBtn" class="btn btn-danger">틀린 문제만 다시 풀기 (${wrongItems.length}개)</button>` : ""}
      <button type="button" id="mcBackSetupBtn" class="btn">설정 화면으로</button>
    </div>
  `;
  document.getElementById("mcRetryAllBtn").addEventListener("click", () => launchMcQuiz());
  document.getElementById("mcBackSetupBtn").addEventListener("click", closeMcQuizToSetup);
  const wrongBtn = document.getElementById("mcRetryWrongBtn");
  if (wrongBtn) wrongBtn.addEventListener("click", () => launchMcQuiz(wrongItems));
}

function isKanaOnlyText(str) {
  return /^[ぁ-ゟー・〜\s]+$/.test((str || "").trim());
}

function makeKanaTiles(reading) {
  const chars = Array.from(reading);
  const distractors = ["か", "き", "く", "け", "こ", "さ", "し", "す", "た", "ち", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ま", "み", "む", "め", "も", "ら", "り", "る", "れ", "ろ", "ん", "っ"];
  const list = [...chars];
  while (list.length < Math.min(10, chars.length + 4)) {
    list.push(distractors[Math.floor(Math.random() * distractors.length)]);
  }
  return shuffleList(list).map((ch, idx) => ({ id: `tile_${idx}_${ch}`, ch, used: false }));
}

function launchSubjectiveTest(overrideList = null) {
  let pool;
  let countCfg;
  let shouldShuffle = true;

  if (overrideList && overrideList.length) {
    pool = [...overrideList];
    countCfg = pool.length;
  } else {
    const scope = document.getElementById("subjScopeSelect").value;
    countCfg = document.getElementById("subjCountSelect").value;
    shouldShuffle = document.getElementById("subjShuffleChk").checked;
    pool = getQuizPool(scope, "ALL");
  }

  if (shouldShuffle) pool = shuffleList(pool);
  const limit = countCfg === "ALL" ? pool.length : Math.min(Number(countCfg), pool.length);
  const selected = pool.slice(0, limit);

  subjQuizState = {
    questions: selected.map((item) => ({
      item,
      isKanaOnlyException: isKanaOnlyText(item.word),
      tiles: makeKanaTiles(item.reading)
    })),
    index: 0,
    score: 0
  };

  document.getElementById("subjSetupBox").classList.add("hidden");
  document.getElementById("subjPlayBox").classList.remove("hidden");
  prepareSubjectiveQuestion();
}

function prepareSubjectiveQuestion() {
  subjInputText = "";
  subjIsGraded = false;
  subjLastCorrect = false;
  const q = subjQuizState.questions[subjQuizState.index];
  q.tiles.forEach((t) => (t.used = false));
  renderSubjectiveQuestion();
}

function renderSubjectiveQuestion() {
  const box = document.getElementById("subjPlayBox");
  const q = subjQuizState.questions[subjQuizState.index];
  const item = q.item;
  const mode = document.getElementById("subjInputModeSelect").value;
  const hideMeaning = document.getElementById("subjHideMeaningChk").checked;
  const showHint = document.getElementById("subjFirstHintChk").checked;

  const promptBlock = q.isKanaOnlyException
    ? `
      <span class="badge dup" style="margin-bottom:6px;">예외 규칙: 히라가나 전용 단어 → 뜻 제시 후 히라가나 입력</span>
      <div style="font-size:1.3rem; font-weight:700;">뜻: ${escapeText(item.meaning)}</div>
      <p class="muted-text">해당 단어의 히라가나를 직접 입력하거나 타일을 순서대로 선택하세요.</p>
    `
    : `
      <div style="font-size:1.55rem; font-weight:700;" lang="ja">${escapeText(item.word)}</div>
      ${!hideMeaning ? `<div class="muted-text" style="font-size:0.98rem; margin-top:4px;">뜻: ${escapeText(item.meaning)}</div>` : `<div class="muted-text" style="margin-top:4px;">(뜻 숨김)</div>`}
    `;

  box.innerHTML = `
    <div class="card-top" style="margin-bottom:10px;">
      <span class="badge">주관식 ${subjQuizState.index + 1} / ${subjQuizState.questions.length}</span>
      <button type="button" id="subjSpeakBtn" class="btn">🔊 발음 듣기</button>
    </div>
    <div style="margin-bottom:12px;">${promptBlock}</div>
    ${showHint ? `<div class="badge" style="margin-bottom:10px;">💡 첫글자 힌트: <strong lang="ja">${escapeText(Array.from(item.reading)[0])}</strong></div>` : ""}

    ${(mode === "typing" || mode === "both") ? `
      <div style="margin-bottom:12px;">
        <input id="subjTypingInput" type="text" class="input full-width" lang="ja" value="${escapeText(subjInputText)}" placeholder="히라가나 입력" ${subjIsGraded ? "disabled" : ""} />
      </div>
    ` : ""}

    ${(mode === "tiles" || mode === "both") ? `
      <div style="margin-bottom:12px;">
        <div id="subjTileTray" class="kana-tray" lang="ja">${escapeText(subjInputText || "타일을 순서대로 클릭하세요")}</div>
        <div class="kana-tiles">
          ${q.tiles.map((t) => `<button type="button" class="btn kana-tile" data-tile-id="${t.id}" lang="ja" ${t.used || subjIsGraded ? "disabled" : ""}>${escapeText(t.ch)}</button>`).join("")}
        </div>
        <div class="button-row">
          <button type="button" id="subjTileBackBtn" class="btn" ${subjIsGraded ? "disabled" : ""}>⌫ 한 글자 지우기</button>
          <button type="button" id="subjTileClearBtn" class="btn" ${subjIsGraded ? "disabled" : ""}>전체 초기화</button>
        </div>
      </div>
    ` : ""}

    <div class="button-row">
      ${!subjIsGraded
        ? `<button type="button" id="subjGradeBtn" class="btn btn-primary">채점하기</button>`
        : `<button type="button" id="subjNextBtn" class="btn btn-primary">${subjQuizState.index === subjQuizState.questions.length - 1 ? "테스트 종료" : "다음 문제 →"}</button>`}
      <button type="button" id="subjQuitBtn" class="btn">설정으로</button>
    </div>

    <div id="subjFeedbackSlot"></div>
  `;

  document.getElementById("subjSpeakBtn").addEventListener("click", () => speakJaText(item.word));
  document.getElementById("subjQuitBtn").addEventListener("click", () => {
    box.classList.add("hidden");
    document.getElementById("subjSetupBox").classList.remove("hidden");
    refreshStudyViews();
  });

  const typingEl = document.getElementById("subjTypingInput");
  if (typingEl) {
    typingEl.addEventListener("input", (e) => { subjInputText = e.target.value; });
    typingEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !subjIsGraded) gradeSubjectiveQuestion();
    });
  }

  box.querySelectorAll(".kana-tile").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tile = q.tiles.find((t) => t.id === btn.dataset.tileId);
      if (!tile || tile.used) return;
      tile.used = true;
      subjInputText += tile.ch;
      renderSubjectiveQuestion();
    });
  });

  const backBtn = document.getElementById("subjTileBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (!subjInputText.length) return;
      const chars = Array.from(subjInputText);
      const removed = chars.pop();
      subjInputText = chars.join("");
      const tile = q.tiles.find((t) => t.used && t.ch === removed);
      if (tile) tile.used = false;
      renderSubjectiveQuestion();
    });
  }

  const clearBtn = document.getElementById("subjTileClearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      subjInputText = "";
      q.tiles.forEach((t) => (t.used = false));
      renderSubjectiveQuestion();
    });
  }

  const gradeBtn = document.getElementById("subjGradeBtn");
  if (gradeBtn) gradeBtn.addEventListener("click", gradeSubjectiveQuestion);

  const nextBtn = document.getElementById("subjNextBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (subjQuizState.index < subjQuizState.questions.length - 1) {
        subjQuizState.index += 1;
        prepareSubjectiveQuestion();
      } else {
        box.innerHTML = `
          <h2 class="section-heading">주관식 테스트 결과</h2>
          <p style="font-size:1.1rem; margin-bottom:12px;">점수: <strong>${subjQuizState.score} / ${subjQuizState.questions.length}</strong></p>
          <button type="button" id="subjDoneBtn" class="btn btn-primary">설정 화면으로</button>
        `;
        document.getElementById("subjDoneBtn").addEventListener("click", () => {
          box.classList.add("hidden");
          document.getElementById("subjSetupBox").classList.remove("hidden");
          refreshStudyViews();
        });
      }
    });
  }

  if (subjIsGraded) {
    document.getElementById("subjFeedbackSlot").innerHTML = `
      <div class="feedback-box ${subjLastCorrect ? "ok" : "ng"}">
        <strong>${subjLastCorrect ? "✅ 정답입니다!" : `❌ 오답입니다. 정답 읽기: ${escapeText(item.reading)}`}</strong>
        <p style="font-size:0.88rem; margin-top:4px;"><span lang="ja">${escapeText(item.word)}</span> — ${escapeText(item.meaning)}</p>
        <p class="muted-text" style="margin-top:4px;" lang="ja">${escapeText(item.example)}</p>
        <p class="muted-text">${escapeText(item.exampleMeaning)}</p>
      </div>
    `;
  }
}

function gradeSubjectiveQuestion() {
  const q = subjQuizState.questions[subjQuizState.index];
  const answer = subjInputText.trim();
  const expected = q.item.reading.trim();
  subjIsGraded = true;
  subjLastCorrect = answer === expected;
  if (subjLastCorrect) subjQuizState.score += 1;
  else logWrongAnswer(q.item.id, "주관식 테스트", answer);
  renderSubjectiveQuestion();
}

function getWrongWordsList() {
  return Object.keys(appState.wrongLog)
    .map((id) => VOCAB_DATA.find((v) => v.id === id))
    .filter(Boolean);
}

function renderWrongNoteSection() {
  const wrap = document.getElementById("wrongNoteTableWrap");
  const list = getWrongWordsList();

  if (!list.length) {
    wrap.innerHTML = `<p class="muted-text" style="text-align:center; padding:18px;">저장된 오답 기록이 없습니다.</p>`;
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>단어 / 읽기</th>
          <th>뜻</th>
          <th>누적 오답 횟수</th>
          <th>최근 유형 · 입력</th>
          <th>복습</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((item) => {
          const log = appState.wrongLog[item.id];
          return `
            <tr>
              <td><strong lang="ja">${escapeText(item.word)}</strong> <span lang="ja" class="muted-text">(${escapeText(item.reading)})</span></td>
              <td>${escapeText(item.meaning)}</td>
              <td><span class="badge" style="background:var(--danger-soft); color:var(--danger); border-color:transparent;">${log.count}회</span></td>
              <td class="muted-text">${escapeText(log.lastMode || "-")} · "${escapeText(log.lastInput || "-")}"</td>
              <td><button type="button" class="btn wrong-resolve-btn" data-id="${item.id}">복습 완료</button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll(".wrong-resolve-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      delete appState.wrongLog[btn.dataset.id];
      saveAppState();
      refreshStudyViews();
    });
  });
}

function setShortcutModalVisible(open) {
  const backdrop = document.getElementById("shortcutModalBackdrop");
  backdrop.classList.toggle("open", open);
  backdrop.setAttribute("aria-hidden", String(!open));
}

(function initQuizAndShortcuts() {
  document.getElementById("startQuizBtn").addEventListener("click", () => launchMcQuiz());
  document.getElementById("startSubjBtn").addEventListener("click", () => launchSubjectiveTest());

  document.getElementById("retryWrongQuizBtn").addEventListener("click", () => {
    const list = getWrongWordsList();
    if (!list.length) return alert("복습할 오답 단어가 없습니다.");
    activateTab("quiz");
    launchMcQuiz(list);
  });

  document.getElementById("retryWrongSubjBtn").addEventListener("click", () => {
    const list = getWrongWordsList();
    if (!list.length) return alert("복습할 오답 단어가 없습니다.");
    activateTab("subjective");
    launchSubjectiveTest(list);
  });

  document.getElementById("clearWrongNoteBtn").addEventListener("click", () => {
    if (!confirm("모든 오답 기록을 삭제하시겠습니까?")) return;
    appState.wrongLog = {};
    saveAppState();
    refreshStudyViews();
  });

  document.getElementById("shortcutModalOpenBtn").addEventListener("click", () => setShortcutModalVisible(true));
  document.getElementById("shortcutModalCloseBtn").addEventListener("click", () => setShortcutModalVisible(false));
  document.getElementById("shortcutModalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "shortcutModalBackdrop") setShortcutModalVisible(false);
  });

  document.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    const tag = activeEl ? activeEl.tagName.toLowerCase() : "";
    const inField = ["input", "textarea", "select"].includes(tag);

    if (e.key === "?") {
      if (inField) return;
      e.preventDefault();
      const isOpen = document.getElementById("shortcutModalBackdrop").classList.contains("open");
      setShortcutModalVisible(!isOpen);
      return;
    }

    if (e.key === "Escape" && document.getElementById("shortcutModalBackdrop").classList.contains("open")) {
      setShortcutModalVisible(false);
      return;
    }

    if (inField) return;

    if (e.key === "/") {
      e.preventDefault();
      activateTab("vocab");
      setTimeout(() => document.getElementById("vocabSearchInput").focus(), 25);
      return;
    }

    if (currentActiveTab === "flashcard" && fcDeckPool.length) {
      const card = fcDeckPool[fcCurrentIdx];
      if (e.code === "Space") {
        e.preventDefault();
        fcIsFlipped = !fcIsFlipped;
        renderFlashcardStage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        fcCurrentIdx = (fcCurrentIdx - 1 + fcDeckPool.length) % fcDeckPool.length;
        fcIsFlipped = false;
        renderFlashcardStage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        fcCurrentIdx = (fcCurrentIdx + 1) % fcDeckPool.length;
        fcIsFlipped = false;
        renderFlashcardStage();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        speakJaText(card.word);
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleFavoriteWord(card.id);
        renderFlashcardStage();
      } else if (e.key === "1") {
        setWordStatus(card.id, "known");
        renderFlashcardStage();
      } else if (e.key === "2") {
        setWordStatus(card.id, "unsure");
        renderFlashcardStage();
      } else if (e.key === "3") {
        setWordStatus(card.id, "unknown");
        renderFlashcardStage();
      }
    } else if (e.key.toLowerCase() === "r") {
      if (currentActiveTab === "quiz" && mcQuizState) {
        speakJaText(mcQuizState.questions[mcQuizState.index].item.word);
      } else if (currentActiveTab === "subjective" && subjQuizState) {
        speakJaText(subjQuizState.questions[subjQuizState.index].item.word);
      }
    }
  });
})();