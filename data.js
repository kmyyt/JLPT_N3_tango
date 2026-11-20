// =========================================================================
// 2단계: 어휘 데이터, 중복 기출 연도 병합, localStorage 및 JSON 백업/초기화
// =========================================================================
const RAW_VOCAB_ITEMS = [
  // 기출어휘: 한자읽기 / 표기 / 문맥구성 / 유의표현 / 용법
  { word: "選手", reading: "せんしゅ", meaning: "선수", pos: "명사", years: ["2025년 기출(한자읽기)"], example: "新しい選手がチームに入りました。", exampleReading: "あたらしいせんしゅがちーむにはいりました。", exampleMeaning: "새로운 선수가 팀에 들어왔습니다." },
  { word: "未来", reading: "みらい", meaning: "미래", pos: "명사", years: ["2025년 기출(한자읽기)", "2010년 기출(용법)"], example: "未来には人間は月に住むようになるかもしれない。", exampleReading: "みらいにはにんげんはつきにすむようになるかもしれない。", exampleMeaning: "미래에는 인간이 달에 살게 될지도 모릅니다." },
  { word: "印象", reading: "いんしょう", meaning: "인상", pos: "명사", years: ["2025년 기출(한자읽기)", "2025년 기출(표기)"], example: "彼の明るい笑顔が印象に残った。", exampleReading: "かれのあかるいえがおがいんしょうにのこった。", exampleMeaning: "그의 밝은 미소가 인상에 남았습니다." },
  { word: "逃げる", reading: "にげる", meaning: "도망치다, 피하다", pos: "동사(일어·자동사)", years: ["2025년 기출(한자읽기)", "확인문제 15(표기)"], example: "安全な場所へ逃げてください。", exampleReading: "あんぜんなばしょへにげてください。", exampleMeaning: "안전한 곳으로 도망쳐 주세요." },
  { word: "焼く", reading: "やく", meaning: "굽다, 태우다", pos: "동사(오단·타동사)", years: ["2025년 기출(한자읽기)"], example: "パンを焼いて朝ごはんを食べます。", exampleReading: "ぱんをやいてあさごはんをたべます。", exampleMeaning: "빵을 구워서 아침밥을 먹습니다." },
  { word: "解く", reading: "とく", meaning: "풀다(문제·매듭 등)", pos: "동사(오단·타동사)", years: ["2025년 기출(한자읽기)", "2020년 기출(표기)"], example: "靴ひもを解いて靴を脱いだ。", exampleReading: "くつひもをといてくつをぬいだ。", exampleMeaning: "신발끈을 풀고 신발을 벗었습니다." },
  { word: "過去", reading: "かこ", meaning: "과거", pos: "명사", years: ["2020년 기출(한자읽기)", "2025년 기출(표기)"], example: "過去のデータをグラフにまとめた。", exampleReading: "かこのでーたをぐらふにまとめた。", exampleMeaning: "과거 데이터를 그래프로 정리했습니다." },
  { word: "薬局", reading: "やっきょく", meaning: "약국", pos: "명사", years: ["확인문제 04(한자읽기)"], example: "帰りに駅前の薬局で薬を買った。", exampleReading: "かえりにえきまえのやっきょくでくすりをかった。", exampleMeaning: "돌아오는 길에 역 앞 약국에서 약을 샀습니다." },
  { word: "申し込み", reading: "もうしこみ", meaning: "신청, 등록", pos: "명사·동사", years: ["2025년 기출(표기)"], example: "イベントの申し込みは来週までです。", exampleReading: "いべんとのもうしこみはらいしゅうまでです。", exampleMeaning: "이벤트 신청은 다음 주까지입니다." },
  { word: "集中", reading: "しゅうちゅう", meaning: "집중", pos: "명사·동사", years: ["2025년 기출(표기)"], example: "静かな部屋で勉強に集中した。", exampleReading: "しずかなへやでべんきょうにしゅうちゅうした。", exampleMeaning: "조용한 방에서 공부에 집중했습니다." },
  { word: "預ける", reading: "あずける", meaning: "맡기다", pos: "동사(일어·타동사)", years: ["2020년 기출(표기)"], example: "駅のロッカーに荷物を預けた。", exampleReading: "えきのろっかーににもつをあずけた。", exampleMeaning: "역 사물함에 짐을 맡겼습니다." },
  { word: "重ねて", reading: "かさねて", meaning: "겹쳐서, 거듭", pos: "동사(일어·타동사)", years: ["2020년 기출(표기)", "확인문제 36(문맥구성)"], example: "お皿を二枚重ねて棚にしまった。", exampleReading: "おさらをにまいにかさねてたなにしまった。", exampleMeaning: "접시를 두 장 겹쳐서 선반에 넣었습니다." },
  { word: "案外", reading: "あんがい", meaning: "의외로", pos: "부사·な형용사", years: ["2025년 기출(문맥구성)"], example: "テストは難しそうだったが、案外簡単だった。", exampleReading: "てすとはむずかしそうだったが、あんがいかんたんだった。", exampleMeaning: "시험은 어려워 보였지만 의외로 쉬웠습니다." },
  { word: "くやしい", reading: "くやしい", meaning: "분하다, 억울하다", pos: "い형용사", years: ["2025년 기출(문맥구성)"], example: "あと少しで勝てたのに負けてくやしい。", exampleReading: "あとすこしでかてたのにまけてくやしい。", exampleMeaning: "조금만 더 하면 이길 수 있었는데 져서 분합니다." },
  { word: "うろうろ", reading: "うろうろ", meaning: "어슬렁어슬렁, 서성거리다", pos: "부사", years: ["2024년 기출(문맥구성)"], example: "駅の前で迷ったのか、うろうろしている人がいる。", exampleReading: "えきのまえでまよったのか、うろうろしているひとがいる。", exampleMeaning: "역 앞에서 길을 잃었는지 서성거리는 사람이 있습니다." },
  { word: "ぴったり", reading: "ぴったり", meaning: "딱 맞음", pos: "부사", years: ["2020년 기출(문맥구성)"], example: "この靴は私の足にぴったりだ。", exampleReading: "このくつはわたしのあしにぴったりだ。", exampleMeaning: "이 신발은 내 발에 딱 맞습니다." },
  { word: "ぐっすり", reading: "ぐっすり", meaning: "푹, 깊이", pos: "부사", years: ["확인문제 22(문맥구성)", "2024년 기출(용법)"], example: "昨日は疲れていたのでぐっすり眠れた。", exampleReading: "きのうはつかれていたのでぐっすりねむれた。", exampleMeaning: "어제는 피곤해서 푹 잘 수 있었습니다." },
  { word: "そっくり", reading: "そっくり", meaning: "쏙 빼닮음, 그대로", pos: "부사·な형용사", years: ["확인문제 21(문맥구성)", "2010년 기출(용법)"], example: "彼は父親に顔も声もそっくりだ。", exampleReading: "かれはちちおやにかおもこえもそっくりだ。", exampleMeaning: "그는 아버지와 얼굴도 목소리도 똑같습니다." },
  { word: "さまざまな", reading: "さまざまな", meaning: "다양한, 여러 가지의", pos: "관용·표현", synonym: "いろいろな", years: ["2021년 기출(유의표현)"], example: "会場にはさまざまな国の人が集まっている。", exampleReading: "かいじょうにはさまざまなぐにのひとがあつまっている。", exampleMeaning: "행사장에는 다양한 나라 사람들이 모여 있습니다." },
  { word: "そっと", reading: "そっと", meaning: "살며시, 조용히", pos: "부사", synonym: "静かに", years: ["2021년 기출(유의표현)"], example: "赤ちゃんを起こさないように、そっと部屋を出た。", exampleReading: "あかちゃんをおこさないように、そっとへやをでた。", exampleMeaning: "아기가 깨지 않도록 살며시 방을 나왔습니다." },
  { word: "ようやく", reading: "ようやく", meaning: "겨우, 마침내", pos: "부사", synonym: "やっと", years: ["확인문제 40(유의표현)"], example: "長い練習の末、ようやく大会に出られるようになった。", exampleReading: "ながいれんしゅうのすえ、ようやくたいかいにでられるようになった。", exampleMeaning: "긴 연습 끝에 겨우 대회에 나갈 수 있게 되었습니다." },
  { word: "落ち着く", reading: "おちつく", meaning: "진정되다, 차분해지다", pos: "동사(오단·자동사)", years: ["2024년 기출(용법)"], example: "深呼吸をして気持ちを落ち着かせた。", exampleReading: "しんこきゅうをしてきもちをおちつかせた。", exampleMeaning: "심호흡을 하고 마음을 진정시켰습니다." },
  { word: "身につける", reading: "みにつける", meaning: "익히다, 몸에 붙이다", pos: "동사(일어·타동사)", years: ["2010년 기출(용법)"], example: "毎日練習して英会話の力を身につけた。", exampleReading: "まいにちれんしゅうしてえいかいわのちからをみにつけた。", exampleMeaning: "매일 연습해서 영어 회화 실력을 익혔습니다." },

  // 예상어휘: 명사 · 동사 · い/な형용사 · 부사 · 외래어 · 접사 · 관용/접속/문법/청해
  { word: "打ち合わせ", reading: "うちあわせ", meaning: "사전 협의, 미팅", pos: "명사", years: ["예상어휘(명사)"], example: "発表の前にメンバーと打ち合わせをした。", exampleReading: "はっぴょうのまえにめんばーとうちあわせをした。", exampleMeaning: "발표 전에 멤버들과 사전 협의를 했습니다." },
  { word: "きっかけ", reading: "きっかけ", meaning: "계기, 실마리", pos: "명사", years: ["예상어휘(명사)", "예상어휘 확인문제"], example: "旅行がきっかけで日本語を勉強し始めた。", exampleReading: "りょこうがきっかけでにほんごをべんきょうしはじめた。", exampleMeaning: "여행이 계기가 되어 일본어를 공부하기 시작했습니다." },
  { word: "受かる", reading: "うかる", meaning: "합격하다", pos: "동사(오단·자동사)", years: ["예상어휘(동사)"], example: "努力したおかげで試験に受かった。", exampleReading: "どりょくしたおかげでしけんにうかった。", exampleMeaning: "노력한 덕분에 시험에 합격했습니다." },
  { word: "取り入れる", reading: "とりいれる", meaning: "받아들이다, 도입하다", pos: "동사(일어·타동사)", years: ["예상어휘(동사)"], example: "生活の中に軽い運動を取り入れている。", exampleReading: "せいかつのなかにかるいうんどうをとりいれている。", exampleMeaning: "생활 속에 가벼운 운동을 도입하고 있습니다." },
  { word: "ありがたい", reading: "ありがたい", meaning: "고맙다, 감사하다", pos: "い형용사", years: ["예상어휘(い형용사)"], example: "忙しいのに手伝ってもらって本当にありがたい。", exampleReading: "いそがしいのにてつだってもらってほんとうにありがたい。", exampleMeaning: "바쁜데 도와줘서 정말 고맙습니다." },
  { word: "とんでもない", reading: "とんでもない", meaning: "말도 안 되다, 천만에", pos: "い형용사", years: ["예상어휘(い형용사)", "예상어휘 확인문제"], example: "「お礼なんて」「とんでもない、当たり前のことです」", exampleReading: "「おれいなんて」「とんでもない、あたりまえのことです」", exampleMeaning: "“감사 인사는요.” “천만에요, 당연한 일입니다.”" },
  { word: "あたりまえだ", reading: "あたりまえだ", meaning: "당연하다", pos: "な형용사", years: ["예상어휘(な형용사)", "예상어휘 확인문제"], example: "約束を守ることはあたりまえだ。", exampleReading: "やくそくをまもることはあたりまえだ。", exampleMeaning: "약속을 지키는 것은 당연합니다." },
  { word: "いよいよ", reading: "いよいよ", meaning: "드디어, 마침내", pos: "부사", years: ["예상어휘(부사)"], example: "明日はいよいよ試験本番だ。", exampleReading: "あしたはいよいよしけんほんばんだ。", exampleMeaning: "내일은 드디어 시험 당일입니다." },
  { word: "せっかく", reading: "せっかく", meaning: "모처럼, 애써", pos: "부사", years: ["예상어휘(부사)"], example: "せっかく作った料理だから冷めないうちに食べよう。", exampleReading: "せっかくつくったりょうりだからさめないうちにたべよう。", exampleMeaning: "모처럼 만든 요리니까 식기 전에 먹읍시다." },
  { word: "スケジュール", reading: "すけじゅーる", meaning: "스케줄, 일정", pos: "외래어", years: ["2022년 기출(유의표현)", "예상어휘(외래어)"], example: "旅行のスケジュールをみんなで決めた。", exampleReading: "りょこうのすけじゅーるをみんなできめた。", exampleMeaning: "여행 일정을 다 같이 정했습니다." },
  { word: "〜割引", reading: "〜わりびき", meaning: "~할인", pos: "접사·접미어", years: ["예상어휘(접미어)"], example: "学生証を見せると入場料が二割引になります。", exampleReading: "がくせいしょうをみせるとにゅうじょうりょうがにわりびきになります。", exampleMeaning: "학생증을 보여 주면 입장료가 2할인됩니다." },
  { word: "したがって", reading: "したがって", meaning: "따라서, 그러므로", pos: "관용·접속·표현", years: ["예상어휘(접속사)"], example: "雨が降った。したがって、運動会は延期になった。", exampleReading: "あめがふった。したがって、うんどうかいはえんきになった。", exampleMeaning: "비가 내렸다. 따라서 운동회는 연기되었습니다." },
  { word: "〜うちに", reading: "〜うちに", meaning: "~하는 동안에", pos: "관용·접속·표현", years: ["문법 파트 핵심"], example: "熱いうちにスープを飲んでください。", exampleReading: "あついうちにすーぷをのんでください。", exampleMeaning: "뜨거울 때 수프를 드세요." },
  { word: "〜てしまう", reading: "〜てしまう", meaning: "~해 버리다", pos: "관용·접속·표현", years: ["문법 파트 핵심", "청해 구어 축약(~ちゃう)"], example: "宿題を忘れてしまった。", exampleReading: "しゅくだいをわすれてしまった。", exampleMeaning: "숙제를 잊어버렸습니다." },
  { word: "公共交通機関", reading: "こうきょうこうつうきかん", meaning: "대중교통기관", pos: "명사", years: ["독해 소재 어휘", "예상어휘 확인문제"], example: "会場へは公共交通機関を利用してください。", exampleReading: "かいじょうへはこうきょうこうつうきかんをりようしてください。", exampleMeaning: "행사장에는 대중교통을 이용해 주세요." }
];

function mergeVocabEntries(rawList) {
  const map = new Map();
  rawList.forEach((item, index) => {
    const key = `${item.word}__${item.reading}`;
    if (!map.has(key)) {
      map.set(key, {
        id: `vocab_${index + 1}`,
        word: item.word,
        reading: item.reading,
        meaning: item.meaning,
        pos: item.pos,
        synonym: item.synonym || "",
        years: [...item.years],
        example: item.example,
        exampleReading: item.exampleReading,
        exampleMeaning: item.exampleMeaning
      });
    } else {
      const existing = map.get(key);
      item.years.forEach((yr) => {
        if (!existing.years.includes(yr)) {
          existing.years.push(yr);
        }
      });
      if (!existing.synonym && item.synonym) {
        existing.synonym = item.synonym;
      }
    }
  });

  return Array.from(map.values()).map((entry) => {
    const isDuplicate = entry.years.length > 1;
    const duplicateLabel = isDuplicate
      ? `${entry.years.join("·")} 중복 기출`
      : entry.years[0];
    return {
      ...entry,
      isDuplicate,
      duplicateLabel
    };
  });
}

const VOCAB_DATA = mergeVocabEntries(RAW_VOCAB_ITEMS);

const STORAGE_KEY = "jlpt_n3_study_state_v1";

function createDefaultState() {
  return {
    theme: "light",
    ttsSpeed: 0.95,
    statusMap: {},     // id -> "known" | "unsure" | "unknown"
    favorites: [],     // array of id
    posNotes: {},      // id -> custom pos note
    decks: [],         // [{ id, name, wordIds: [] }]
    wrongLog: {}       // id -> { count, lastMode, lastInput, lastAt }
  };
}

let appState = loadAppState();

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return { ...createDefaultState(), ...JSON.parse(raw) };
  } catch (err) {
    return createDefaultState();
  }
}

function saveAppState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function exportAppStateJson() {
  const jsonStr = JSON.stringify(appState, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jlpt-n3-vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importAppStateJsonText(jsonText) {
  const parsed = JSON.parse(jsonText);
  appState = { ...createDefaultState(), ...parsed };
  saveAppState();
  return appState;
}

function resetAppStateData() {
  appState = createDefaultState();
  saveAppState();
  return appState;
}