// =========================================================================
// 3단계: 대시보드 집계, 단어장 필터/체크박스/커스텀 단어장, 플래시카드 및 TTS
// =========================================================================
let currentActiveTab = "dashboard";
let selectedWordIds = new Set();
let vocabFavOnlyFilter = false;
let vocabVisibleLimit = 36;

let fcDeckPool = [];
let fcCurrentIdx = 0;
let fcIsFlipped = false;

function getWordStatus(id) {
  return appState.statusMap[id] || "unknown";
}

function setWordStatus(id, nextStatus) {
  appState.statusMap[id] = nextStatus;
  saveAppState();
  refreshStudyViews();
}

function isFavoriteWord(id) {
  return appState.favorites.includes(id);
}

function toggleFavoriteWord(id) {
  const idx = appState.favorites.indexOf(id);
  if (idx >= 0) appState.favorites.splice(idx, 1);
  else appState.favorites.push(id);
  saveAppState();
  refreshStudyViews();
}

function getWordPosMemo(item) {
  return appState.posNotes[item.id] !== undefined ? appState.posNotes[item.id] : item.pos;
}

function escapeText(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shuffleList(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function speakJaText(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = Number(appState.ttsSpeed) || 0.95;
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ja"));
  if (jaVoice) utterance.voice = jaVoice;
  window.speechSynthesis.speak(utterance);
}

function applyThemeMode() {
  document.documentElement.setAttribute("data-theme", appState.theme);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.textContent = appState.theme === "dark" ? "☀️ 라이트 모드" : "🌙 다크 모드";
  }
}

function activateTab(tabName) {
  currentActiveTab = tabName;
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `panel-${tabName}`);
  });
  if (tabName === "flashcard") renderFlashcardStage();
  if (tabName === "wrongnote" && typeof renderWrongNoteSection === "function") {
    renderWrongNoteSection();
  }
}

function renderDashboardSection() {
  const total = VOCAB_DATA.length;
  const known = VOCAB_DATA.filter((v) => getWordStatus(v.id) === "known").length;
  const unsure = VOCAB_DATA.filter((v) => getWordStatus(v.id) === "unsure").length;
  const unknown = VOCAB_DATA.filter((v) => getWordStatus(v.id) === "unknown").length;
  const favCount = appState.favorites.length;
  const wrongTotal = Object.values(appState.wrongLog).reduce((sum, entry) => sum + (entry.count || 0), 0);

  const cards = [
    { label: "전체 어휘 수", value: total, sub: "중복 병합 기준", cls: "c-accent", onClick: () => { applyVocabPreset({}); activateTab("vocab"); } },
    { label: "외움", value: known, sub: `${total ? Math.round((known / total) * 100) : 0}% 달성`, cls: "c-success", onClick: () => { applyVocabPreset({ status: "known" }); activateTab("vocab"); } },
    { label: "헷갈림", value: unsure, sub: "클릭해 복습 이동", cls: "c-warn", onClick: () => { applyVocabPreset({ status: "unsure" }); activateTab("vocab"); } },
    { label: "미암기", value: unknown, sub: "클릭해 복습 이동", cls: "", onClick: () => { applyVocabPreset({ status: "unknown" }); activateTab("vocab"); } },
    { label: "즐겨찾기", value: favCount, sub: "별표 지정 단어", cls: "c-warn", onClick: () => { applyVocabPreset({ favOnly: true }); activateTab("vocab"); } },
    { label: "누적 오답 수", value: wrongTotal, sub: `${Object.keys(appState.wrongLog).length}개 단어 기록`, cls: "c-danger", onClick: () => activateTab("wrongnote") }
  ];

  const grid = document.getElementById("dashboardStatsGrid");
  grid.innerHTML = cards.map((c, i) => `
    <button type="button" class="stat-card" data-stat-index="${i}">
      <div class="stat-label">${c.label}</div>
      <div class="stat-value ${c.cls}">${c.value}</div>
      <div class="stat-sub">${c.sub}</div>
    </button>
  `).join("");

  grid.querySelectorAll(".stat-card").forEach((btn) => {
    btn.addEventListener("click", () => cards[Number(btn.dataset.statIndex)].onClick());
  });

  renderDeckSelectors();
}

function createDeckByName(rawName) {
  const name = (rawName || "").trim();
  if (!name) return null;
  const deck = {
    id: `deck_${Date.now()}`,
    name,
    wordIds: []
  };
  appState.decks.push(deck);
  saveAppState();
  renderDeckSelectors();
  return deck;
}

function renderDeckSelectors() {
  const badgeWrap = document.getElementById("customDeckBadges");
  if (!appState.decks.length) {
    badgeWrap.innerHTML = `<span class="muted-text">생성된 커스텀 단어장이 없습니다.</span>`;
  } else {
    badgeWrap.innerHTML = appState.decks.map((d) => `
      <span class="badge">📁 ${escapeText(d.name)} (${d.wordIds.length}개)</span>
    `).join("");
  }

  const filterSel = document.getElementById("vocabDeckFilter");
  if (filterSel) {
    const prev = filterSel.value;
    filterSel.innerHTML = `<option value="ALL">전체 단어장</option><option value="__FAV__">★ 즐겨찾기만</option>` +
      appState.decks.map((d) => `<option value="${d.id}">${escapeText(d.name)} (${d.wordIds.length})</option>`).join("");
    if ([...filterSel.options].some((o) => o.value === prev)) filterSel.value = prev;
  }

  ["vocabTargetDeckSelect", "fcDeckSelect"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="">-- 커스텀 단어장 선택 --</option>` +
      appState.decks.map((d) => `<option value="${d.id}">${escapeText(d.name)} (${d.wordIds.length})</option>`).join("");
    if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
  });
}

function populateCategorySelects() {
  const set = new Set();
  VOCAB_DATA.forEach((v) => v.years.forEach((y) => set.add(y)));
  const opts = `<option value="ALL">전체 기출·예상 분류</option>` +
    Array.from(set).map((y) => `<option value="${escapeText(y)}">${escapeText(y)}</option>`).join("");
  ["vocabCategoryFilter", "fcCategorySelect", "quizCategorySelect"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

function applyVocabPreset({ status = "ALL", favOnly = false }) {
  document.getElementById("vocabSearchInput").value = "";
  document.getElementById("vocabCategoryFilter").value = "ALL";
  document.getElementById("vocabPosFilter").value = "ALL";
  document.getElementById("vocabStatusFilter").value = status;
  document.getElementById("vocabDeckFilter").value = favOnly ? "__FAV__" : "ALL";
  vocabFavOnlyFilter = favOnly;
  vocabVisibleLimit = 36;
  document.getElementById("vocabFavOnlyToggleBtn").classList.toggle("btn-primary", favOnly);
  renderVocabGrid();
}

function matchesPosCategory(item, filterVal) {
  if (!filterVal || filterVal === "ALL") return true;
  const text = `${item.pos} ${getWordPosMemo(item)}`;
  if (filterVal === "접사") return text.includes("접사") || text.includes("접두") || text.includes("접미");
  if (filterVal === "관용·접속·표현") return text.includes("관용") || text.includes("접속") || text.includes("표현") || text.includes("문법");
  return text.includes(filterVal);
}

function getFilteredVocabList() {
  const q = document.getElementById("vocabSearchInput").value.trim().toLowerCase();
  const cat = document.getElementById("vocabCategoryFilter").value;
  const pos = document.getElementById("vocabPosFilter").value;
  const st = document.getElementById("vocabStatusFilter").value;
  const deckId = document.getElementById("vocabDeckFilter").value;
  const sort = document.getElementById("vocabSortSelect").value;

  const list = VOCAB_DATA.filter((item) => {
    const memo = getWordPosMemo(item).toLowerCase();
    const matchQ = !q ||
      item.word.toLowerCase().includes(q) ||
      item.reading.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q) ||
      memo.includes(q);
    const matchCat = cat === "ALL" || item.years.includes(cat);
    const matchPos = matchesPosCategory(item, pos);
    const matchSt = st === "ALL" || getWordStatus(item.id) === st;

    let matchDeck = true;
    if (vocabFavOnlyFilter || deckId === "__FAV__") {
      matchDeck = isFavoriteWord(item.id);
    } else if (deckId && deckId !== "ALL") {
      const deck = appState.decks.find((d) => d.id === deckId);
      matchDeck = deck ? deck.wordIds.includes(item.id) : true;
    }

    return matchQ && matchCat && matchPos && matchSt && matchDeck;
  });

  if (sort === "dupFirst") list.sort((a, b) => Number(b.isDuplicate) - Number(a.isDuplicate));
  else if (sort === "yearAsc") list.sort((a, b) => a.years.join(",").localeCompare(b.years.join(","), "ko"));
  else if (sort === "yearDesc") list.sort((a, b) => b.years.join(",").localeCompare(a.years.join(","), "ko"));

  return list;
}

function renderVocabGrid() {
  const allMatched = getFilteredVocabList();
  const visible = allMatched.slice(0, vocabVisibleLimit);
  const grid = document.getElementById("vocabCardGrid");

  document.getElementById("vocabSelectedCount").textContent = selectedWordIds.size;
  document.getElementById("vocabResultSummary").textContent = `${visible.length} / ${allMatched.length}개 표시`;

  const loadMoreBtn = document.getElementById("vocabLoadMoreBtn");
  loadMoreBtn.classList.toggle("hidden", allMatched.length <= vocabVisibleLimit);

  if (!visible.length) {
    grid.innerHTML = `<div class="panel-card" style="grid-column:1/-1; text-align:center;"><p class="muted-text">조건에 맞는 어휘가 없습니다.</p></div>`;
    return;
  }

  grid.innerHTML = visible.map((item) => {
    const st = getWordStatus(item.id);
    const fav = isFavoriteWord(item.id);
    const checked = selectedWordIds.has(item.id);
    const posMemo = getWordPosMemo(item);

    return `
      <article class="vocab-card" data-word-id="${item.id}">
        <div class="card-top">
          <div class="card-top-left">
            <input type="checkbox" class="vocab-item-chk" data-id="${item.id}" ${checked ? "checked" : ""} />
            <span class="badge ${item.isDuplicate ? "dup" : ""}">${escapeText(item.duplicateLabel)}</span>
          </div>
          <div>
            <button type="button" class="btn vocab-tts-btn" data-speak="${escapeText(item.word)}" title="발음 듣기">🔊</button>
            <button type="button" class="star-btn ${fav ? "active" : ""}" data-fav="${item.id}" title="즐겨찾기">★</button>
          </div>
        </div>

        <div>
          <div class="vocab-reading" lang="ja">${escapeText(item.reading)}</div>
          <div class="vocab-word" lang="ja">${escapeText(item.word)}</div>
          <div class="vocab-meaning">${escapeText(item.meaning)}</div>
        </div>

        <div class="pos-memo-row">
          <div>
            <span class="badge pos">품사 메모</span>
            <span>${escapeText(posMemo)}</span>
          </div>
          <button type="button" class="btn vocab-pos-edit-btn" data-id="${item.id}">수정</button>
        </div>
        <div class="vocab-pos-editor hidden" data-editor-for="${item.id}">
          <input type="text" class="input pos-memo-input" value="${escapeText(posMemo)}" />
          <div class="button-row">
            <button type="button" class="btn btn-primary vocab-pos-save-btn" data-id="${item.id}">저장</button>
            <button type="button" class="btn vocab-pos-cancel-btn" data-id="${item.id}">취소</button>
          </div>
        </div>

        <div class="status-pills">
          <button type="button" class="status-pill ${st === "known" ? "is-known" : ""}" data-set-st="${item.id}:known">외움</button>
          <button type="button" class="status-pill ${st === "unsure" ? "is-unsure" : ""}" data-set-st="${item.id}:unsure">헷갈림</button>
          <button type="button" class="status-pill ${st === "unknown" ? "is-unknown" : ""}" data-set-st="${item.id}:unknown">미암기</button>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".vocab-item-chk").forEach((chk) => {
    chk.addEventListener("change", () => {
      if (chk.checked) selectedWordIds.add(chk.dataset.id);
      else selectedWordIds.delete(chk.dataset.id);
      document.getElementById("vocabSelectedCount").textContent = selectedWordIds.size;
    });
  });

  grid.querySelectorAll(".vocab-tts-btn").forEach((btn) => {
    btn.addEventListener("click", () => speakJaText(btn.dataset.speak));
  });

  grid.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleFavoriteWord(btn.dataset.fav));
  });

  grid.querySelectorAll(".status-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [id, st] = btn.dataset.setSt.split(":");
      setWordStatus(id, st);
    });
  });

  grid.querySelectorAll(".vocab-pos-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      grid.querySelector(`.vocab-pos-editor[data-editor-for="${btn.dataset.id}"]`).classList.toggle("hidden");
    });
  });

  grid.querySelectorAll(".vocab-pos-cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      grid.querySelector(`.vocab-pos-editor[data-editor-for="${btn.dataset.id}"]`).classList.add("hidden");
    });
  });

  grid.querySelectorAll(".vocab-pos-save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const editor = grid.querySelector(`.vocab-pos-editor[data-editor-for="${id}"]`);
      const val = editor.querySelector(".pos-memo-input").value.trim();
      appState.posNotes[id] = val;
      saveAppState();
      renderVocabGrid();
    });
  });
}

function saveWordIdsToDeck(ids, deckId) {
  if (!ids.length) return alert("단어를 체크박스로 먼저 선택해 주세요.");
  const deck = appState.decks.find((d) => d.id === deckId);
  if (!deck) return alert("커스텀 단어장을 선택해 주세요.");
  ids.forEach((id) => {
    if (!deck.wordIds.includes(id)) deck.wordIds.push(id);
  });
  saveAppState();
  renderDeckSelectors();
  alert(`"${deck.name}" 단어장에 ${ids.length}개 단어를 저장했습니다.`);
}

function rebuildFlashcardPool(doShuffle = false) {
  const scope = document.getElementById("fcScopeSelect").value;
  const cat = document.getElementById("fcCategorySelect").value;
  const deckId = document.getElementById("fcDeckSelect").value;

  let list = VOCAB_DATA.filter((item) => {
    if (cat !== "ALL" && !item.years.includes(cat)) return false;
    if (deckId) {
      const deck = appState.decks.find((d) => d.id === deckId);
      if (deck && !deck.wordIds.includes(item.id)) return false;
    }
    if (scope === "FAV") return isFavoriteWord(item.id);
    if (scope === "known" || scope === "unsure" || scope === "unknown") return getWordStatus(item.id) === scope;
    return true;
  });

  if (!list.length) list = [...VOCAB_DATA];
  if (doShuffle) list = shuffleList(list);

  fcDeckPool = list;
  fcCurrentIdx = 0;
  fcIsFlipped = false;
  renderFlashcardStage();
}

function renderFlashcardStage() {
  if (!fcDeckPool.length) rebuildFlashcardPool(false);
  const card = fcDeckPool[fcCurrentIdx];
  const stage = document.getElementById("flashcardStage");
  document.getElementById("fcProgressText").textContent = `${fcCurrentIdx + 1} / ${fcDeckPool.length}`;
  document.getElementById("fcCurrentSelectChk").checked = selectedWordIds.has(card.id);

  const showExReading = document.getElementById("fcExampleReadingChk").checked;
  const showExMeaning = document.getElementById("fcExampleMeaningChk").checked;
  const st = getWordStatus(card.id);
  const fav = isFavoriteWord(card.id);

  stage.innerHTML = `
    <div id="flashcardInteractive" class="flashcard-box">
      <div class="card-top">
        <span class="badge ${card.isDuplicate ? "dup" : ""}">${escapeText(card.duplicateLabel)}</span>
        <div onclick="event.stopPropagation()">
          <button type="button" id="fcSpeakWordBtn" class="btn">🔊 단어</button>
          <button type="button" id="fcFavToggleBtn" class="star-btn ${fav ? "active" : ""}">★</button>
        </div>
      </div>

      ${!fcIsFlipped ? `
        <div class="fc-front">
          <div class="vocab-reading" lang="ja">${escapeText(card.reading)}</div>
          <div class="fc-word ja-serif" lang="ja">${escapeText(card.word)}</div>
          <p class="muted-text">클릭 또는 Space 키를 눌러 뒷면 보기</p>
        </div>
      ` : `
        <div>
          <div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
            <span class="fc-meaning">${escapeText(card.meaning)}</span>
            <span class="badge pos">${escapeText(getWordPosMemo(card))}</span>
          </div>
          <p class="muted-text" style="margin-top:4px;"><span lang="ja">${escapeText(card.word)} (${escapeText(card.reading)})</span></p>
          <div class="fc-example">
            <div class="card-top" style="margin-bottom:4px;">
              <strong style="font-size:0.8rem; color:var(--accent);">예문</strong>
              <button type="button" id="fcSpeakExampleBtn" class="btn" style="padding:3px 8px; font-size:0.78rem;">🔊 예문 듣기</button>
            </div>
            <div lang="ja" style="font-size:1.02rem; font-weight:500;">${escapeText(card.example)}</div>
            ${showExReading ? `<div lang="ja" class="muted-text" style="margin-top:2px;">${escapeText(card.exampleReading)}</div>` : ""}
            ${showExMeaning ? `<div style="font-size:0.9rem; margin-top:4px;">${escapeText(card.exampleMeaning)}</div>` : ""}
          </div>
        </div>
      `}

      <div class="status-pills" onclick="event.stopPropagation()">
        <button type="button" class="status-pill ${st === "known" ? "is-known" : ""}" id="fcStatusKnownBtn">1. 외움</button>
        <button type="button" class="status-pill ${st === "unsure" ? "is-unsure" : ""}" id="fcStatusUnsureBtn">2. 헷갈림</button>
        <button type="button" class="status-pill ${st === "unknown" ? "is-unknown" : ""}" id="fcStatusUnknownBtn">3. 미암기</button>
      </div>
    </div>

    <div class="fc-nav-row">
      <button type="button" id="fcPrevCardBtn" class="btn">← 이전 카드</button>
      <button type="button" id="fcFlipCardBtn" class="btn btn-primary">카드 뒤집기 (Space)</button>
      <button type="button" id="fcNextCardBtn" class="btn">다음 카드 →</button>
    </div>
  `;

  document.getElementById("flashcardInteractive").addEventListener("click", () => {
    fcIsFlipped = !fcIsFlipped;
    renderFlashcardStage();
  });
  document.getElementById("fcFlipCardBtn").addEventListener("click", () => {
    fcIsFlipped = !fcIsFlipped;
    renderFlashcardStage();
  });
  document.getElementById("fcPrevCardBtn").addEventListener("click", () => {
    fcCurrentIdx = (fcCurrentIdx - 1 + fcDeckPool.length) % fcDeckPool.length;
    fcIsFlipped = false;
    renderFlashcardStage();
  });
  document.getElementById("fcNextCardBtn").addEventListener("click", () => {
    fcCurrentIdx = (fcCurrentIdx + 1) % fcDeckPool.length;
    fcIsFlipped = false;
    renderFlashcardStage();
  });
  document.getElementById("fcSpeakWordBtn").addEventListener("click", () => speakJaText(card.word));
  const exBtn = document.getElementById("fcSpeakExampleBtn");
  if (exBtn) exBtn.addEventListener("click", () => speakJaText(card.example));
  document.getElementById("fcFavToggleBtn").addEventListener("click", () => {
    toggleFavoriteWord(card.id);
    renderFlashcardStage();
  });
  document.getElementById("fcStatusKnownBtn").addEventListener("click", () => { setWordStatus(card.id, "known"); renderFlashcardStage(); });
  document.getElementById("fcStatusUnsureBtn").addEventListener("click", () => { setWordStatus(card.id, "unsure"); renderFlashcardStage(); });
  document.getElementById("fcStatusUnknownBtn").addEventListener("click", () => { setWordStatus(card.id, "unknown"); renderFlashcardStage(); });
}

function refreshStudyViews() {
  renderDashboardSection();
  renderVocabGrid();
  if (currentActiveTab === "flashcard") renderFlashcardStage();
  if (currentActiveTab === "wrongnote" && typeof renderWrongNoteSection === "function") {
    renderWrongNoteSection();
  }
}

(function initStudyModule() {
  applyThemeMode();
  populateCategorySelects();
  refreshStudyViews();

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    appState.theme = appState.theme === "dark" ? "light" : "dark";
    saveAppState();
    applyThemeMode();
  });

  const speedInput = document.getElementById("ttsSpeedRange");
  const speedLabel = document.getElementById("ttsSpeedDisplay");
  speedInput.value = appState.ttsSpeed;
  speedLabel.textContent = `${Number(appState.ttsSpeed).toFixed(2)}x`;
  speedInput.addEventListener("input", (e) => {
    appState.ttsSpeed = parseFloat(e.target.value);
    speedLabel.textContent = `${appState.ttsSpeed.toFixed(2)}x`;
    saveAppState();
  });

  document.getElementById("createCustomDeckBtn").addEventListener("click", () => {
    const input = document.getElementById("customDeckNameInput");
    if (!input.value.trim()) return alert("커스텀 단어장 이름을 입력해 주세요.");
    createDeckByName(input.value);
    input.value = "";
  });

  document.getElementById("exportDataBtn").addEventListener("click", exportAppStateJson);
  document.getElementById("importDataBtn").addEventListener("click", () => {
    document.getElementById("importDataFileInput").click();
  });
  document.getElementById("importDataFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAppStateJsonText(reader.result);
        applyThemeMode();
        refreshStudyViews();
        alert("학습 데이터를 복원했습니다.");
      } catch (err) {
        alert("유효한 JSON 백업 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("resetAllDataBtn").addEventListener("click", () => {
    if (!confirm("모든 학습 기록과 설정을 초기화하시겠습니까?")) return;
    resetAppStateData();
    applyThemeMode();
    refreshStudyViews();
  });

  ["vocabSearchInput", "vocabCategoryFilter", "vocabPosFilter", "vocabStatusFilter", "vocabDeckFilter", "vocabSortSelect"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => { vocabVisibleLimit = 36; renderVocabGrid(); });
    document.getElementById(id).addEventListener("change", () => { vocabVisibleLimit = 36; renderVocabGrid(); });
  });

  document.getElementById("vocabFavOnlyToggleBtn").addEventListener("click", () => {
    vocabFavOnlyFilter = !vocabFavOnlyFilter;
    document.getElementById("vocabFavOnlyToggleBtn").classList.toggle("btn-primary", vocabFavOnlyFilter);
    renderVocabGrid();
  });

  document.getElementById("vocabSelectAllCheckbox").addEventListener("change", (e) => {
    const visible = getFilteredVocabList().slice(0, vocabVisibleLimit);
    if (e.target.checked) visible.forEach((v) => selectedWordIds.add(v.id));
    else visible.forEach((v) => selectedWordIds.delete(v.id));
    renderVocabGrid();
  });

  document.getElementById("vocabSaveSelectedDeckBtn").addEventListener("click", () => {
    saveWordIdsToDeck(Array.from(selectedWordIds), document.getElementById("vocabTargetDeckSelect").value);
  });

  document.getElementById("vocabSaveNewDeckBtn").addEventListener("click", () => {
    const ids = Array.from(selectedWordIds);
    if (!ids.length) return alert("단어를 체크박스로 먼저 선택해 주세요.");
    const name = prompt("새 커스텀 단어장 이름을 입력하세요:");
    if (!name) return;
    const deck = createDeckByName(name);
    if (deck) saveWordIdsToDeck(ids, deck.id);
  });

  document.getElementById("vocabLoadMoreBtn").addEventListener("click", () => {
    vocabVisibleLimit += 36;
    renderVocabGrid();
  });

  ["fcScopeSelect", "fcCategorySelect", "fcDeckSelect"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => rebuildFlashcardPool(false));
  });
  ["fcExampleReadingChk", "fcExampleMeaningChk"].forEach((id) => {
    document.getElementById(id).addEventListener("change", renderFlashcardStage);
  });
  document.getElementById("fcShuffleBtn").addEventListener("click", () => rebuildFlashcardPool(true));
  document.getElementById("fcCurrentSelectChk").addEventListener("change", (e) => {
    const card = fcDeckPool[fcCurrentIdx];
    if (!card) return;
    if (e.target.checked) selectedWordIds.add(card.id);
    else selectedWordIds.delete(card.id);
    document.getElementById("vocabSelectedCount").textContent = selectedWordIds.size;
  });
  document.getElementById("fcSaveToDeckBtn").addEventListener("click", () => {
    const card = fcDeckPool[fcCurrentIdx];
    if (!card) return;
    const ids = selectedWordIds.size ? Array.from(selectedWordIds) : [card.id];
    saveWordIdsToDeck(ids, document.getElementById("fcDeckSelect").value);
  });
})();