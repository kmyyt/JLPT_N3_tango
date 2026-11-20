// =========================================================================
// 4단계: study.js — 공통 전역 기능, 대시보드, 단어장, 플래시카드, 단축키/모달
// - index.html, style.css, data.js(VOCAB_DATA, StudyStore, isKanaOnlyWord)와 연동
// =========================================================================

let activeTabName = "dashboard";
let selectedVocabIds = new Set();
let favOnlyMode = false;
let vocabVisibleLimit = 36;

let fcDeckPool = [];
let fcCurrentIdx = 0;
let fcIsFlipped = false;

// -------------------------------------------------------------------------
// 공통 유틸리티 및 TTS 엔진
// -------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function speakJapanese(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const state = StudyStore.getState();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = Number(state.ttsSpeed) || 0.95;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ja"));
  if (jaVoice) utterance.voice = jaVoice;

  window.speechSynthesis.speak(utterance);
}

// -------------------------------------------------------------------------
// 테마 / 전역 히라가나 가림 / 전역 뜻 가림 적용
// -------------------------------------------------------------------------
function applyThemeAndMasks() {
  const state = StudyStore.getState();

  // 라이트/다크 모드 적용
  document.documentElement.setAttribute("data-theme", state.theme);
  document.body.classList.toggle("dark-mode", state.theme === "dark");
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    const isDark = state.theme === "dark";
    themeBtn.textContent = isDark ? "☀️ 라이트 모드" : "🌙 다크 모드";
    themeBtn.setAttribute("aria-pressed", String(isDark));
  }

  // 전역 히라가나(읽기) 가림 적용
  document.body.setAttribute("data-mask-reading", String(state.maskReading));
  document.body.classList.toggle("mask-reading", state.maskReading);
  const maskReadingBtn = document.getElementById("toggleGlobalReadingBtn");
  if (maskReadingBtn) {
    maskReadingBtn.classList.toggle("is-active", state.maskReading);
    maskReadingBtn.setAttribute("aria-pressed", String(state.maskReading));
    maskReadingBtn.textContent = state.maskReading ? "👁️ 전체 읽기 보이기" : "🙈 전체 읽기 가림";
  }

  // 전역 뜻 가림 적용
  document.body.setAttribute("data-mask-meaning", String(state.maskMeaning));
  document.body.classList.toggle("mask-meaning", state.maskMeaning);
  const maskMeaningBtn = document.getElementById("toggleGlobalMeaningBtn");
  if (maskMeaningBtn) {
    maskMeaningBtn.classList.toggle("is-active", state.maskMeaning);
    maskMeaningBtn.setAttribute("aria-pressed", String(state.maskMeaning));
    maskMeaningBtn.textContent = state.maskMeaning ? "👁️ 전체 뜻 보이기" : "🙉 전체 뜻 가림";
  }

  // TTS 속도 표시 동기화
  const speedRange = document.getElementById("ttsSpeedRange");
  const speedValue = document.getElementById("ttsSpeedValue");
  if (speedRange) speedRange.value = state.ttsSpeed;
  if (speedValue) speedValue.textContent = `${Number(state.ttsSpeed).toFixed(2)}x`;
}

// 가려진 읽기/뜻 개별 클릭 시 임시 공개 토글 (호버는 style.css에서 처리)
function setupMaskedItemRevealHandler() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".maskable-reading, .maskable-meaning");
    if (!target) return;
    if (target.dataset.kanaOnlyHeadword === "true") return;

    const isReadingMasked = document.body.getAttribute("data-mask-reading") === "true";
    const isMeaningMasked = document.body.getAttribute("data-mask-meaning") === "true";
    if (
      (target.classList.contains("maskable-reading") && isReadingMasked) ||
      (target.classList.contains("maskable-meaning") && isMeaningMasked)
    ) {
      e.stopPropagation();
      target.classList.toggle("is-revealed");
    }
  });
}

// -------------------------------------------------------------------------
// 탭 전환 및 모달 제어
// -------------------------------------------------------------------------
function switchTab(tabName) {
  if (!tabName) return;
  activeTabName = tabName;

  document.querySelectorAll("#mainTabNav .tab-btn").forEach((btn) => {
    const isMatch = btn.dataset.tab === tabName;
    btn.classList.toggle("is-active", isMatch);
    btn.setAttribute("aria-selected", String(isMatch));
  });

  document.querySelectorAll("#mainContent .tab-panel").forEach((panel) => {
    const isMatch = panel.dataset.tabPanel === tabName || panel.id === `panel-${tabName}`;
    panel.classList.toggle("is-active", isMatch);
    panel.hidden = !isMatch;
  });

  if (tabName === "flashcard") renderFlashcard();
  if (tabName === "wrongnote" && typeof renderWrongNote === "function") {
    renderWrongNote();
  }
}

function toggleShortcutModal(forceOpen) {
  const modal = document.getElementById("shortcutModal");
  if (!modal) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : modal.hidden;
  modal.hidden = !shouldOpen;
}

// -------------------------------------------------------------------------
// 1. 대시보드 탭 집계 및 빠른 이동
// -------------------------------------------------------------------------
function renderDashboard() {
  const state = StudyStore.getState();
  const total = VOCAB_DATA.length;
  const known = VOCAB_DATA.filter((v) => StudyStore.getStatus(v.id) === "known").length;
  const unsure = VOCAB_DATA.filter((v) => StudyStore.getStatus(v.id) === "unsure").length;
  const unknown = VOCAB_DATA.filter((v) => StudyStore.getStatus(v.id) === "unknown").length;
  const favCount = state.favorites.length;
  const wrongTotal = Object.values(state.wrongLog).reduce((acc, cur) => acc + (cur.count || 0), 0);

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };

  setText("statTotalCount", total);
  setText("statKnownCount", known);
  setText("statUnsureCount", unsure);
  setText("statUnknownCount", unknown);
  setText("statFavoritesCount", favCount);
  setText("statWrongCount", wrongTotal);

  renderCustomDecksAndSelects();
}

function renderCustomDecksAndSelects() {
  const state = StudyStore.getState();
  const deckListEl = document.getElementById("customDeckList");

  if (deckListEl) {
    if (!state.decks.length) {
      deckListEl.innerHTML = `<span class="helper-note">아직 생성된 커스텀 단어장이 없습니다.</span>`;
    } else {
      deckListEl.innerHTML = state.decks
        .map(
          (deck) => `
          <span class="deck-chip" data-deck-id="${escapeHtml(deck.id)}">
            📁 ${escapeHtml(deck.name)} (${deck.wordIds.length}개)
            <button type="button" class="mini-btn" data-open-deck="${escapeHtml(deck.id)}" title="단어장에서 열기">열기</button>
          </span>
        `
        )
        .join("");

      deckListEl.querySelectorAll("[data-open-deck]").forEach((btn) => {
        btn.addEventListener("click", () => {
          resetVocabFilters({ deckId: btn.dataset.openDeck });
          switchTab("vocab");
        });
      });
    }
  }

  // 모든 단어장 <select> 동기화
  const deckSelectConfigs = [
    { id: "vocabDeckFilter", defaultOpt: `<option value="ALL">전체 단어장</option><option value="__FAV__">★ 즐겨찾기만</option>` },
    { id: "vocabBatchDeckSelect", defaultOpt: `<option value="">-- 저장할 커스텀 단어장 --</option>` },
    { id: "fcDeckFilter", defaultOpt: `<option value="">전체 단어장(필터 미적용)</option>` },
    { id: "fcDeckSelect", defaultOpt: `<option value="">-- 커스텀 단어장 선택 --</option>` },
    { id: "quizDeckSelect", defaultOpt: `<option value="">-- 단어장 선택 --</option>` },
    { id: "subjDeckSelect", defaultOpt: `<option value="">-- 단어장 선택 --</option>` }
  ];

  deckSelectConfigs.forEach(({ id, defaultOpt }) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prevVal = sel.value;
    sel.innerHTML =
      defaultOpt +
      state.decks
        .map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} (${d.wordIds.length})</option>`)
        .join("");
    if ([...sel.options].some((o) => o.value === prevVal)) {
      sel.value = prevVal;
    }
  });
}

// -------------------------------------------------------------------------
// 2. 단어장 탭 (기출 연도/분류 필터·정렬, 중복 기출, 품사 메모, 암기 상태, 다중 선택)
// -------------------------------------------------------------------------
function populateYearCategoryFilters() {
  const yearSet = new Set();
  VOCAB_DATA.forEach((v) => v.years.forEach((y) => yearSet.add(y)));
  const optionsHtml =
    `<option value="ALL">전체 연도·분류</option>` +
    Array.from(yearSet)
      .map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`)
      .join("");

  ["vocabYearCategoryFilter", "fcYearCategoryFilter", "quizYearCategorySelect"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = optionsHtml;
  });
}

function resetVocabFilters({ status = "ALL", favOnly = false, deckId = "ALL" } = {}) {
  const searchEl = document.getElementById("vocabSearchInput");
  const yearEl = document.getElementById("vocabYearCategoryFilter");
  const posEl = document.getElementById("vocabPosFilter");
  const statusEl = document.getElementById("vocabStatusFilter");
  const deckEl = document.getElementById("vocabDeckFilter");
  const favBtn = document.getElementById("vocabFavoritesOnlyBtn");

  if (searchEl) searchEl.value = "";
  if (yearEl) yearEl.value = "ALL";
  if (posEl) posEl.value = "ALL";
  if (statusEl) statusEl.value = status;
  if (deckEl) deckEl.value = favOnly ? "__FAV__" : deckId;

  favOnlyMode = Boolean(favOnly);
  vocabVisibleLimit = 36;
  if (favBtn) {
    favBtn.setAttribute("aria-pressed", String(favOnlyMode));
    favBtn.classList.toggle("is-active", favOnlyMode);
  }
  renderVocabList();
}

function matchesPosFilter(item, posFilter) {
  if (!posFilter || posFilter === "ALL") return true;
  const combined = `${item.pos || ""} ${StudyStore.getPosNote(item)}`;
  return combined.includes(posFilter);
}

function getFilteredVocab() {
  const q = (document.getElementById("vocabSearchInput")?.value || "").trim().toLowerCase();
  const yearVal = document.getElementById("vocabYearCategoryFilter")?.value || "ALL";
  const posVal = document.getElementById("vocabPosFilter")?.value || "ALL";
  const statusVal = document.getElementById("vocabStatusFilter")?.value || "ALL";
  const deckVal = document.getElementById("vocabDeckFilter")?.value || "ALL";
  const sortVal = document.getElementById("vocabSortSelect")?.value || "default";

  const state = StudyStore.getState();

  const filtered = VOCAB_DATA.filter((item) => {
    const memo = StudyStore.getPosNote(item).toLowerCase();
    const syn = (item.synonym || "").toLowerCase();

    const matchQuery =
      !q ||
      item.word.toLowerCase().includes(q) ||
      item.reading.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q) ||
      memo.includes(q) ||
      syn.includes(q);

    const matchYear = yearVal === "ALL" || item.years.includes(yearVal);
    const matchPos = matchesPosFilter(item, posVal);
    const matchStatus = statusVal === "ALL" || StudyStore.getStatus(item.id) === statusVal;

    let matchDeck = true;
    if (favOnlyMode || deckVal === "__FAV__") {
      matchDeck = StudyStore.isFavorite(item.id);
    } else if (deckVal && deckVal !== "ALL") {
      const deck = state.decks.find((d) => d.id === deckVal);
      matchDeck = deck ? deck.wordIds.includes(item.id) : true;
    }

    return matchQuery && matchYear && matchPos && matchStatus && matchDeck;
  });

  if (sortVal === "dupFirst") {
    filtered.sort((a, b) => Number(b.isDuplicate) - Number(a.isDuplicate));
  } else if (sortVal === "yearAsc") {
    filtered.sort((a, b) => a.years.join(",").localeCompare(b.years.join(","), "ko"));
  } else if (sortVal === "yearDesc") {
    filtered.sort((a, b) => b.years.join(",").localeCompare(a.years.join(","), "ko"));
  } else if (sortVal === "kanaAsc") {
    filtered.sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
  }

  return filtered;
}

function renderVocabList() {
  const container = document.getElementById("vocabListContainer");
  if (!container) return;

  const allMatched = getFilteredVocab();
  const visibleItems = allMatched.slice(0, vocabVisibleLimit);

  const countLabel = document.getElementById("vocabListCountLabel");
  if (countLabel) countLabel.textContent = `${visibleItems.length} / ${allMatched.length}개 단어`;

  const selectedCountEl = document.getElementById("vocabSelectedCount");
  if (selectedCountEl) selectedCountEl.textContent = String(selectedVocabIds.size);

  const loadMoreBtn = document.getElementById("vocabLoadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.hidden = allMatched.length <= vocabVisibleLimit;
  }

  if (!visibleItems.length) {
    container.innerHTML = `<div class="surface-card" style="grid-column:1/-1; text-align:center;"><p class="helper-note">조건에 일치하는 단어가 없습니다.</p></div>`;
    return;
  }

  container.innerHTML = visibleItems
    .map((item) => {
      const st = StudyStore.getStatus(item.id);
      const fav = StudyStore.isFavorite(item.id);
      const checked = selectedVocabIds.has(item.id);
      const posMemo = StudyStore.getPosNote(item);
      const kanaOnly = isKanaOnlyWord(item.word);

      return `
        <article class="vocab-card" data-vocab-id="${escapeHtml(item.id)}">
          <div class="vocab-card-top">
            <div class="vocab-card-meta">
              <input type="checkbox" class="vocab-row-chk" data-id="${escapeHtml(item.id)}" ${checked ? "checked" : ""} aria-label="${escapeHtml(item.word)} 선택" />
              <span class="badge ${item.isDuplicate ? "dup-badge" : ""}">${escapeHtml(item.duplicateLabel)}</span>
              ${item.synonym ? `<span class="badge syn-badge" lang="ja">≒ ${escapeHtml(item.synonym)}</span>` : ""}
            </div>
            <div class="card-actions-inline">
              <button type="button" class="icon-btn vocab-tts-btn" data-speak="${escapeHtml(item.word)}" title="단어 발음 재생">🔊</button>
              <button type="button" class="star-btn ${fav ? "is-active" : ""}" data-fav="${escapeHtml(item.id)}" aria-pressed="${fav}" title="즐겨찾기 토글">★</button>
            </div>
          </div>

          <div>
            <div class="vocab-reading maskable-reading" lang="ja" tabindex="0">${escapeHtml(item.reading)}</div>
            <div class="vocab-word" lang="ja" data-kana-only-headword="${kanaOnly}">${escapeHtml(item.word)}</div>
            <div class="vocab-meaning maskable-meaning" tabindex="0">${escapeHtml(item.meaning)}</div>
          </div>

          <div class="pos-memo-box">
            <div>
              <span class="badge pos-memo-badge">품사 메모</span>
              <span>${escapeHtml(posMemo)}</span>
            </div>
            <button type="button" class="mini-btn vocab-memo-edit-btn" data-id="${escapeHtml(item.id)}">편집</button>
          </div>

          <div class="pos-memo-editor" data-editor-id="${escapeHtml(item.id)}" hidden>
            <input type="text" class="text-input vocab-memo-input" value="${escapeHtml(posMemo)}" placeholder="품사·용법 메모 입력" />
            <div class="inline-controls">
              <button type="button" class="mini-btn vocab-memo-save-btn" data-id="${escapeHtml(item.id)}">저장</button>
              <button type="button" class="mini-btn vocab-memo-cancel-btn" data-id="${escapeHtml(item.id)}">취소</button>
            </div>
          </div>

          <div class="status-button-row">
            <button type="button" class="status-btn ${st === "known" ? "is-active" : ""}" data-status="known" data-id="${escapeHtml(item.id)}">외움</button>
            <button type="button" class="status-btn ${st === "unsure" ? "is-active" : ""}" data-status="unsure" data-id="${escapeHtml(item.id)}">헷갈림</button>
            <button type="button" class="status-btn ${st === "unknown" ? "is-active" : ""}" data-status="unknown" data-id="${escapeHtml(item.id)}">미암기</button>
          </div>
        </article>
      `;
    })
    .join("");

  container.querySelectorAll(".vocab-row-chk").forEach((chk) => {
    chk.addEventListener("change", () => {
      if (chk.checked) selectedVocabIds.add(chk.dataset.id);
      else selectedVocabIds.delete(chk.dataset.id);
      const countEl = document.getElementById("vocabSelectedCount");
      if (countEl) countEl.textContent = String(selectedVocabIds.size);
    });
  });

  container.querySelectorAll(".vocab-tts-btn").forEach((btn) => {
    btn.addEventListener("click", () => speakJapanese(btn.dataset.speak));
  });

  container.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      StudyStore.toggleFavorite(btn.dataset.fav);
      refreshAllStudyUI();
    });
  });

  container.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      StudyStore.setStatus(btn.dataset.id, btn.dataset.status);
      refreshAllStudyUI();
    });
  });

  container.querySelectorAll(".vocab-memo-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const editor = container.querySelector(`.pos-memo-editor[data-editor-id="${btn.dataset.id}"]`);
      if (editor) editor.hidden = !editor.hidden;
    });
  });

  container.querySelectorAll(".vocab-memo-cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const editor = container.querySelector(`.pos-memo-editor[data-editor-id="${btn.dataset.id}"]`);
      if (editor) editor.hidden = true;
    });
  });

  container.querySelectorAll(".vocab-memo-save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const editor = container.querySelector(`.pos-memo-editor[data-editor-id="${id}"]`);
      const input = editor?.querySelector(".vocab-memo-input");
      if (input) {
        StudyStore.setPosNote(id, input.value);
        renderVocabList();
      }
    });
  });
}

function saveSelectionToDeck(ids, deckId) {
  if (!ids.length) {
    alert("먼저 체크박스로 단어를 선택해 주세요.");
    return;
  }
  if (!deckId) {
    alert("저장할 커스텀 단어장을 선택해 주세요.");
    return;
  }
  const deck = StudyStore.addWordsToDeck(deckId, ids);
  if (deck) {
    renderCustomDecksAndSelects();
    alert(`"${deck.name}" 단어장에 ${ids.length}개 단어를 저장했습니다.`);
  }
}

// -------------------------------------------------------------------------
// 3. 플래시카드 탭 (셔플, 앞면 표기/읽기, 뒷면 품사·예문 1개, 토글, 다중 선택)
// -------------------------------------------------------------------------
function rebuildFlashcardPool(doShuffle = false) {
  const scope = document.getElementById("fcScopeFilter")?.value || "ALL";
  const year = document.getElementById("fcYearCategoryFilter")?.value || "ALL";
  const deckId = document.getElementById("fcDeckFilter")?.value || "";
  const state = StudyStore.getState();

  let pool = VOCAB_DATA.filter((item) => {
    if (year !== "ALL" && !item.years.includes(year)) return false;
    if (deckId) {
      const deck = state.decks.find((d) => d.id === deckId);
      if (deck && !deck.wordIds.includes(item.id)) return false;
    }
    if (scope === "FAV") return StudyStore.isFavorite(item.id);
    if (scope === "known" || scope === "unsure" || scope === "unknown") {
      return StudyStore.getStatus(item.id) === scope;
    }
    return true;
  });

  if (!pool.length) pool = [...VOCAB_DATA];
  if (doShuffle) pool = shuffleArray(pool);

  fcDeckPool = pool;
  fcCurrentIdx = 0;
  fcIsFlipped = false;
  renderFlashcard();
}

function renderFlashcard() {
  if (!fcDeckPool.length) rebuildFlashcardPool(false);
  const card = fcDeckPool[fcCurrentIdx];
  if (!card) return;

  const counterEl = document.getElementById("fcCounterLabel");
  if (counterEl) counterEl.textContent = `${fcCurrentIdx + 1} / ${fcDeckPool.length}`;

  const currentChk = document.getElementById("fcCurrentCheck");
  if (currentChk) currentChk.checked = selectedVocabIds.has(card.id);

  const cardEl = document.getElementById("flashcardCard");
  if (cardEl) cardEl.setAttribute("data-flipped", String(fcIsFlipped));

  const dupBadge = document.getElementById("fcDupBadge");
  if (dupBadge) {
    dupBadge.textContent = card.duplicateLabel;
    dupBadge.classList.toggle("dup-badge", card.isDuplicate);
  }

  const posBadge = document.getElementById("fcPosBadge");
  if (posBadge) posBadge.textContent = StudyStore.getPosNote(card);

  const favBtn = document.getElementById("fcFavBtn");
  const isFav = StudyStore.isFavorite(card.id);
  if (favBtn) {
    favBtn.classList.toggle("is-active", isFav);
    favBtn.setAttribute("aria-pressed", String(isFav));
  }

  // 앞면: 표기 / 읽기
  const frontFace = document.getElementById("fcFrontFace");
  const backFace = document.getElementById("fcBackFace");
  if (frontFace) frontFace.hidden = fcIsFlipped;
  if (backFace) backFace.hidden = !fcIsFlipped;

  const frontReading = document.getElementById("fcFrontReading");
  const frontWord = document.getElementById("fcFrontWord");
  const kanaOnly = isKanaOnlyWord(card.word);

  if (frontReading) {
    frontReading.textContent = card.reading;
    frontReading.classList.remove("is-revealed");
  }
  if (frontWord) {
    frontWord.textContent = card.word;
    frontWord.setAttribute("data-kana-only-headword", String(kanaOnly));
  }

  // 뒷면: 뜻, 품사 메모, 예문 1개(예문 읽기·해석 토글 및 전역 가림 연동)
  const backMeaning = document.getElementById("fcBackMeaning");
  const backPosMemo = document.getElementById("fcBackPosMemo");
  const backSub = backFace?.querySelector("[data-field='wordAndReading']");

  if (backMeaning) {
    backMeaning.textContent = card.meaning;
    backMeaning.classList.remove("is-revealed");
  }
  if (backPosMemo) backPosMemo.textContent = StudyStore.getPosNote(card);
  if (backSub) {
    backSub.textContent = `${card.word} (${card.reading})`;
    backSub.classList.remove("is-revealed");
  }

  const showExReading = document.getElementById("fcToggleExampleReadingChk")?.checked ?? true;
  const showExMeaning = document.getElementById("fcToggleExampleMeaningChk")?.checked ?? true;

  const exText = document.getElementById("fcExampleText");
  const exReading = document.getElementById("fcExampleReading");
  const exMeaning = document.getElementById("fcExampleMeaning");

  if (exText) exText.textContent = card.example || "";
  if (exReading) {
    exReading.textContent = card.exampleReading || "";
    exReading.hidden = !showExReading || !card.exampleReading;
    exReading.classList.remove("is-revealed");
  }
  if (exMeaning) {
    exMeaning.textContent = card.exampleMeaning || "";
    exMeaning.hidden = !showExMeaning || !card.exampleMeaning;
    exMeaning.classList.remove("is-revealed");
  }

  // 3단계 암기 상태 버튼 동기화
  const curStatus = StudyStore.getStatus(card.id);
  document.querySelectorAll("#fcStatusBar .status-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.status === curStatus);
  });
}

function flipCurrentFlashcard() {
  fcIsFlipped = !fcIsFlipped;
  renderFlashcard();
}

function moveFlashcard(delta) {
  if (!fcDeckPool.length) return;
  fcCurrentIdx = (fcCurrentIdx + delta + fcDeckPool.length) % fcDeckPool.length;
  fcIsFlipped = false;
  renderFlashcard();
}

function refreshAllStudyUI() {
  renderDashboard();
  renderVocabList();
  if (activeTabName === "flashcard") renderFlashcard();
  if (activeTabName === "wrongnote" && typeof renderWrongNote === "function") {
    renderWrongNote();
  }
}

// -------------------------------------------------------------------------
// 초기화 및 전역 이벤트 바인딩
// -------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  applyThemeAndMasks();
  setupMaskedItemRevealHandler();
  populateYearCategoryFilters();
  refreshAllStudyUI();

  // 상단 툴바: 전역 읽기/뜻 가림 토글
  document.getElementById("toggleGlobalReadingBtn")?.addEventListener("click", () => {
    const next = !StudyStore.getState().maskReading;
    StudyStore.setGlobalMask("reading", next);
    document.querySelectorAll(".maskable-reading.is-revealed").forEach((el) => el.classList.remove("is-revealed"));
    applyThemeAndMasks();
  });

  document.getElementById("toggleGlobalMeaningBtn")?.addEventListener("click", () => {
    const next = !StudyStore.getState().maskMeaning;
    StudyStore.setGlobalMask("meaning", next);
    document.querySelectorAll(".maskable-meaning.is-revealed").forEach((el) => el.classList.remove("is-revealed"));
    applyThemeAndMasks();
  });

  // 상단 툴바: 일본어 TTS 음성 속도 조절
  document.getElementById("ttsSpeedRange")?.addEventListener("input", (e) => {
    StudyStore.setTtsSpeed(e.target.value);
    applyThemeAndMasks();
  });

  // 상단 툴바: 라이트 / 다크 모드 전환
  document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
    const nextTheme = StudyStore.getState().theme === "dark" ? "light" : "dark";
    StudyStore.setTheme(nextTheme);
    applyThemeAndMasks();
  });

  // 상단 툴바: 단축키 안내 모달 및 데이터 관리 바로가기
  document.getElementById("openShortcutModalBtn")?.addEventListener("click", () => toggleShortcutModal(true));
  document.getElementById("closeShortcutModalBtn")?.addEventListener("click", () => toggleShortcutModal(false));
  document.getElementById("shortcutModal")?.addEventListener("click", (e) => {
    if (e.target.id === "shortcutModal") toggleShortcutModal(false);
  });

  document.getElementById("quickDataManageBtn")?.addEventListener("click", () => {
    switchTab("dashboard");
    document.getElementById("dataManagementSection")?.scrollIntoView({ behavior: "smooth" });
  });

  // 메인 7개 탭 내비게이션
  document.querySelectorAll("#mainTabNav .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // 대시보드 요약 카드 & 빠른 학습 이동
  document.querySelectorAll("#dashboardSummaryCards .stat-card, #dashboardQuickActions [data-jump-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.jumpTab;
      if (targetTab === "vocab") {
        resetVocabFilters({
          status: btn.dataset.filterStatus || "ALL",
          favOnly: btn.dataset.filterFav === "true"
        });
      }
      switchTab(targetTab);
    });
  });

  // 커스텀 단어장 생성
  document.getElementById("createDeckBtn")?.addEventListener("click", () => {
    const input = document.getElementById("newDeckNameInput");
    if (!input || !input.value.trim()) {
      alert("새 단어장 이름을 입력해 주세요.");
      return;
    }
    StudyStore.createDeck(input.value);
    input.value = "";
    renderCustomDecksAndSelects();
  });

  // 학습 데이터 JSON 백업 / 복원 / 초기화
  const dataStatusMsg = document.getElementById("dataStatusMessage");
  document.getElementById("exportBackupBtn")?.addEventListener("click", () => {
    StudyStore.exportJsonBackup();
    if (dataStatusMsg) dataStatusMsg.textContent = "학습 데이터 JSON 백업 파일을 다운로드했습니다.";
  });

  document.getElementById("importBackupBtn")?.addEventListener("click", () => {
    document.getElementById("importBackupFileInput")?.click();
  });

  document.getElementById("importBackupFileInput")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = StudyStore.importJsonBackup(String(reader.result || ""));
      if (res.ok) {
        applyThemeAndMasks();
        refreshAllStudyUI();
      }
      if (dataStatusMsg) dataStatusMsg.textContent = res.message;
      alert(res.message);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  });

  document.getElementById("resetAllDataBtn")?.addEventListener("click", () => {
    if (!confirm("모든 암기 상태, 즐겨찾기, 품사 메모, 커스텀 단어장, 오답 기록, 설정을 초기화하시겠습니까?")) {
      return;
    }
    StudyStore.resetAllData();
    selectedVocabIds.clear();
    applyThemeAndMasks();
    refreshAllStudyUI();
    if (dataStatusMsg) dataStatusMsg.textContent = "모든 학습 데이터가 초기 상태로 재설정되었습니다.";
  });

  // 단어장 필터·정렬·즐겨찾기 모아보기·다중 선택
  [
    "vocabSearchInput",
    "vocabYearCategoryFilter",
    "vocabPosFilter",
    "vocabStatusFilter",
    "vocabDeckFilter",
    "vocabSortSelect"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      vocabVisibleLimit = 36;
      renderVocabList();
    });
    el.addEventListener("change", () => {
      vocabVisibleLimit = 36;
      renderVocabList();
    });
  });

  document.getElementById("vocabFavoritesOnlyBtn")?.addEventListener("click", (e) => {
    favOnlyMode = !favOnlyMode;
    e.currentTarget.setAttribute("aria-pressed", String(favOnlyMode));
    e.currentTarget.classList.toggle("is-active", favOnlyMode);
    vocabVisibleLimit = 36;
    renderVocabList();
  });

  document.getElementById("vocabSelectAllChk")?.addEventListener("change", (e) => {
    const visible = getFilteredVocab().slice(0, vocabVisibleLimit);
    if (e.target.checked) visible.forEach((v) => selectedVocabIds.add(v.id));
    else visible.forEach((v) => selectedVocabIds.delete(v.id));
    renderVocabList();
  });

  document.getElementById("vocabSaveToDeckBtn")?.addEventListener("click", () => {
    const deckId = document.getElementById("vocabBatchDeckSelect")?.value || "";
    saveSelectionToDeck(Array.from(selectedVocabIds), deckId);
  });

  document.getElementById("vocabCreateDeckFromSelectedBtn")?.addEventListener("click", () => {
    const ids = Array.from(selectedVocabIds);
    if (!ids.length) {
      alert("먼저 체크박스로 단어를 선택해 주세요.");
      return;
    }
    const name = prompt("새로 만들 커스텀 단어장 이름을 입력하세요:");
    if (!name || !name.trim()) return;
    const deck = StudyStore.createDeck(name, ids);
    if (deck) {
      renderCustomDecksAndSelects();
      alert(`"${deck.name}" 단어장을 생성하고 ${ids.length}개 단어를 저장했습니다.`);
    }
  });

  document.getElementById("vocabLoadMoreBtn")?.addEventListener("click", () => {
    vocabVisibleLimit += 36;
    renderVocabList();
  });

  // 플래시카드 이벤트
  ["fcScopeFilter", "fcYearCategoryFilter", "fcDeckFilter"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => rebuildFlashcardPool(false));
  });

  ["fcToggleExampleReadingChk", "fcToggleExampleMeaningChk"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", renderFlashcard);
  });

  document.getElementById("fcShuffleBtn")?.addEventListener("click", () => rebuildFlashcardPool(true));
  document.getElementById("fcPrevBtn")?.addEventListener("click", () => moveFlashcard(-1));
  document.getElementById("fcNextBtn")?.addEventListener("click", () => moveFlashcard(1));
  document.getElementById("fcFlipBtn")?.addEventListener("click", flipCurrentFlashcard);

  document.getElementById("flashcardCard")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-stop-flip='true']")) return;
    flipCurrentFlashcard();
  });

  document.getElementById("fcSpeakWordBtn")?.addEventListener("click", () => {
    const card = fcDeckPool[fcCurrentIdx];
    if (card) speakJapanese(card.word);
  });

  document.getElementById("fcSpeakExampleBtn")?.addEventListener("click", () => {
    const card = fcDeckPool[fcCurrentIdx];
    if (card && card.example) speakJapanese(card.example);
  });

  document.getElementById("fcFavBtn")?.addEventListener("click", () => {
    const card = fcDeckPool[fcCurrentIdx];
    if (!card) return;
    StudyStore.toggleFavorite(card.id);
    refreshAllStudyUI();
  });

  document.querySelectorAll("#fcStatusBar .status-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = fcDeckPool[fcCurrentIdx];
      if (!card) return;
      StudyStore.setStatus(card.id, btn.dataset.status);
      refreshAllStudyUI();
    });
  });

  document.getElementById("fcCurrentCheck")?.addEventListener("change", (e) => {
    const card = fcDeckPool[fcCurrentIdx];
    if (!card) return;
    if (e.target.checked) selectedVocabIds.add(card.id);
    else selectedVocabIds.delete(card.id);
    const countEl = document.getElementById("vocabSelectedCount");
    if (countEl) countEl.textContent = String(selectedVocabIds.size);
  });

  document.getElementById("fcSaveDeckBtn")?.addEventListener("click", () => {
    const card = fcDeckPool[fcCurrentIdx];
    if (!card) return;
    const deckId = document.getElementById("fcDeckSelect")?.value || "";
    const ids = selectedVocabIds.size ? Array.from(selectedVocabIds) : [card.id];
    saveSelectionToDeck(ids, deckId);
  });

  document.getElementById("fcQuickNewDeckBtn")?.addEventListener("click", () => {
    const card = fcDeckPool[fcCurrentIdx];
    if (!card) return;
    const ids = selectedVocabIds.size ? Array.from(selectedVocabIds) : [card.id];
    const name = prompt("새 커스텀 단어장 이름을 입력하세요:");
    if (!name || !name.trim()) return;
    const deck = StudyStore.createDeck(name, ids);
    if (deck) {
      renderCustomDecksAndSelects();
      alert(`"${deck.name}" 단어장을 생성하고 ${ids.length}개 단어를 저장했습니다.`);
    }
  });

  // -----------------------------------------------------------------------
  // 전역 단축키 핸들러 (입력창 포커스 충돌 방지)
  // -----------------------------------------------------------------------
  document.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    const tag = activeEl ? activeEl.tagName.toLowerCase() : "";
    const isTypingField = ["input", "textarea", "select"].includes(tag) || activeEl?.isContentEditable;

    const shortcutModal = document.getElementById("shortcutModal");
    if (e.key === "Escape" && shortcutModal && !shortcutModal.hidden) {
      toggleShortcutModal(false);
      return;
    }

    if (isTypingField) return;

    if (e.key === "?") {
      e.preventDefault();
      toggleShortcutModal();
      return;
    }

    if (e.key === "/") {
      e.preventDefault();
      switchTab("vocab");
      setTimeout(() => document.getElementById("vocabSearchInput")?.focus(), 20);
      return;
    }

    const lowerKey = e.key.toLowerCase();

    // 전역 읽기 가림 토글 (H) / 전역 뜻 가림 토글 (M)
    if (lowerKey === "h") {
      e.preventDefault();
      document.getElementById("toggleGlobalReadingBtn")?.click();
      return;
    }
    if (lowerKey === "m") {
      e.preventDefault();
      document.getElementById("toggleGlobalMeaningBtn")?.click();
      return;
    }

    // 플래시카드 탭 단축키
    if (activeTabName === "flashcard" && fcDeckPool.length) {
      const card = fcDeckPool[fcCurrentIdx];
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        flipCurrentFlashcard();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveFlashcard(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveFlashcard(1);
      } else if (lowerKey === "r") {
        e.preventDefault();
        speakJapanese(card.word);
      } else if (lowerKey === "s") {
        e.preventDefault();
        StudyStore.toggleFavorite(card.id);
        refreshAllStudyUI();
      } else if (e.key === "1") {
        StudyStore.setStatus(card.id, "known");
        refreshAllStudyUI();
      } else if (e.key === "2") {
        StudyStore.setStatus(card.id, "unsure");
        refreshAllStudyUI();
      } else if (e.key === "3") {
        StudyStore.setStatus(card.id, "unknown");
        refreshAllStudyUI();
      }
      return;
    }

    // 퀴즈/주관식 진행 중 R 키 TTS 발음 재생
    if (lowerKey === "r") {
      if (activeTabName === "quiz" && typeof speakCurrentQuizWord === "function") {
        e.preventDefault();
        speakCurrentQuizWord();
      } else if (activeTabName === "subjective" && typeof speakCurrentSubjWord === "function") {
        e.preventDefault();
        speakCurrentSubjWord();
      }
    }
  });
});
