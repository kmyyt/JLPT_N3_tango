// =========================================================================
// 3단계: data.js — 어휘 데이터, 중복 기출 병합, 히라가나 판별, 저장/백업/복원
// - index.html 및 style.css와 연동되는 전역 데이터·스토어 모듈
// =========================================================================

/**
 * 확인문제 섹션(기출어휘/예상어휘 확인문제)을 제외하고,
 * 년도별 기출(한자읽기·표기·문맥구성·유의표현·용법) 및
 * 2장 예상 어휘공략하기(명사·동사·い/な형용사·부사·외래어·유의어 등)를 중심으로 구성한 샘플 어휘 목록
 * (스캔 표기 오류 薬局(やっきょく) 등은 표준 신자체·현대 가나 표기로 정규화)
 */
const RAW_VOCAB_ITEMS = [
  // [2025년 기출]
  {
    word: "選手",
    reading: "せんしゅ",
    meaning: "선수",
    pos: "명사",
    years: ["2025년 기출(한자읽기)"],
    example: "新しい選手がチームに入りました。",
    exampleReading: "あたらしいせんしゅがちーむにはいりました。",
    exampleMeaning: "새로운 선수가 팀에 들어왔습니다."
  },
  {
    word: "未来",
    reading: "みらい",
    meaning: "미래",
    pos: "명사",
    years: ["2025년 기출(한자읽기)", "2010년 기출(용법)"],
    example: "未来には人間は月に住むようになるかもしれない。",
    exampleReading: "みらいにはにんげんはつきにすむようになるかもしれない。",
    exampleMeaning: "미래에는 인간이 달에 살게 될지도 모릅니다."
  },
  {
    word: "印象",
    reading: "いんしょう",
    meaning: "인상",
    pos: "명사",
    years: ["2025년 기출(한자읽기)"],
    example: "彼の明るい笑顔が印象に残った。",
    exampleReading: "かれのあかるいえがおがいんしょうにのこった。",
    exampleMeaning: "그의 밝은 미소가 인상에 남았습니다."
  },
  {
    word: "逃げる",
    reading: "にげる",
    meaning: "도망치다, 피하다",
    pos: "동사(일어·자동사)",
    years: ["2025년 기출(한자읽기)"],
    example: "安全な場所へ逃げてください。",
    exampleReading: "あんぜんなばしょへにげてください。",
    exampleMeaning: "안전한 곳으로 도망쳐 주세요."
  },
  {
    word: "焼く",
    reading: "やく",
    meaning: "굽다, 태우다",
    pos: "동사(오단·타동사)",
    years: ["2025년 기출(한자읽기)"],
    example: "パンを焼いて朝ごはんを食べます。",
    exampleReading: "ぱんをやいてあさごはんをたべます。",
    exampleMeaning: "빵을 구워서 아침밥을 먹습니다."
  },
  {
    word: "解く",
    reading: "とく",
    meaning: "풀다(문제·매듭 등)",
    pos: "동사(오단·타동사)",
    years: ["2025년 기출(한자읽기)"],
    example: "靴ひもを解いて靴を脱いだ。",
    exampleReading: "くつひもをといてくつをぬいだ。",
    exampleMeaning: "신발끈을 풀고 신발을 벗었습니다."
  },
  {
    word: "負ける",
    reading: "まける",
    meaning: "지다, 패배하다",
    pos: "동사(일어·자동사)",
    years: ["2025년 기출(한자읽기)"],
    example: "最後の試合で惜しくも負けてしまった。",
    exampleReading: "さいごのしあいでおしくもまけてしまった。",
    exampleMeaning: "마지막 시합에서 아쉽게도 져 버렸습니다."
  },
  {
    word: "通知",
    reading: "つうち",
    meaning: "통지, 알림",
    pos: "명사·동사",
    years: ["2025년 기출(한자읽기)"],
    example: "合格の通知がメールで届いた。",
    exampleReading: "ごうかくのつうちがめーるでとどいた。",
    exampleMeaning: "합격 통지가 메일로 도착했습니다."
  },
  {
    word: "退院",
    reading: "たいいん",
    meaning: "퇴원",
    pos: "명사·동사",
    years: ["2025년 기출(한자읽기)"],
    example: "祖父は来週の月曜日に退院する予定だ。",
    exampleReading: "そふはらいしゅうのげつようびにかいんするよていだ。",
    exampleMeaning: "할아버지는 다음 주 월요일에 퇴원하실 예정입니다."
  },
  {
    word: "産業",
    reading: "さんぎょう",
    meaning: "산업",
    pos: "명사",
    years: ["2025년 기출(한자읽기)"],
    example: "この地域は観光産業が盛んだ。",
    exampleReading: "このちいきはかんこうさんぎょうがさかんだ。",
    exampleMeaning: "이 지역은 관광 산업이 활발합니다."
  },
  {
    word: "アナウンス",
    reading: "あなうーんす",
    meaning: "아나운스, 안내 방송",
    pos: "명사·외래어",
    years: ["2025년 기출(문맥구성)"],
    example: "駅のアナウンスをよく聞いて電車に乗った。",
    exampleReading: "えきのあなうーんすをよくきいてでんしゃにのった。",
    exampleMeaning: "역 안내 방송을 잘 듣고 전철에 탔습니다."
  },
  {
    word: "案外",
    reading: "あんがい",
    meaning: "의외로, 생각보다",
    pos: "부사·な형용사",
    years: ["2025년 기출(문맥구성)"],
    example: "テストは難しそうだったが、案外簡単だった。",
    exampleReading: "てすとはむずかしそうだったが、あんがいかんたんだった。",
    exampleMeaning: "시험은 어려워 보였지만 의외로 쉬웠습니다."
  },
  {
    word: "くやしい",
    reading: "くやしい",
    meaning: "분하다, 억울하다",
    pos: "い형용사",
    years: ["2025년 기출(문맥구성)"],
    example: "あと少しで勝てたのに負けてくやしい。",
    exampleReading: "あとすこしでかてたのにまけてくやしい。",
    exampleMeaning: "조금만 더 하면 이길 수 있었는데 져서 분합니다."
  },
  {
    word: "しかたない",
    reading: "しかたない",
    meaning: "어쩔 수 없다, 할 수 없다",
    pos: "관용·표현",
    years: ["2025년 기출(문맥구성)"],
    example: "雨が降ってきたから、今日は散歩をあきらめるしかたない。",
    exampleReading: "あめがふってきたから、きょうはさんぽをあきらめるしかたない。",
    exampleMeaning: "비가 오기 시작했으니 오늘은 산책을 포기할 수밖에 없습니다."
  },
  {
    word: "リスト",
    reading: "りすと",
    meaning: "리스트, 목록",
    pos: "명사·외래어",
    years: ["2025년 기출(문맥구성)"],
    example: "買い物に行く前に必要なものリストを作った。",
    exampleReading: "かいものにいくまえにひつようなものりすとをつくった。",
    exampleMeaning: "장 보러 가기 전에 필요한 물건 목록을 만들었습니다."
  },
  {
    word: "オーダー",
    reading: "おーだー",
    meaning: "주문, 오더",
    pos: "명사·동사·외래어",
    years: ["2025년 기출(용법)", "예상어휘(외래어)"],
    example: "カフェでコーヒーとケーキをオーダーした。",
    exampleReading: "かふぇでこーひーとけーきをおーだーした。",
    exampleMeaning: "카페에서 커피와 케이크를 주문했습니다."
  },
  {
    word: "なつかしい",
    reading: "なつかしい",
    meaning: "그립다, 정겹다",
    pos: "い형용사",
    years: ["2025년 기출(용법)", "2010년 기출(문맥구성)"],
    example: "卒業アルバムを見て、高校時代がなつかしくなった。",
    exampleReading: "そつぎょうあるばむをみて、こうこうじだいがなつかしくなった。",
    exampleMeaning: "졸업 앨범을 보고 고등학교 시절이 그리워졌습니다."
  },
  {
    word: "ばらばら",
    reading: "ばらばら",
    meaning: "제각각, 흩어짐, 산산조각",
    pos: "부사·な형용사",
    years: ["2025년 기출(용법)", "예상어휘(부사)"],
    example: "意見がばらばらなので、もう一度話し合おう。",
    exampleReading: "いけんがばらばらなので、もういちどはなしあおう。",
    exampleMeaning: "의견이 제각각이니 한 번 더 이야기해 봅시다."
  },
  {
    word: "変化",
    reading: "へんか",
    meaning: "변화",
    pos: "명사·동사",
    years: ["2025년 기출(용법)"],
    example: "季節の変化に合わせて服装を変える。",
    exampleReading: "きせつのへんかにあわせてふくそうをかえる。",
    exampleMeaning: "계절 변화에 맞춰 옷차림을 바꿉니다."
  },

  // [2024년 기출]
  {
    word: "あきらめる",
    reading: "あきらめる",
    meaning: "포기하다, 단념하다",
    pos: "동사(일어·타동사)",
    years: ["2024년 기출(문맥구성)"],
    example: "最後まであきらめないで挑戦し続けよう。",
    exampleReading: "さいごまであきらめないでちょうせんしつづけよう。",
    exampleMeaning: "끝까지 포기하지 말고 계속 도전합시다."
  },
  {
    word: "アクセス",
    reading: "あくせす",
    meaning: "액세스, 접속, 교통 접근",
    pos: "명사·동사·외래어",
    years: ["2024년 기출(문맥구성)"],
    example: "このホテルは駅からアクセスがよい。",
    exampleReading: "このほてるはえきからあくせすがよい。",
    exampleMeaning: "이 호텔은 역에서 접근성이 좋습니다."
  },
  {
    word: "あせ",
    reading: "あせ",
    meaning: "땀",
    pos: "명사",
    years: ["2024년 기출(문맥구성)"],
    example: "走ったあとで額のあせをタオルでふいた。",
    exampleReading: "はしったあとでひたいのあせをたおるでふいた。",
    exampleMeaning: "달린 뒤에 이마의 땀을 수건으로 닦았습니다."
  },
  {
    word: "あやしい",
    reading: "あやしい",
    meaning: "수상하다, 의심스럽다, 흐리멍텅하다",
    pos: "い형용사",
    years: ["2024년 기출(문맥구성)"],
    example: "暗くなってきたので、午後の天気があやしい。",
    exampleReading: "くらくなってきたので、ごごのてんきがあやしい。",
    exampleMeaning: "어두워지기 시작했으니 오후 날씨가 수상합니다."
  },
  {
    word: "うらやましい",
    reading: "うらやましい",
    meaning: "부럽다",
    pos: "い형용사",
    years: ["2024년 기출(문맥구성)"],
    example: "夏休みに海外旅行に行けるなんてうらやましい。",
    exampleReading: "なつやすみにかいがいりょこうにいけるなんてうらやましい。",
    exampleMeaning: "여름방학에 해외여행을 갈 수 있다니 부럽습니다."
  },
  {
    word: "うろうろ",
    reading: "うろうろ",
    meaning: "어슬렁어슬렁, 서성거리다",
    pos: "부사",
    years: ["2024년 기출(문맥구성)"],
    example: "駅の前で迷ったのか、うろうろしている人がいる。",
    exampleReading: "えきのまえでまよったのか、うろうろしているひとがいる。",
    exampleMeaning: "역 앞에서 길을 잃었는지 서성거리는 사람이 있습니다."
  },
  {
    word: "禁止",
    reading: "きんし",
    meaning: "금지",
    pos: "명사·동사",
    years: ["2024년 기출(문맥구성)"],
    example: "このエリアでの写真撮影は禁止されている。",
    exampleReading: "このえりあでのしゃしんさつえいはきんしされている。",
    exampleMeaning: "이 구역에서의 사진 촬영은 금지되어 있습니다."
  },
  {
    word: "覚める",
    reading: "さめる",
    meaning: "잠이 깨다",
    pos: "동사(일어·자동사)",
    years: ["2024년 기출(문맥구성)"],
    example: "目覚まし時計が鳴る前に目が覚めた。",
    exampleReading: "めざましどけいがなるまえにめがさめた。",
    exampleMeaning: "자명종이 울리기 전에 눈이 떠졌습니다."
  },
  {
    word: "取り出す",
    reading: "とりだす",
    meaning: "꺼내다",
    pos: "동사(오단·타동사)",
    years: ["2024년 기출(문맥구성)"],
    example: "かばんから財布を取り出して代金を払った。",
    exampleReading: "かばんからさいふをとりだしてだいきんをはらった。",
    exampleMeaning: "가방에서 지갑을 꺼내 대금을 지불했습니다."
  },
  {
    word: "マイク",
    reading: "まいく",
    meaning: "마이크",
    pos: "명사·외래어",
    years: ["2024년 기출(문맥구성)"],
    example: "後ろの席まで聞こえるようにマイクを使った。",
    exampleReading: "うしろのせきまできこえるようにまいくをつかった。",
    exampleMeaning: "뒷좌석까지 들리도록 마이크를 사용했습니다."
  },
  {
    word: "もったいない",
    reading: "もったいない",
    meaning: "아깝다",
    pos: "い형용사",
    years: ["2024년 기출(문맥구성)"],
    example: "まだ食べられるのに捨てるのはもったいない。",
    exampleReading: "まだたべられるのにすてるのはもったいない。",
    exampleMeaning: "아직 먹을 수 있는데 버리는 것은 아깝습니다."
  },
  {
    word: "落ち着く",
    reading: "おちつく",
    meaning: "진정되다, 차분해지다, 자리 잡다",
    pos: "동사(오단·자동사)",
    years: ["2024년 기출(용법)"],
    example: "深呼吸をして気持ちを落ち着かせた。",
    exampleReading: "しんこきゅうをしてきもちをおちつかせた。",
    exampleMeaning: "심호흡을 하고 마음을 진정시켰습니다."
  },
  {
    word: "活動",
    reading: "かつどう",
    meaning: "활동",
    pos: "명사·동사",
    years: ["2024년 기출(용법)"],
    example: "大学ではボランティア活動に参加している。",
    exampleReading: "だいがくではぼらんてぃあかつどうにさんかしている。",
    exampleMeaning: "대학에서는 봉사 활동에 참가하고 있습니다."
  },
  {
    word: "ひびく",
    reading: "ひびく",
    meaning: "울리다, 영향을 미치다",
    pos: "동사(오단·자동사)",
    years: ["2024년 기출(용법)"],
    example: "ホールにきれいなピアノの音がひびいた。",
    exampleReading: "ほーるにきれいなぴあのおとがひびいた。",
    exampleMeaning: "홀에 아름다운 피아노 소리가 울려 퍼졌습니다."
  },
  {
    word: "ぐっすり",
    reading: "ぐっすり",
    meaning: "푹, 깊이",
    pos: "부사",
    years: ["2024년 기출(용법)"],
    example: "昨日はよく歩いたのでぐっすり眠れた。",
    exampleReading: "きのうはよくあるいたのでぐっすりねむれた。",
    exampleMeaning: "어제는 많이 걸어서 푹 잘 수 있었습니다."
  },
  {
    word: "実物",
    reading: "じつぶつ",
    meaning: "실물",
    pos: "명사",
    years: ["2024년 기출(용법)"],
    example: "写真で見るより実物のほうがずっと大きい。",
    exampleReading: "しゃしんでみるよりじつぶつのほうがずっとおおきい。",
    exampleMeaning: "사진으로 보는 것보다 실물이 훨씬 큽니다."
  },
  {
    word: "内容",
    reading: "ないよう",
    meaning: "내용",
    pos: "명사",
    years: ["2024년 기출(용법)"],
    example: "会議の内容をメモに記録した。",
    exampleReading: "かいぎのないようをめもにきろくした。",
    exampleMeaning: "회의 내용을 메모에 기록했습니다."
  },
  {
    word: "にこにこ",
    reading: "にこにこ",
    meaning: "방긋방긋, 생긋생긋",
    pos: "부사",
    years: ["2024년 기출(용법)"],
    example: "赤ちゃんがにこにこ笑いながらこちらを見た。",
    exampleReading: "あかちゃんがおにこにこわらいながらこちらをみた。",
    exampleMeaning: "아기가 방긋방긋 웃으며 이쪽을 보았습니다."
  },
  {
    word: "話しかける",
    reading: "はなしかける",
    meaning: "말을 걸다",
    pos: "동사(일어·타동사)",
    years: ["2024년 기출(용법)"],
    example: "隣の席の人に英語で話しかけてみた。",
    exampleReading: "となりのせきのひとにえいごではなしかけてみた。",
    exampleMeaning: "옆자리에 앉은 사람에게 영어로 말을 걸어 보았습니다."
  },

  // [2023~2021년 기출]
  {
    word: "悲しそう",
    reading: "かなしそう",
    meaning: "슬퍼 보임",
    pos: "な형용사",
    years: ["2023년 기출(한자읽기)"],
    example: "彼女は何かあったのか、とても悲しそうだった。",
    exampleReading: "かのじょはなにかあったのか、とてもかなしそうだった。",
    exampleMeaning: "그녀는 무슨 일이 있었는지 매우 슬퍼 보였습니다."
  },
  {
    word: "適当",
    reading: "てきとう",
    meaning: "적당함, 알맞음",
    pos: "명사·な형용사",
    years: ["2023년 기출(한자읽기)"],
    example: "スープの量に合わせて塩を適当に加える。",
    exampleReading: "すーぷのりょうにあわせてしおをてきとうにくわえる。",
    exampleMeaning: "수프 양에 맞춰 소금을 적당히 넣습니다."
  },
  {
    word: "残す",
    reading: "のこす",
    meaning: "남기다",
    pos: "동사(오단·타동사)",
    years: ["2023년 기출(한자읽기)"],
    example: "明日のために資料を少し残しておいた。",
    exampleReading: "あしたのためにしりょうをすこしのこしておいた。",
    exampleMeaning: "내일을 위해 자료를 조금 남겨 두었습니다."
  },
  {
    word: "角",
    reading: "かど",
    meaning: "모퉁이, 길모퉁이",
    pos: "명사",
    years: ["2023년 기출(한자읽기)"],
    example: "二つ目の角を右に曲がると郵便局がある。",
    exampleReading: "ふたつめのかどをみぎにまがるとゆうびんきょくがある。",
    exampleMeaning: "두 번째 모퉁이에서 오른쪽으로 돌면 우체국이 있습니다."
  },
  {
    word: "比べ",
    reading: "くらべ",
    meaning: "비교",
    pos: "명사",
    years: ["2023년 기출(한자읽기)"],
    example: "去年に比べ、今年の夏は雨が多い。",
    exampleReading: "きょねんにくらべ、ことしのなつはあめがおおい。",
    exampleMeaning: "작년에 비해 올해 여름은 비가 많습니다."
  },
  {
    word: "採用",
    reading: "さいよう",
    meaning: "채용",
    pos: "명사·동사",
    years: ["2023년 기출(한자읽기)"],
    example: "新しいアイデアが企画に採用された。",
    exampleReading: "あたらしいあいでぃあがきかくにさいようされた。",
    exampleMeaning: "새로운 아이디어가 기획에 채택되었습니다."
  },
  {
    word: "他人",
    reading: "たにん",
    meaning: "타인, 남",
    pos: "명사",
    years: ["2023년 기출(한자읽기)"],
    example: "他人の荷物に触れないように気をつける。",
    exampleReading: "たにんのにもつにふれないようにきをつける。",
    exampleMeaning: "다른 사람의 짐에 닿지 않도록 조심합니다."
  },
  {
    word: "あたえる",
    reading: "あたえる",
    meaning: "주다, 부여하다, 끼치다",
    pos: "동사(일어·타동사)",
    years: ["2022년 기출(유의표현)"],
    example: "その経験は子どもたちに大きな影響をあたえた。",
    exampleReading: "そのけいけんはこどもたちにおおきなえいきょうをあたえた。",
    exampleMeaning: "그 경험은 아이들에게 큰 영향을 주었습니다."
  },
  {
    word: "グラウンド",
    reading: "ぐらうんど",
    meaning: "운동장, 그라운드",
    pos: "명사·외래어",
    years: ["2022년 기출(유의표현)"],
    example: "放課後、生徒たちがグラウンドで練習している。",
    exampleReading: "ほうかご、せいとたちがぐらうんどでれんしゅうしている。",
    exampleMeaning: "방과 후 학생들 운동장에서 연습하고 있습니다."
  },
  {
    word: "詳しい",
    reading: "くわしい",
    meaning: "자세하다, 정통하다",
    pos: "い형용사",
    years: ["2022년 기출(유의표현)"],
    example: "電車の乗り換えについて詳しい説明を聞いた。",
    exampleReading: "でんしゃののりかえについてくわしいせつめいをきいた。",
    exampleMeaning: "전철 환승에 대해 자세한 설명을 들었습니다."
  },
  {
    word: "スケジュール",
    reading: "すけじゅーる",
    meaning: "스케줄, 일정",
    pos: "명사·외래어",
    years: ["2022년 기출(유의표현)", "예상어휘(외래어)"],
    example: "旅行のスケジュールをみんなで決めた。",
    exampleReading: "りょこうのすけじゅーるをみんなできめた。",
    exampleMeaning: "여행 일정을 다 같이 정했습니다."
  },
  {
    word: "ふだん",
    reading: "ふだん",
    meaning: "평소, 늘, 보통 때",
    pos: "명사·부사",
    years: ["2022년 기출(유의표현)"],
    example: "ふだんは電車で通勤しているが、今日は歩いた。",
    exampleReading: "ふだんはでんしゃでつうきんしているが、きょうはあるいた。",
    exampleMeaning: "평소에는 전철로 출근하지만 오늘은 걸었습니다."
  },
  {
    word: "おしまいにしましょう",
    reading: "おしまいにしましょう",
    meaning: "끝냅시다, 마무리합시다",
    pos: "관용·표현",
    years: ["2021년 기출(유의표현)"],
    example: "そろそろ暗くなったので、今日の練習はおしまいにしましょう。",
    exampleReading: "そろそろくらくなったので、きょうのれんしゅうはおしまいにしましょう。",
    exampleMeaning: "슬슬 어두워졌으니 오늘 연습은 끝냅시다."
  },
  {
    word: "さっき",
    reading: "さっき",
    meaning: "조금 전에, 방금",
    pos: "명사·부사",
    years: ["2021년 기출(유의표현)"],
    example: "さっき田中さんから電話がかかってきたよ。",
    exampleReading: "さっきたなかさんからでんわがかかってきたよ。",
    exampleMeaning: "조금 전에 다나카 씨한테서 전화가 왔어요."
  },
  {
    word: "さまざまな",
    reading: "さまざまな",
    meaning: "다양한, 여러 가지의",
    pos: "관용·표현",
    synonym: "いろいろな",
    years: ["2021년 기출(유의표현)"],
    example: "会場にはさまざまな国の人が集まっている。",
    exampleReading: "かいじょうにはさまざまなぐにのひとがあつまっている。",
    exampleMeaning: "행사장에는 다양한 나라 사람들이 모여 있습니다."
  },
  {
    word: "指導する",
    reading: "しどうする",
    meaning: "지도하다",
    pos: "동사(서변·타동사)",
    years: ["2021년 기출(유의표현)"],
    example: "経験豊かなコーチが新人を指導する。",
    exampleReading: "けいけんゆたかなこーちがしんじんをしどうする。",
    exampleMeaning: "경험이 풍부한 코치가 신인을 지도합니다."
  },
  {
    word: "そっと",
    reading: "そっと",
    meaning: "살며시, 조용히",
    pos: "부사",
    synonym: "静かに",
    years: ["2021년 기출(유의표현)"],
    example: "赤ちゃんを起こさないように、そっと部屋を出た。",
    exampleReading: "あかちゃんをおこさないように、そっとへやをでた。",
    exampleMeaning: "아기가 깨지 않도록 살며시 방을 나왔습니다."
  },
  {
    word: "たちました",
    reading: "たちました",
    meaning: "지났습니다, 경과했습니다",
    pos: "동사(오단·자동사)",
    years: ["2021년 기출(유의표현)"],
    example: "この町に引っ越してきてから三年がたちました。",
    exampleReading: "このまちにひっこしてきてからさんねんがたちました。",
    exampleMeaning: "이 동네로 이사 온 지 3년이 지났습니다."
  },
  {
    word: "おしまい",
    reading: "おしまい",
    meaning: "끝, 종료",
    pos: "명사",
    years: ["2021년 기출(유의표현)"],
    example: "これで今日の授業はおしまいです。",
    exampleReading: "これできょうのじゅぎょうはおしまいです。",
    exampleMeaning: "이것으로 오늘 수업은 끝입니다."
  },
  {
    word: "きつい",
    reading: "きつい",
    meaning: "빡세다, 힘들다, 꽉 끼다",
    pos: "い형용사",
    years: ["2021년 기출(유의표현)", "2018년 기출(문맥구성)"],
    example: "この靴は少しきついので、大きいサイズに変えたい。",
    exampleReading: "このくつはすこしきついので、おおきいさいずにかえたい。",
    exampleMeaning: "이 신발은 조금 꽉 끼어서 큰 사이즈로 바꾸고 싶습니다."
  },
  {
    word: "チャンス",
    reading: "ちゃんす",
    meaning: "찬스, 기회",
    pos: "명사·외래어",
    years: ["2021년 기출(유의표현)"],
    example: "留学は自分の視野を広げるいいチャンスだ。",
    exampleReading: "りゅうがくはじぶんのしやをひろげるいいちゃんすだ。",
    exampleMeaning: "유학은 자신의 시야를 넓힐 좋은 기회입니다."
  },
  {
    word: "かならず",
    reading: "かならず",
    meaning: "반드시, 꼭",
    pos: "부사",
    years: ["2021년 기출(유의표현)"],
    example: "出かけるときはかならず鍵をかけてください。",
    exampleReading: "でかけるときはかならずかぎをかけてください。",
    exampleMeaning: "외출할 때는 반드시 자물쇠를 잠가 주세요."
  },
  {
    word: "報告する",
    reading: "ほうこくする",
    meaning: "보고하다",
    pos: "동사(서변·타동사)",
    years: ["2021년 기출(유의표현)"],
    example: "調査の結果を先生に報告した。",
    exampleReading: "ちょうさのけっかをせんせいにほうこくした。",
    exampleMeaning: "조사 결과를 선생님께 보고했습니다."
  },

  // [2020년 기출]
  {
    word: "解ける",
    reading: "とける",
    meaning: "풀리다, 녹다",
    pos: "동사(일어·자동사)",
    years: ["2020년 기출(한자읽기)"],
    example: "長年の疑問がようやく解けた。",
    exampleReading: "ながねんのぎもんがようやくあけた。",
    exampleMeaning: "오랜 의문이 겨우 풀렸습니다."
  },
  {
    word: "聞く",
    reading: "きく",
    meaning: "듣다, 묻다",
    pos: "동사(오단·타동사)",
    years: ["2020년 기출(한자읽기)"],
    example: "分からない言葉を先生に聞く。",
    exampleReading: "わからないことばをせんせいにきく。",
    exampleMeaning: "모르는 단어를 선생님께 묻습니다."
  },
  {
    word: "調べる",
    reading: "しらべる",
    meaning: "조사하다, 찾아보다",
    pos: "동사(일어·타동사)",
    years: ["2020년 기출(한자읽기)"],
    example: "旅行の前にバスの時刻を調べた。",
    exampleReading: "りょこうのまえにばすのじこくをしらべた。",
    exampleMeaning: "여행 전에 버스 시간을 조사했습니다."
  },
  {
    word: "助ける",
    reading: "たすける",
    meaning: "돕다, 구하다",
    pos: "동사(일어·타동사)",
    years: ["2020년 기출(한자읽기)"],
    example: "重い荷物を運ぶのを手伝って助かった。",
    exampleReading: "おもいにもつをはこぶのをてつだってあわすかった。",
    exampleMeaning: "무거운 짐을 옮기는 것을 도와줘서 살았습니다."
  },
  {
    word: "あくび",
    reading: "あくび",
    meaning: "하품",
    pos: "명사·동사",
    years: ["2020년 기출(문맥구성)"],
    example: "眠くなったので、思わず大きなあくびが出た。",
    exampleReading: "ねむくなったので、おもわずおおきなああくびがでた。",
    exampleMeaning: "졸음이 와서 무심코 큰 하품이 나왔습니다."
  },
  {
    word: "登場",
    reading: "とうじょう",
    meaning: "등장",
    pos: "명사·동사",
    years: ["2020년 기출(문맥구성)"],
    example: "物語の終盤に新しい登場人物が現れる。",
    exampleReading: "ものがたりのしゅうばんにあたらしいとうじょうじんぶつがあらわれる。",
    exampleMeaning: "이야기 후반부에 새로운 등장인물이 나타납니다."
  },
  {
    word: "配達",
    reading: "はいたつ",
    meaning: "배달",
    pos: "명사·동사",
    years: ["2020년 기출(문맥구성)"],
    example: "ネットで買った本が午前中に配達された。",
    exampleReading: "ねっとでかったほんがごぜんちゅうにはいたつされた。",
    exampleMeaning: "인터넷으로 산 책이 오전에 배달되었습니다."
  },
  {
    word: "引き受ける",
    reading: "ひきうける",
    meaning: "맡다, 떠맡다, 수락하다",
    pos: "동사(일어·타동사)",
    years: ["2020년 기출(문맥구성)", "2010년 기출(용법)"],
    example: "文化祭の司会を快く引き受けた。",
    exampleReading: "ぶんかさいのしかいをこころよくひきうけた。",
    exampleMeaning: "문화제 사회를 흔쾌히 맡았습니다."
  },
  {
    word: "ぴったり",
    reading: "ぴったり",
    meaning: "딱 맞음",
    pos: "부사",
    years: ["2020년 기출(문맥구성)"],
    example: "この靴は私の足にぴったりだ。",
    exampleReading: "このくつはわたしのあしにぴったりだ。",
    exampleMeaning: "이 신발은 내 발에 딱 맞습니다."
  },
  {
    word: "ユーモア",
    reading: "ゆーもあ",
    meaning: "유머",
    pos: "명사·외래어",
    years: ["2020년 기출(문맥구성)", "2010년 기출(용법)"],
    example: "彼はユーモアがあって、話していると楽しい。",
    exampleReading: "かれはゆーもあがあって、はなしているとたのしい。",
    exampleMeaning: "그는 유머가 있어서 이야기하면 즐겁습니다."
  },
  {
    word: "楽だ",
    reading: "らくだ",
    meaning: "편하다, 수월하다",
    pos: "な형용사",
    years: ["2020년 기출(유의표현)"],
    example: "車があると買い物に行くのがとても楽だ。",
    exampleReading: "くるまがあるとかいものにいくのがとてもらくだ。",
    exampleMeaning: "차가 있으면 장 보러 가기가 매우 편합니다."
  },
  {
    word: "あらゆる",
    reading: "あらゆる",
    meaning: "온갖, 모든",
    pos: "관용·표현",
    synonym: "すべての",
    years: ["2020년 기출(유의표현)"],
    example: "この資料にはあらゆる可能性が書かれている。",
    exampleReading: "このしりょうにはあらゆるかのうせいがかかかれている。",
    exampleMeaning: "이 자료에는 온갖 가능성이 적혀 있습니다."
  },
  {
    word: "協力する",
    reading: "きょうりょくする",
    meaning: "협력하다",
    pos: "동사(서변·타동사)",
    years: ["2020년 기출(유의표현)"],
    example: "クラス全員が協力してイベントを成功させた。",
    exampleReading: "くらすぜんいんがきょうりょくしていべんとをせいこうさせた。",
    exampleMeaning: "반 전원이 협력해 이벤트를 성공시켰습니다."
  },
  {
    word: "まぶしい",
    reading: "まぶしい",
    meaning: "눈부시다",
    pos: "い형용사",
    years: ["2020년 기출(유의표현)"],
    example: "夏の朝日がまぶしくて目が覚めた。",
    exampleReading: "なつのあさひがまぶしくてめがさめた。",
    exampleMeaning: "여름 아침 햇살이 눈부셔서 눈이 떠졌습니다."
  },
  {
    word: "約",
    reading: "やく",
    meaning: "약, 대략",
    pos: "접사·접두어",
    years: ["2020년 기출(유의표현)"],
    example: "会場までは駅から約十分かかる。",
    exampleReading: "かいじょうまではえきからやくじゅっぷんかかる。",
    exampleMeaning: "행사장까지는 역에서 약 10분 걸립니다."
  },
  {
    word: "通り過ぎる",
    reading: "とおりすぎる",
    meaning: "지나가다, 지나쳐 버리다",
    pos: "동사(일어·자동사)",
    years: ["2020년 기출(용법)"],
    example: "スマホを見ていて、降りる駅を通り過ぎてしまった。",
    exampleReading: "すまほをみていて、おりるえきをとおりすぎてしまった。",
    exampleMeaning: "스마트폰을 보다가 내릴 역을 지나쳐 버렸습니다."
  },
  {
    word: "長く",
    reading: "ながく",
    meaning: "오래, 길게",
    pos: "부사",
    years: ["2020년 기출(용법)"],
    example: "この時計は長く使える丈夫な作りだ。",
    exampleReading: "このとけいはながくつかえるじょうぶなつくりだ。",
    exampleMeaning: "이 시계는 오래 쓸 수 있는 튼튼한 구조입니다."
  },
  {
    word: "オーバー",
    reading: "おーばー",
    meaning: "오버, 제한 초과, 과장",
    pos: "명사·동사·외래어",
    years: ["2020년 기출(용법)"],
    example: "荷物の重さが制限をオーバーしてしまった。",
    exampleReading: "にもつのおもさがせいげんをおーばーしてしまった。",
    exampleMeaning: "짐 무게가 제한을 초과해 버렸습니다."
  },
  {
    word: "だるい",
    reading: "だるい",
    meaning: "나른하다, 몸이 무겁다",
    pos: "い형용사",
    years: ["2020년 기출(용법)"],
    example: "寝不足のせいで今日は体全体がだるい。",
    exampleReading: "ねぶそくのせいできょうはからだぜんたいがだるい。",
    exampleMeaning: "잠이 부족한 탓에 오늘은 몸 전체가 나른합니다."
  },
  {
    word: "気づく",
    reading: "きづく",
    meaning: "깨닫다, 눈치채다",
    pos: "동사(오단·자동사)",
    years: ["2020년 기출(용법)"],
    example: "家を出たあとで、財布を忘れたことに気づいた。",
    exampleReading: "いえをでたあとで、さいふをわすれたことにきづいた。",
    exampleMeaning: "집을 나선 뒤에 지갑을 잊어버린 것을 깨달았습니다."
  },
  {
    word: "ふらふら",
    reading: "ふらふら",
    meaning: "비틀거리다, 어지럽다",
    pos: "부사",
    years: ["2020년 기출(용법)", "2010년 기출(문맥구성)"],
    example: "朝から何も食べていないので、頭がふらふらする。",
    exampleReading: "あさからなにもたべていないので、あたまがふらふらする。",
    exampleMeaning: "아침부터 아무것도 먹지 않아서 머리가 어지럽습니다."
  },

  // [2019~2010년 기출]
  {
    word: "過去",
    reading: "かこ",
    meaning: "과거",
    pos: "명사",
    years: ["2019년 기출(한자읽기)"],
    example: "過去のデータをグラフにまとめた。",
    exampleReading: "かこのでーたをぐらふにまとめた。",
    exampleMeaning: "과거 데이터를 그래프로 정리했습니다."
  },
  {
    word: "予約",
    reading: "よやく",
    meaning: "예약",
    pos: "명사·동사",
    years: ["2019년 기출(한자읽기)"],
    example: "人気のレストランなので、事前に予約した。",
    exampleReading: "にんきのれすとらんなので、じぜんによやくした。",
    exampleMeaning: "인기 레스토랑이라서 미리 예약했습니다."
  },
  {
    word: "さっそく",
    reading: "さっそく",
    meaning: "곧바로, 즉시",
    pos: "부사",
    years: ["2019년 기출(문맥구성)", "예상어휘(부사)"],
    example: "新しい靴を買ったので、さっそく履いてみた。",
    exampleReading: "あたらしいくつをかったので、さっそくはいてみた。",
    exampleMeaning: "새 신발을 사서 곧바로 신어 보았습니다."
  },
  {
    word: "締め切り",
    reading: "しめきり",
    meaning: "마감, 마감 기한",
    pos: "명사",
    years: ["2019년 기출(문맥구성)", "예상어휘(명사)"],
    example: "レポートの締め切りは明日の夕方だ。",
    exampleReading: "れぽーとのしめきりはあしたのゆうがただ。",
    exampleMeaning: "리포트 마감은 내일 저녁입니다."
  },
  {
    word: "デザイン",
    reading: "でざいん",
    meaning: "디자인",
    pos: "명사·동사·외래어",
    years: ["2019년 기출(문맥구성)"],
    example: "このバッグはシンプルでおしゃれなデザインだ。",
    exampleReading: "このばっぐはしんぷるでおしゃれなでざいんだ。",
    exampleMeaning: "이 가방은 심플하고 세련된 디자인입니다."
  },
  {
    word: "どきどき",
    reading: "どきどき",
    meaning: "두근두근",
    pos: "부사",
    years: ["2019년 기출(문맥구성)", "2010년 기출(용법)"],
    example: "初めての発表の前は、胸がどきどきする。",
    exampleReading: "はじめてのはっぴょうのまえは、むねがどきどきする。",
    exampleMeaning: "첫 발표 전에는 가슴이 두근두근합니다."
  },
  {
    word: "取り消す",
    reading: "とりけす",
    meaning: "취소하다, 철회하다",
    pos: "동사(오단·타동사)",
    years: ["2019년 기출(문맥구성)", "2010년 기출(문맥구성)"],
    example: "予定が変わったので、ホテルの予約を取り消した。",
    exampleReading: "よていがかわったので、ほてるのよやくをとりけした。",
    exampleMeaning: "일정이 바뀌어서 호텔 예약을 취소했습니다."
  },
  {
    word: "ノック",
    reading: "のっく",
    meaning: "노크, 두드림",
    pos: "명사·동사·외래어",
    years: ["2019년 기출(문맥구성)"],
    example: "会議室のドアを軽くノックしてから入った。",
    exampleReading: "かいぎしつのどあをかるくのっくしてからいった。",
    exampleMeaning: "회의실 문을 가볍게 노크한 뒤 들어갔습니다."
  },
  {
    word: "めんどうくさい",
    reading: "めんどうくさい",
    meaning: "귀찮다, 번거롭다",
    pos: "い형용사",
    years: ["2019년 기출(문맥구성)"],
    example: "細かい手続きはめんどうくさいが、きちんとやろう。",
    exampleReading: "こまかいてつづきはめんどうくさいが、きちんとやろう。",
    exampleMeaning: "세세한 절차는 번거롭지만 제대로 해 둡시다."
  },
  {
    word: "あふれる",
    reading: "あふれる",
    meaning: "넘치다, 가득 차다",
    pos: "동사(일어·자동사)",
    years: ["2018년 기출(문맥구성)"],
    example: "バケツに水を入れすぎて、床にあふれた。",
    exampleReading: "ばけつにみずをいれすぎて、ゆかにあふれた。",
    exampleMeaning: "양동이에 물을 너무 많이 넣어서 바닥에 넘쳤습니다."
  },
  {
    word: "意外に",
    reading: "いがいに",
    meaning: "의외로",
    pos: "부사·な형용사",
    years: ["2018년 기출(문맥구성)"],
    example: "この道は混んでいるかと思ったが、意外にすいていた。",
    exampleReading: "このみちはこんでいるかとおもったが、いがいにすいていた。",
    exampleMeaning: "이 길은 막힐 줄 알았는데 의외로 한산했습니다."
  },
  {
    word: "うっかり",
    reading: "うっかり",
    meaning: "깜빡, 무심코",
    pos: "부사",
    years: ["2018년 기출(문맥구성)"],
    example: "急いでいて、うっかり傘を電車に忘れてしまった。",
    exampleReading: "いそいでいて、うっかりかさをでんしゃにわすれてしまった。",
    exampleMeaning: "서두르다가 깜빡하고 우산을 전철에 잊어버렸습니다."
  },
  {
    word: "エネルギー",
    reading: "えねるぎー",
    meaning: "에너지",
    pos: "명사·외래어",
    years: ["2018년 기출(문맥구성)"],
    example: "再生可能エネルギーの利用が増えている。",
    exampleReading: "さいせいかのうえねるぎーのりようがふえている。",
    exampleMeaning: "재생 가능 에너지 이용이 늘고 있습니다."
  },
  {
    word: "重ねる",
    reading: "かさねる",
    meaning: "겹치다, 거듭하다",
    pos: "동사(일어·타동사)",
    years: ["2018년 기출(문맥구성)"],
    example: "努力を重ねて、ついに夢をかなえた。",
    exampleReading: "どりょくをかさねて、ついにゆめをかなえた。",
    exampleMeaning: "노력을 거듭해서 마침내 꿈을 이루었습니다."
  },
  {
    word: "乾燥",
    reading: "かんそう",
    meaning: "건조",
    pos: "명사·동사",
    years: ["2018년 기출(문맥구성)"],
    example: "冬は空気が乾燥するので、ハンドクリームを使う。",
    exampleReading: "ふゆはくうきがかんそうするので、はんどくりーむをつかう。",
    exampleMeaning: "겨울에는 공기가 건조해서 핸드크림을 바릅니다."
  },
  {
    word: "原料",
    reading: "げんりょう",
    meaning: "원료",
    pos: "명사",
    years: ["2018년 기출(문맥구성)", "2010년 기출(용법)"],
    example: "このお菓子の主な原料はさつまいまだ。",
    exampleReading: "このおかしのおもなげんりょうはさつまいまだ。",
    exampleMeaning: "이 과자의 주된 원료는 고구마입니다."
  },
  {
    word: "しっかり",
    reading: "しっかり",
    meaning: "단단히, 똑바로, 확실히",
    pos: "부사",
    years: ["2018년 기출(문맥구성)"],
    example: "寝る前に戸締まりをしっかり確認しよう。",
    exampleReading: "ねるまえにとじまりをしっかりかくにんしよう。",
    exampleMeaning: "자기 전에 문단속을 확실히 확인합시다."
  },
  {
    word: "薬局",
    reading: "やっきょく",
    meaning: "약국",
    pos: "명사",
    years: ["2018년 기출(한자읽기)"],
    example: "帰りに駅前の薬局で薬を買った。",
    exampleReading: "かえりにえきまえのやっきょくでくすりをかった。",
    exampleMeaning: "돌아오는 길에 역 앞 약국에서 약을 샀습니다."
  },
  {
    word: "お互いに",
    reading: "おたがいに",
    meaning: "서로, 피차",
    pos: "부사·명사",
    years: ["2010년 기출(용법)"],
    example: "困ったときは、お互いに助け合うことが大切だ。",
    exampleReading: "こまったときは、おたがいにたすけあうことがたいせつだ。",
    exampleMeaning: "곤란할 때는 서로 돕는 것이 중요합니다."
  },
  {
    word: "かき混ぜる",
    reading: "かきまぜる",
    meaning: "휘젓다, 섞다",
    pos: "동사(일어·타동사)",
    years: ["2010년 기출(용법)"],
    example: "コーヒーに砂糖を入れてスプーンでかき混ぜた。",
    exampleReading: "こーひーにさとうをいれてすぷーんでかきまぜた。",
    exampleMeaning: "커피에 설탕을 넣고 스푼으로 휘저었습니다."
  },
  {
    word: "身につける",
    reading: "みにつける",
    meaning: "익히다, 몸에 붙이다",
    pos: "동사(일어·타동사)",
    years: ["2010년 기출(용법)"],
    example: "毎日練習して英会話の力を身につけた。",
    exampleReading: "まいにちれんしゅうしてえいかいわのちからをみにつけた。",
    exampleMeaning: "매일 연습해서 영어 회화 실력을 익혔습니다."
  },
  {
    word: "たまる",
    reading: "たまる",
    meaning: "쌓이다, 모이다",
    pos: "동사(오단·자동사)",
    years: ["2010년 기출(용법)", "2010년 기출(유의표현)"],
    example: "休みの日にたまった洗濯物を片付けた。",
    exampleReading: "やすみのひにたまったせんたくものをかたづけた。",
    exampleMeaning: "쉬는 날에 쌓인 빨랫감을 치웠습니다."
  },
  {
    word: "伝わる",
    reading: "つたわる",
    meaning: "전해지다, 알려지다",
    pos: "동사(오단·자동사)",
    years: ["2010년 기출(용법)"],
    example: "感謝の気持ちが相手によく伝わったと思う。",
    exampleReading: "かんしゃのきもちがあいてによくつたわったとおもう。",
    exampleMeaning: "감사의 마음이 상대에게 잘 전해졌다고 생각합니다."
  },
  {
    word: "どなる",
    reading: "どなる",
    meaning: "고함지르다, 소리치다",
    pos: "동사(오단·자동사)",
    years: ["2010년 기출(용법)", "2010년 기출(유의표현)"],
    example: "騒いでいたら、近くの人にとどなられた。",
    exampleReading: "さわいでいたら、ちかくのひとにとどなられた。",
    exampleMeaning: "떠들었더니 근처 사람에게 고함을 들었습니다."
  },
  {
    word: "そろそろ",
    reading: "そろそろ",
    meaning: "슬슬, 이제 곧",
    pos: "부사",
    years: ["2010년 기출(용법)"],
    example: "電車の発車時刻が近いので、そろそろホームへ行こう。",
    exampleReading: "でんしゃのはっしゃじこくがちかいので、そろそろほーむへいこう。",
    exampleMeaning: "전철 출발 시각이 가까우니 슬슬 승강장으로 갑시다."
  },
  {
    word: "そっくり",
    reading: "そっくり",
    meaning: "쏙 빼닮음, 통째로",
    pos: "부사·な형용사",
    years: ["2010년 기출(용법)", "예상어휘(부사)"],
    example: "彼は父親に顔も声もそっくりだ。",
    exampleReading: "かれはちちおやにかおもこえもそっくりだ。",
    exampleMeaning: "그는 아버지와 얼굴도 목소리도 똑같습니다."
  },
  {
    word: "なだらかだ",
    reading: "なだらかだ",
    meaning: "완만하다, 순탄하다",
    pos: "な형용사",
    years: ["2010년 기출(용법)"],
    example: "この山の登山道はなだらかで歩きやすい。",
    exampleReading: "このやまのとざんどうはなだらかであるきやすい。",
    exampleMeaning: "이 산의 등산로는 완만해서 걷기 쉽습니다."
  },

  // [2장 예상 어휘공략하기: 명사 · 동사 · い/な형용사 · 부사 · 외래어 · 유의어]
  {
    word: "打ち合わせ",
    reading: "うちあわせ",
    meaning: "사전 협의, 조율, 미팅",
    pos: "명사",
    years: ["예상어휘(명사)"],
    example: "発表の前にメンバーと打ち合わせをした。",
    exampleReading: "はっぴょうのまえにめんばーとうちあわせをした。",
    exampleMeaning: "발표 전에 멤버들과 사전 협의를 했습니다."
  },
  {
    word: "きっかけ",
    reading: "きっかけ",
    meaning: "계기, 실마리",
    pos: "명사",
    years: ["예상어휘(명사)"],
    example: "旅行がきっかけで日本語を勉強し始めた。",
    exampleReading: "りょこうがきっかけでにほんごをべんきょうしはじめた。",
    exampleMeaning: "여행이 계기가 되어 일본어를 공부하기 시작했습니다."
  },
  {
    word: "貸し出し",
    reading: "かしだし",
    meaning: "대출, 대여",
    pos: "명사",
    years: ["예상어휘(명사)"],
    example: "図書館の本は一人五冊まで貸し出しできる。",
    exampleReading: "としょかんのほんはひとりごさつまでかしだしできる。",
    exampleMeaning: "도서관 책은 1인당 5권까지 대출할 수 있습니다."
  },
  {
    word: "受かる",
    reading: "うかる",
    meaning: "합격하다",
    pos: "동사(오단·자동사)",
    years: ["예상어휘(동사)"],
    example: "努力したおかげで試験に受かった。",
    exampleReading: "どりょくしたおかげでしけんにうかった。",
    exampleMeaning: "노력한 덕분에 시험에 합격했습니다."
  },
  {
    word: "取り入れる",
    reading: "とりいれる",
    meaning: "받아들이다, 도입하다",
    pos: "동사(일어·타동사)",
    years: ["예상어휘(동사)"],
    example: "生活の中に軽い運動を取り入れている。",
    exampleReading: "せいかつのなかにかるいうんどうをとりいれている。",
    exampleMeaning: "생활 속에 가벼운 운동을 도입하고 있습니다."
  },
  {
    word: "触れる",
    reading: "ふれる",
    meaning: "만지다, 접하다, 언급하다",
    pos: "동사(일어·자동사)",
    years: ["예상어휘(동사)"],
    example: "展示品には直接触れないでください。",
    exampleReading: "てんじひんにはちょくせつふれないでください。",
    exampleMeaning: "전시품에는 직접 만지지 마세요."
  },
  {
    word: "ありがたい",
    reading: "ありがたい",
    meaning: "고맙다, 감사하다",
    pos: "い형용사",
    years: ["예상어휘(い형용사)"],
    example: "忙しいのに手伝ってもらって本当にありがたい。",
    exampleReading: "いそがしいのにてつだってもらってほんとうにありがたい。",
    exampleMeaning: "바쁜데 도와줘서 정말 고맙습니다."
  },
  {
    word: "とんでもない",
    reading: "とんでもない",
    meaning: "말도 안 되다, 천만에",
    pos: "い형용사",
    years: ["예상어휘(い형용사)"],
    example: "「お礼なんて」「とんでもない、当たり前のことです」",
    exampleReading: "「おれいなんて」「とんでもない、あたりまえのことです」",
    exampleMeaning: "“감사 인사는요.” “천만에요, 당연한 일입니다.”"
  },
  {
    word: "ややこしい",
    reading: "ややこしい",
    meaning: "복잡하다, 까다롭다",
    pos: "い형용사",
    years: ["예상어휘(い형용사)"],
    example: "ルールが少しややこしいので、例を見ながら確認しよう。",
    exampleReading: "るーるがすこしややこしいので、れいをみながらかくにんしよう。",
    exampleMeaning: "규칙이 조금 복잡하니 예를 보면서 확인합시다."
  },
  {
    word: "あたりまえだ",
    reading: "あたりまえだ",
    meaning: "당연하다",
    pos: "な형용사",
    years: ["예상어휘(な형용사)"],
    example: "約束を守ることはあたりまえだ。",
    exampleReading: "やくそくをまもることはあたりまえだ。",
    exampleMeaning: "약속을 지키는 것은 당연합니다."
  },
  {
    word: "なめらかだ",
    reading: "なめらかだ",
    meaning: "매끄럽다, 부드럽다",
    pos: "な형용사",
    years: ["예상어휘(な형용사)"],
    example: "このクリームは肌になじんでなめらかだ。",
    exampleReading: "このくりーむははだになじんでなめらかだ。",
    exampleMeaning: "이 크림은 피부에 스며들어 매끄럽습니다."
  },
  {
    word: "いよいよ",
    reading: "いよいよ",
    meaning: "드디어, 마침내",
    pos: "부사",
    years: ["예상어휘(부사)"],
    example: "明日はいよいよ試験本番だ。",
    exampleReading: "あしたはいよいよしけんほんばんだ。",
    exampleMeaning: "내일은 드디어 시험 당일입니다."
  },
  {
    word: "せっかく",
    reading: "せっかく",
    meaning: "모처럼, 애써",
    pos: "부사",
    years: ["예상어휘(부사)"],
    example: "せっかく作った料理だから冷めないうちに食べよう。",
    exampleReading: "せっかくつくったりょうりだからさめないうちにたべよう。",
    exampleMeaning: "모처럼 만든 요리니까 식기 전에 먹읍시다."
  },
  {
    word: "いちいち",
    reading: "いちいち",
    meaning: "하나하나, 일일이",
    pos: "부사",
    years: ["예상어휘(부사)"],
    example: "小さなミスをいちいち気にしなくてもいい。",
    exampleReading: "ちいさなみすをいちいちきにしなくてもいい。",
    exampleMeaning: "작은 실수를 일일이 신경 쓰지 않아도 됩니다."
  },
  {
    word: "スケジュール",
    reading: "すけじゅーる",
    meaning: "스케줄, 일정",
    pos: "외래어",
    years: ["예상어휘(외래어)", "2022년 기출(유의표현)"],
    example: "旅行のスケジュールをみんなで決めた。",
    exampleReading: "りょこうのすけじゅーるをみんなできめた。",
    exampleMeaning: "여행 일정을 다 같이 정했습니다."
  },
  {
    word: "サービス",
    reading: "さーびす",
    meaning: "서비스",
    pos: "외래어",
    years: ["예상어휘(외래어)", "2010년 기출(유의표현)"],
    example: "この店は店員のサービスが丁寧で人気がある。",
    exampleReading: "このみせはてんいんのさーびすがていねいでにんきがある。",
    exampleMeaning: "이 가게는 직원의 서비스가 정중해서 인기가 있습니다."
  },
  {
    word: "コミュニケーション",
    reading: "こみゅにけーしょん",
    meaning: "커뮤니케이션, 의사소통",
    pos: "외래어",
    years: ["예상어휘(외래어)"],
    example: "チームでは日常的なコミュニケーションが大切だ。",
    exampleReading: "ちーむではにちじょうてきなこみゅにけーしょんがたいせつだ。",
    exampleMeaning: "팀에서는 일상적인 커뮤니케이션이 중요합니다."
  },
  {
    word: "手がかり",
    reading: "てがかり",
    meaning: "단서, 실마리",
    pos: "명사",
    synonym: "ヒント",
    years: ["예상어휘(유의어)"],
    example: "事件を解決するための手がかりを見つけた。",
    exampleReading: "じけんをかいけつするためのてがかりをみつけた。",
    exampleMeaning: "사건을 해결하기 위한 단서를 찾았습니다."
  },
  {
    word: "まもなく",
    reading: "まもなく",
    meaning: "곧, 머지않아",
    pos: "부사",
    synonym: "もうすぐ",
    years: ["예상어휘(유의어)"],
    example: "列車はまもなく一番線に到着します。",
    exampleReading: "れっしゃはまもなくいちばんせんにとうちゃくします。",
    exampleMeaning: "열차는 곧 1번 선에 도착합니다."
  }
];

// =========================================================================
// 1. 중복 기출 병합 및 히라가나 전용 판별 헬퍼 함수
// =========================================================================

/**
 * 여러 기출 연도/분류에 중복 등장하는 단어를 하나로 합치고,
 * `n년·n년도 중복 기출` 문자열(duplicateLabel / dupLabel)을 생성합니다.
 */
function mergeVocabEntries(rawList) {
  const map = new Map();

  rawList.forEach((item, index) => {
    const key = `${item.word}__${item.reading}`;
    if (!map.has(key)) {
      map.set(key, {
        id: item.id || `vocab_${index + 1}`,
        word: item.word,
        reading: item.reading,
        meaning: item.meaning,
        pos: item.pos,
        synonym: item.synonym || "",
        years: [...(item.years || [])],
        example: item.example || "",
        exampleReading: item.exampleReading || "",
        exampleMeaning: item.exampleMeaning || ""
      });
    } else {
      const existing = map.get(key);
      (item.years || []).forEach((yr) => {
        if (!existing.years.includes(yr)) {
          existing.years.push(yr);
        }
      });
      if (!existing.synonym && item.synonym) {
        existing.synonym = item.synonym;
      }
      if (!existing.example && item.example) {
        existing.example = item.example;
        existing.exampleReading = item.exampleReading || "";
        existing.exampleMeaning = item.exampleMeaning || "";
      }
    }
  });

  return Array.from(map.values()).map((entry) => {
    const isDuplicate = entry.years.length > 1;
    const duplicateLabel = formatDuplicateYearsLabel(entry.years);
    const kanaOnly = isKanaOnlyWord(entry.word);
    return {
      ...entry,
      isDuplicate,
      dupLabel: duplicateLabel,
      duplicateLabel,
      kanaOnly
    };
  });
}

/**
 * 연도/분류 배열을 받아 중복 시 `n년·n년도 중복 기출` 형태로 포맷팅합니다.
 * 예: ["2021년 기출(유의표현)", "2023년 기출(한자읽기)"] -> "2021년·2023년도 중복 기출"
 * 예: ["2025년 기출(한자읽기)", "2010년 기출(용법)"] -> "2025년·2010년도 중복 기출"
 */
function formatDuplicateYearsLabel(years = []) {
  if (!Array.isArray(years) || years.length === 0) return "";
  if (years.length === 1) return years[0];

  const extracted = years.map((entry) => {
    const yearMatch = String(entry).match(/(\d{4})년/);
    if (yearMatch) {
      return `${yearMatch[1]}년`;
    }
    return String(entry).trim();
  });

  const uniqueParts = Array.from(new Set(extracted));
  if (uniqueParts.length > 1 && uniqueParts.every((p) => /^\d{4}년$/.test(p))) {
    const lastIdx = uniqueParts.length - 1;
    uniqueParts[lastIdx] = `${uniqueParts[lastIdx].replace(/년$/, "")}년도`;
    return `${uniqueParts.join("·")} 중복 기출`;
  }

  return `${years.join(" · ")} 중복 기출`;
}

/**
 * 표기가 히라가나(장음 기호 ー, 공백, 물결표 〜 등 포함)로만 구성되어 있는지 판별합니다.
 * 한자나 가타카나(외래어 등)가 포함된 단어는 false를 반환합니다.
 */
function isKanaOnlyWord(word) {
  if (!word || typeof word !== "string") return false;
  const trimmed = word.trim();
  if (!trimmed) return false;
  return /^[ぁ-ゟー・〜～\s]+$/.test(trimmed);
}

const VOCAB_DATA = mergeVocabEntries(RAW_VOCAB_ITEMS);

// =========================================================================
// 2. 로컬 스토리지 상태 관리 스토어 모듈
// =========================================================================

const STORAGE_KEY = "jlpt_vocab_study_app_v1";

function createDefaultStoreState() {
  return {
    theme: "light",           // "light" | "dark"
    ttsSpeed: 0.95,           // 0.6 ~ 1.4
    maskReading: false,       // 전역 히라가나(읽기) 가림
    maskMeaning: false,       // 전역 뜻 가림
    statusMap: {},            // { [vocabId]: "known" | "unsure" | "unknown" }
    favorites: [],            // [vocabId, ...]
    posNotes: {},             // { [vocabId]: string }
    decks: [],                // [{ id: string, name: string, wordIds: string[] }]
    wrongLog: {}              // { [vocabId]: { count: number, lastMode: string, lastInput: string, lastAt: string } }
  };
}

function normalizeStoreState(rawObj) {
  const base = createDefaultStoreState();
  if (!rawObj || typeof rawObj !== "object") return base;

  const validTheme = rawObj.theme === "dark" ? "dark" : "light";
  const parsedSpeed = Number(rawObj.ttsSpeed);
  const validSpeed = Number.isFinite(parsedSpeed)
    ? Math.min(1.4, Math.max(0.6, Number(parsedSpeed.toFixed(2))))
    : base.ttsSpeed;

  const cleanStatusMap = {};
  if (rawObj.statusMap && typeof rawObj.statusMap === "object") {
    Object.entries(rawObj.statusMap).forEach(([k, v]) => {
      if (v === "known" || v === "unsure" || v === "unknown") {
        cleanStatusMap[k] = v;
      }
    });
  }

  const cleanFavorites = Array.isArray(rawObj.favorites)
    ? Array.from(new Set(rawObj.favorites.filter((id) => typeof id === "string")))
    : [];

  const cleanPosNotes = {};
  if (rawObj.posNotes && typeof rawObj.posNotes === "object") {
    Object.entries(rawObj.posNotes).forEach(([k, v]) => {
      if (typeof v === "string") {
        cleanPosNotes[k] = v;
      }
    });
  }

  const cleanDecks = Array.isArray(rawObj.decks)
    ? rawObj.decks
        .filter((d) => d && typeof d === "object" && typeof d.name === "string" && d.name.trim())
        .map((d, idx) => ({
          id: typeof d.id === "string" && d.id ? d.id : `deck_${Date.now()}_${idx}`,
          name: d.name.trim(),
          wordIds: Array.isArray(d.wordIds)
            ? Array.from(new Set(d.wordIds.filter((id) => typeof id === "string")))
            : []
        }))
    : [];

  const cleanWrongLog = {};
  if (rawObj.wrongLog && typeof rawObj.wrongLog === "object") {
    Object.entries(rawObj.wrongLog).forEach(([k, v]) => {
      if (v && typeof v === "object") {
        const count = Number(v.count);
        cleanWrongLog[k] = {
          count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 1,
          lastMode: typeof v.lastMode === "string" ? v.lastMode : "quiz",
          lastInput: typeof v.lastInput === "string" ? v.lastInput : "",
          lastAt: typeof v.lastAt === "string" ? v.lastAt : new Date().toISOString()
        };
      }
    });
  }

  return {
    theme: validTheme,
    ttsSpeed: validSpeed,
    maskReading: Boolean(rawObj.maskReading),
    maskMeaning: Boolean(rawObj.maskMeaning),
    statusMap: cleanStatusMap,
    favorites: cleanFavorites,
    posNotes: cleanPosNotes,
    decks: cleanDecks,
    wrongLog: cleanWrongLog
  };
}

const StudyStore = (() => {
  let currentState = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultStoreState();
      return normalizeStoreState(JSON.parse(raw));
    } catch (_err) {
      return createDefaultStoreState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (_err) {
      // 스토리지 용량 초과 등 예외 시 무시
    }
  }

  function getState() {
    return currentState;
  }

  function getStatus(vocabId) {
    return currentState.statusMap[vocabId] || "unknown";
  }

  function setStatus(vocabId, status) {
    if (!["known", "unsure", "unknown"].includes(status)) return;
    currentState.statusMap[vocabId] = status;
    save();
  }

  function isFavorite(vocabId) {
    return currentState.favorites.includes(vocabId);
  }

  function toggleFavorite(vocabId) {
    const idx = currentState.favorites.indexOf(vocabId);
    if (idx >= 0) {
      currentState.favorites.splice(idx, 1);
    } else {
      currentState.favorites.push(vocabId);
    }
    save();
    return isFavorite(vocabId);
  }

  function getPosNote(item) {
    if (!item) return "";
    const custom = currentState.posNotes[item.id];
    if (typeof custom === "string" && custom.trim() !== "") {
      return custom;
    }
    return item.pos || "";
  }

  function setPosNote(vocabId, noteText) {
    const trimmed = String(noteText ?? "").trim();
    if (trimmed) {
      currentState.posNotes[vocabId] = trimmed;
    } else {
      delete currentState.posNotes[vocabId];
    }
    save();
  }

  function createDeck(name, wordIds = []) {
    const trimmedName = String(name ?? "").trim();
    if (!trimmedName) return null;
    const uniqueIds = Array.from(new Set((wordIds || []).filter(Boolean)));
    const newDeck = {
      id: `deck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      wordIds: uniqueIds
    };
    currentState.decks.push(newDeck);
    save();
    return newDeck;
  }

  function addWordsToDeck(deckId, wordIds = []) {
    const deck = currentState.decks.find((d) => d.id === deckId);
    if (!deck) return null;
    const merged = new Set(deck.wordIds);
    (wordIds || []).forEach((id) => {
      if (id) merged.add(id);
    });
    deck.wordIds = Array.from(merged);
    save();
    return deck;
  }

  function recordWrongAnswer(vocabId, mode = "quiz", userInput = "") {
    if (!vocabId) return;
    const prev = currentState.wrongLog[vocabId];
    currentState.wrongLog[vocabId] = {
      count: prev ? prev.count + 1 : 1,
      lastMode: mode,
      lastInput: String(userInput ?? ""),
      lastAt: new Date().toISOString()
    };
    save();
  }

  function resolveWrongAnswer(vocabId) {
    if (!vocabId || !currentState.wrongLog[vocabId]) return;
    delete currentState.wrongLog[vocabId];
    save();
  }

  function clearAllWrongAnswers() {
    currentState.wrongLog = {};
    save();
  }

  function setTheme(theme) {
    currentState.theme = theme === "dark" ? "dark" : "light";
    save();
  }

  function setTtsSpeed(speed) {
    const num = Number(speed);
    if (!Number.isFinite(num)) return;
    currentState.ttsSpeed = Math.min(1.4, Math.max(0.6, Number(num.toFixed(2))));
    save();
  }

  function setGlobalMask(type, enabled) {
    if (type === "reading") {
      currentState.maskReading = Boolean(enabled);
      save();
    } else if (type === "meaning") {
      currentState.maskMeaning = Boolean(enabled);
      save();
    }
  }

  function exportJsonBackup() {
    const payload = {
      app: "japanese-vocab-study-app",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: currentState
    };
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `japanese-vocab-backup-${dateStamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
  }

  function importJsonBackup(jsonText) {
    if (typeof jsonText !== "string" || !jsonText.trim()) {
      return { ok: false, message: "비어 있는 JSON 파일입니다." };
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, message: "올바른 JSON 객체 형식이 아닙니다." };
      }
      const rawData = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
      const hasKnownField =
        "statusMap" in rawData ||
        "favorites" in rawData ||
        "posNotes" in rawData ||
        "decks" in rawData ||
        "wrongLog" in rawData ||
        "theme" in rawData ||
        "ttsSpeed" in rawData;

      if (!hasKnownField) {
        return { ok: false, message: "학습 데이터 구조가 일치하지 않는 백업 파일입니다." };
      }

      currentState = normalizeStoreState(rawData);
      save();
      return { ok: true, message: "학습 데이터를 성공적으로 복원했습니다.", state: currentState };
    } catch (_err) {
      return { ok: false, message: "JSON 구문 분석에 실패했습니다. 유효한 백업 파일을 선택해 주세요." };
    }
  }

  function resetAllData() {
    currentState = createDefaultStoreState();
    save();
    return currentState;
  }

  return {
    getState,
    save,
    getStatus,
    setStatus,
    isFavorite,
    toggleFavorite,
    getPosNote,
    setPosNote,
    createDeck,
    addWordsToDeck,
    recordWrongAnswer,
    resolveWrongAnswer,
    clearAllWrongAnswers,
    setTheme,
    setTtsSpeed,
    setGlobalMask,
    exportJsonBackup,
    importJsonBackup,
    resetAllData
  };
})();
