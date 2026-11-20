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
  { word: "家具", reading: "かぐ", meaning: "가구", pos: "명사", years: ["확인문제 01(한자읽기)"], example: "引っ越してから新しい家具を買った。", exampleReading: "ひっこしてからあたらしいかぐをかった。", exampleMeaning: "이사하고 나서 새 가구를 샀습니다." },
  { word: "加熱", reading: "かねつ", meaning: "가열", pos: "명사·する동사", years: ["확인문제 02(한자읽기)"], example: "電子レンジで十分に軽く加熱してください。", exampleReading: "でんしれんじでじゅうぶんにかんねつしてください。", exampleMeaning: "전자레인지로 충분히 가열해 주세요." },
  { word: "朝刊", reading: "ちょうかん", meaning: "조간", pos: "명사", years: ["확인문제 02(한자읽기)"], example: "毎朝、朝刊を読んでから出かける。", exampleReading: "まいあさ、ちょうかんをよんでからでかける。", exampleMeaning: "매일 아침 조간을 읽고 나갑니다." },
  { word: "月末", reading: "げつまつ", meaning: "월말, 그믐", pos: "명사", years: ["확인문제 03(한자읽기)"], example: "家賃は月末までに振り込みます。", exampleReading: "やちんはげつまつまでにふりこみます。", exampleMeaning: "월세는 월말까지 입금합니다." },
  { word: "広場", reading: "ひろば", meaning: "광장", pos: "명사", years: ["확인문제 02(한자읽기)"], example: "駅の前の広場でイベントが開かれた。", exampleReading: "えきのまえのひろばでいべんとがひらかれた。", exampleMeaning: "역 앞 광장에서 이벤트가 열렸습니다." },
  { word: "駐車", reading: "ちゅうしゃ", meaning: "주차", pos: "명사·する동사", years: ["확인문제 02(한자읽기)", "확인문제 16(표기)"], example: "駐車場がいっぱいなので別の場所に駐車した。", exampleReading: "ちゅうしゃじょうがいっぱいなのでべつのばしょにちゅうしゃした。", exampleMeaning: "주차장이 가득 차서 다른 곳에 주차했습니다." },
  { word: "現在", reading: "げんざい", meaning: "현재", pos: "명사", years: ["확인문제 02(한자읽기)"], example: "現在の人口は約五百万人です。", exampleReading: "げんざいのじんこうはやくごひゃくまんにんです。", exampleMeaning: "현재 인구는 약 500만 명입니다." },
  { word: "複数", reading: "ふくすう", meaning: "복수, 여럿", pos: "명사", years: ["확인문제 02(한자읽기)"], example: "複数の意見を比較して決めた。", exampleReading: "ふくすうのいけんをひかくしてきめた。", exampleMeaning: "복수의 의견을 비교해서 결정했습니다." },
  { word: "基本", reading: "きほん", meaning: "기본", pos: "명사", years: ["확인문제 03(한자읽기)"], example: "どんな勉強も基本が大切だ。", exampleReading: "どんなべんきょうもきほんがたいせつだ。", exampleMeaning: "어떤 공부든 기본이 중요합니다." },
  { word: "身長", reading: "しんちょう", meaning: "신장, 키", pos: "명사", years: ["확인문제 03(한자읽기)", "확인문제 08(한자읽기)"], example: "一年間で身長が五センチ伸びた。", exampleReading: "いちねんかんでしんちょうがごせんちのびた。", exampleMeaning: "1년 동안 키가 5cm 자랐습니다." },
  { word: "恋しい", reading: "こいしい", meaning: "그립다", pos: "い형용사", years: ["확인문제 03(한자읽기)"], example: "海外にいると故郷が恋しくなる。", exampleReading: "かいがいにいるとこきょうがこいしくなる。", exampleMeaning: "해외에 있으면 고향이 그리워집니다." },
  { word: "努力", reading: "どりょく", meaning: "노력", pos: "명사·する동사", years: ["확인문제 03(한자읽기)", "확인문제 08(한자읽기)"], example: "合格するために毎日努力した。", exampleReading: "ごうかくするためにまいにちどりょくした。", exampleMeaning: "합격하기 위해 매일 노력했습니다." },
  { word: "夕日", reading: "ゆうひ", meaning: "저녁노을, 지는 해", pos: "명사", years: ["확인문제 03(한자읽기)"], example: "海に沈むきれいな夕日を見た。", exampleReading: "うみにしずむきれいなゆうひをみた。", exampleMeaning: "바다로 지는 아름다운 저녁노을을 보았습니다." },
  { word: "感情的", reading: "かんじょうてき", meaning: "감정적", pos: "な형용사", years: ["확인문제 03(한자읽기)"], example: "感情的にならずに落ち着いて話そう。", exampleReading: "かんじょうてきにならずにおちついてはなそう。", exampleMeaning: "감정적이 되지 말고 차분하게 이야기합시다." },
  { word: "泣いて", reading: "ないて", meaning: "울며(泣く 활용형)", pos: "동사(오단·자동사)", years: ["확인문제 02(한자읽기)", "2010년 기출(표기)"], example: "赤ちゃんが大きな声で泣いていた。", exampleReading: "あかちゃんがおおきなこえでないていた。", exampleMeaning: "아기가 큰 소리로 울고 있었습니다." },
  { word: "郵便", reading: "ゆうびん", meaning: "우편", pos: "명사", years: ["확인문제 02(한자읽기)"], example: "郵便局から荷物を送った。", exampleReading: "ゆうびんきょくからにもつをおくった。", exampleMeaning: "우체국에서 짐을 보냈습니다." },
  { word: "名物", reading: "めいぶつ", meaning: "명물", pos: "명사", years: ["확인문제 04(한자읽기)"], example: "この町の名物は甘いお菓子だ。", exampleReading: "このまちのめいぶつはあまいおかしだ。", exampleMeaning: "이 마을의 명물은 달콤한 과자입니다." },
  { word: "容器", reading: "ようき", meaning: "용기, 그릇", pos: "명사", years: ["확인문제 04(한자읽기)"], example: "残った料理を容器に入れて保存する。", exampleReading: "のこったりょうりをようきにいれてほぞんする。", exampleMeaning: "남은 요리를 용기에 넣어 보관합니다." },
  { word: "最初", reading: "さいしょ", meaning: "최초, 처음", pos: "명사", years: ["확인문제 04(한자읽기)", "2010년 기출(표기)"], example: "最初に今日のスケジュールを確認します。", exampleReading: "さいしょにきょうのすけじゅーるをかくにんします。", exampleMeaning: "처음에 오늘 일정을 확인합니다." },
  { word: "石油", reading: "せきゆ", meaning: "석유", pos: "명사", years: ["확인문제 04(한자읽기)"], example: "石油の価格が上がってガソリンが高くなった。", exampleReading: "せきゆのかかくがあがってがそりんがたかくなった。", exampleMeaning: "석유 가격이 올라 휘발유가 비싸졌습니다." },
  { word: "動作", reading: "どうさ", meaning: "동작", pos: "명사", years: ["확인문제 04(한자읽기)"], example: "その機械はゆっくりした動作で動く。", exampleReading: "そのきかいはゆっくりしたどうさでうごく。", exampleMeaning: "그 기계는 느린 동작으로 움직입니다." },
  { word: "小型", reading: "こがた", meaning: "소형", pos: "명사·な형용사", years: ["확인문제 04(한자읽기)"], example: "持ち運びやすい小型のカメラを買った。", exampleReading: "もちはこびやすいこがたのかめらをかった。", exampleMeaning: "휴대하기 쉬운 소형 카메라를 샀습니다." },
  { word: "迎えて", reading: "むかえて", meaning: "맞이하며(迎える 활용형)", pos: "동사(일어·타동사)", years: ["확인문제 06(한자읽기)"], example: "駅で両親を笑顔で迎えた。", exampleReading: "えきでりょうしんをえがおでむかえた。", exampleMeaning: "역에서 부모님을 웃는 얼굴로 맞이했습니다." },
  { word: "事情", reading: "じじょう", meaning: "사정", pos: "명사", years: ["확인문제 07(한자읽기)"], example: "詳しい事情はあとで説明します。", exampleReading: "くわしいじじょうはあとでせつめいします。", exampleMeaning: "자세한 사정은 나중에 설명하겠습니다." },
  { word: "汗", reading: "あせ", meaning: "땀", pos: "명사", years: ["확인문제 07(한자읽기)"], example: "走ったあとでたくさんの汗をかいた。", exampleReading: "はしったあとでたくさんのあせをかいた。", exampleMeaning: "달린 뒤에 땀을 많이 흘렸습니다." },
  { word: "疑問", reading: "ぎもん", meaning: "의문", pos: "명사", years: ["확인문제 07(한자읽기)"], example: "わからないことがあったら疑問を解決しよう。", exampleReading: "わからないことがあったらぎもんをかいけつしよう。", exampleMeaning: "모르는 것이 있다면 의문을 해결합시다." },
  { word: "順番", reading: "じゅんばん", meaning: "순번, 차례", pos: "명사", years: ["확인문제 07(한자읽기)"], example: "順番に名前を呼ばれたら前に出てください。", exampleReading: "じゅんばんになまえをよばれたらまえにでてください。", exampleMeaning: "차례대로 이름이 불리면 앞으로 나와 주세요." },
  { word: "種類", reading: "しゅるい", meaning: "종류", pos: "명사", years: ["확인문제 06(한자읽기)"], example: "この店にはいろいろな種類のパンがある。", exampleReading: "このみせにはいろいろなしゅるいのぱんがある。", exampleMeaning: "이 가게에는 여러 종류의 빵이 있습니다." },
  { word: "方向", reading: "ほうこう", meaning: "방향", pos: "명사", years: ["확인문제 09(한자읽기)", "2020년 기출(표기)"], example: "風の吹く方向を確かめた。", exampleReading: "かぜのふくほうこうをたしかめた。", exampleMeaning: "바람이 부는 방향을 확인했습니다." },
  { word: "血液", reading: "けつえき", meaning: "혈액", pos: "명사", years: ["확인문제 06(한자읽기)", "확인문제 18(표기)"], example: "血液型を調べる検査を受けた。", exampleReading: "けつえきがたをしらべるけんさをうけた。", exampleMeaning: "혈액형을 조사하는 검사를 받았습니다." },
  { word: "提出", reading: "ていしゅつ", meaning: "제출", pos: "명사·する동사", years: ["확인문제 06(한자읽기)"], example: "レポートは金曜日までに提出してください。", exampleReading: "れぽーとはきんようびまでにていしゅつしてください。", exampleMeaning: "리포트는 금요일까지 제출해 주세요." },
  { word: "単語", reading: "たんご", meaning: "단어", pos: "명사", years: ["확인문제 09(한자읽기)"], example: "知らない単語はノートにメモしている。", exampleReading: "しらないたんごはのーとにめもしている。", exampleMeaning: "모르는 단어는 노트에 메모하고 있습니다." },
  { word: "交流", reading: "こうりゅう", meaning: "교류", pos: "명사·する동사", years: ["확인문제 09(한자읽기)", "2010년 기출(용법)"], example: "留学生と文化交流のイベントに参加した。", exampleReading: "りゅうがくせいとぶんかこうりゅうのいべんとにさんかした。", exampleMeaning: "유학생과 문화 교류 이벤트에 참가했습니다." },
  { word: "実力", reading: "じつりょく", meaning: "실력", pos: "명사", years: ["확인문제 09(한자읽기)"], example: "試験で自分の実力を発揮したい。", exampleReading: "しけんでじぶんのじつりょくをはっきしたい。", exampleMeaning: "시험에서 자신의 실력을 발휘하고 싶습니다." },
  { word: "勝った", reading: "かった", meaning: "이겼다(勝つ 과거형)", pos: "동사(오단·자동사)", years: ["확인문제 08(한자읽기)"], example: "応援のおかげで試合に勝った。", exampleReading: "おうえんのおかげでしあいにかった。", exampleMeaning: "응원 덕분에 시합에서 이겼습니다." },
  { word: "苦労", reading: "くろう", meaning: "고생", pos: "명사·する동사", years: ["확인문제 08(한자읽기)"], example: "アルバイトと勉強の両立で苦労した。", exampleReading: "あるばいととべんきょうのりょうりつでくろうした。", exampleMeaning: "아르바이트와 공부의 병행으로 고생했습니다." },
  { word: "位置", reading: "いち", meaning: "위치", pos: "명사", years: ["확인문제 09(한자읽기)"], example: "机の位置を窓の近くに変えた。", exampleReading: "つくえのいちをまどのちかくにかえた。", exampleMeaning: "책상 위치를 창가 근처로 바꾸었습니다." },
  { word: "留守", reading: "るす", meaning: "부재, 외출 중", pos: "명사", years: ["확인문제 11(한자읽기)"], example: "午後は留守になりますので電話に出られません。", exampleReading: "ごごはるすになりますのででんわにでられません。", exampleMeaning: "오후에는 부재중이므로 전화를 받을 수 없습니다." },
  { word: "包んで", reading: "つつんで", meaning: "싸서(包む 활용형)", pos: "동사(오단·타동사)", years: ["확인문제 11(한자읽기)"], example: "プレゼントをきれいな紙で包んだ。", exampleReading: "ぷれぜんともきれいながみでつつんだ。", exampleMeaning: "선물을 예쁜 종이로 감쌌습니다." },
  { word: "一般的", reading: "いっぱんてき", meaning: "일반적", pos: "な형용사", years: ["확인문제 10(한자읽기)"], example: "それは一般的な考え方ではない。", exampleReading: "それはいっぱんてきなかんがえかたではない。", exampleMeaning: "그것은 일반적인 사고방식이 아닙니다." },
  { word: "交通", reading: "こうつう", meaning: "교통", pos: "명사", years: ["확인문제 11(한자읽기)", "독해·청해 어휘"], example: "このあたりは交通量が多い。", exampleReading: "このあたりはこうつうりょうがおおい。", exampleMeaning: "이 부근은 교통량이 많습니다." },
  { word: "想像", reading: "そうぞう", meaning: "상상", pos: "명사·する동사", years: ["확인문제 11(한자읽기)"], example: "十年後の生活を想像してみた。", exampleReading: "じゅうねんごのせいかつをそうぞうしてみた。", exampleMeaning: "10년 뒤의 생활을 상상해 보았습니다." },
  { word: "首都", reading: "しゅと", meaning: "수도", pos: "명사", years: ["확인문제 10(한자읽기)"], example: "東京は日本の首都です。", exampleReading: "とうきょうはにほんのしゅとです。", exampleMeaning: "도쿄는 일본의 수도입니다." },
  { word: "調査", reading: "ちょうさ", meaning: "조사", pos: "명사·する동사", years: ["확인문제 10(한자읽기)"], example: "アンケートを使って調査を行った。", exampleReading: "あんけーとをつかってちょうさをおこなった。", exampleMeaning: "설문지를 이용해 조사를 진행했습니다." },
  { word: "申し込み", reading: "もうしこみ", meaning: "신청, 등록", pos: "명사·동사", years: ["2025년 기출(표기)"], example: "イベントの申し込みは来週までです。", exampleReading: "いべんとのもうしこみはらいしゅうまでです。", exampleMeaning: "이벤트 신청은 다음 주까지입니다." },
  { word: "集中", reading: "しゅうちゅう", meaning: "집중", pos: "명사·する동사", years: ["2025년 기출(표기)"], example: "静かな部屋で勉強に集中した。", exampleReading: "しずかなへやでべんきょうにしゅうちゅうした。", exampleMeaning: "조용한 방에서 공부에 집중했습니다." },
  { word: "預ける", reading: "あずける", meaning: "맡기다", pos: "동사(일어·타동사)", years: ["2020년 기출(표기)", "확인문제 14(표기)"], example: "駅のロッカーに荷物を預けた。", exampleReading: "えきのろっかーににもつをあずけた。", exampleMeaning: "역 사물함에 짐을 맡겼습니다." },
  { word: "重ねて", reading: "かさねて", meaning: "겹쳐서, 거듭(重ねる 활용형)", pos: "동사(일어·타동사)", years: ["2020년 기출(표기)", "확인문제 15(표기)", "확인문제 36(문맥구성)"], example: "お皿を二枚重ねて棚にしまった。", exampleReading: "おさらをにまいにかさねてたなにしまった。", exampleMeaning: "접시를 두 장 겹쳐서 선반에 넣었습니다." },
  { word: "吸う", reading: "すう", meaning: "들이마시다, 피우다", pos: "동사(오단·타동사)", years: ["2020년 기출(표기)", "확인문제 18(표기)"], example: "公園で新鮮な空気を深く吸った。", exampleReading: "こうえんでしんせんなおおきくくうきをふかくすった。", exampleMeaning: "공원에서 신선한 공기를 깊이 들이마셨습니다." },
  { word: "送信", reading: "そうしん", meaning: "송신", pos: "명사·する동사", years: ["2020년 기출(표기)", "확인문제 19(표기)"], example: "メールを送信する前に内容を確認する。", exampleReading: "めーるをそうしんするまえにないようをかくにんする。", exampleMeaning: "메일을 보내기 전에 내용을 확인합니다." },
  { word: "森林", reading: "しんりん", meaning: "삼림", pos: "명사", years: ["2020년 기출(표기)", "확인문제 20(표기)"], example: "この島には豊かな森林が広がっている。", exampleReading: "このしまにはゆたかなしんりんがひろがっている。", exampleMeaning: "이 섬에는 울창한 삼림이 펼쳐져 있습니다." },
  { word: "検査", reading: "けんさ", meaning: "검사", pos: "명사·する동사", years: ["확인문제 12(표기)"], example: "機械の安全検査を毎月行う。", exampleReading: "きかいのあんぜんけんさをまいつきおこなう。", exampleMeaning: "기계 안전 검사를 매달 진행합니다." },
  { word: "減りました", reading: "へりました", meaning: "줄어들었습니다(減る 정중 과거형)", pos: "동사(오단·자동사)", years: ["확인문제 12(표기)"], example: "今年の観光客は去年より減りました。", exampleReading: "ことしのかんこうきゃくはきょねんよりへりました。", exampleMeaning: "올해 관광객은 작년보다 줄어들었습니다." },
  { word: "周り", reading: "まわり", meaning: "주위, 둘레", pos: "명사", years: ["확인문제 12(표기)"], example: "駅の周りにコンビニや銀行がある。", exampleReading: "えきのまわりにこんびにゃぎんこうがある。", exampleMeaning: "역 주변에 편의점과 은행이 있습니다." },
  { word: "笑顔", reading: "えがお", meaning: "웃는 얼굴, 미소", pos: "명사", years: ["확인문제 12(표기)"], example: "子どもたちの笑顔を見ると元気になる。", exampleReading: "こどもたちのえがおをみるとげんきになる。", exampleMeaning: "아이들의 웃는 얼굴을 보면 기운이 납니다." },
  { word: "遅く", reading: "おそく", meaning: "늦게(遅い 부사형)", pos: "い형용사·부사", years: ["확인문제 15(표기)"], example: "昨日は夜遅くまで仕事をしていた。", exampleReading: "きのうはよるおそくまでしごとをしていた。", exampleMeaning: "어제는 밤늦게까지 일을 하고 있었습니다." },
  { word: "専門", reading: "せんもん", meaning: "전문", pos: "명사", years: ["확인문제 15(표기)"], example: "大学では経済学を専門に学んでいる。", exampleReading: "だいがくではけいざいがくをせんもんにまなんでいる。", exampleMeaning: "대학에서는 경제학을 전공으로 배우고 있습니다." },
  { word: "解決", reading: "かいけつ", meaning: "해결", pos: "명사·する동사", years: ["확인문제 16(표기)"], example: "話し合って問題を解決しよう。", exampleReading: "はなしあってもんだいをかいけつしよう。", exampleMeaning: "서로 이야기해서 문제를 해결합시다." },
  { word: "移る", reading: "うつる", meaning: "옮기다, 이사하다, 번지다", pos: "동사(오단·자동사)", years: ["확인문제 16(표기)"], example: "来月、新しいオフィスに移る予定だ。", exampleReading: "らいげつ、あたらしいおふぃすにうつるよていだ。", exampleMeaning: "다음 달에 새 사무실로 옮길 예정입니다." },
  { word: "熱心", reading: "ねっしん", meaning: "열심, 열성적", pos: "な형용사·명사", years: ["확인문제 16(표기)"], example: "彼は毎日熱心に日本語を練習している。", exampleReading: "かれはまいにちねっしんにほんごをれんしゅうしている。", exampleMeaning: "그는 매일 열심으로 일본어를 연습하고 있습니다." },
  { word: "焼いて", reading: "やいて", meaning: "구워서(焼く 활용형)", pos: "동사(오단·타동사)", years: ["확인문제 17(표기)"], example: "魚を焼いて夕飯に出した。", exampleReading: "さかなをやいてゆうはんにだした。", exampleMeaning: "생선을 구워서 저녁 식사로 냈습니다." },
  { word: "勤めて", reading: "つとめて", meaning: "근무하며(勤める 활용형)", pos: "동사(일어·자동사)", years: ["확인문제 17(표기)"], example: "姉は駅近くの病院に勤めている。", exampleReading: "あねはえきちかくのびょういんにつとめている。", exampleMeaning: "누나는 역 근처 병원에 근무하고 있습니다." },
  { word: "自信", reading: "じしん", meaning: "자신, 자신감", pos: "명사", years: ["확인문제 17(표기)"], example: "今回の試験には少し自信がある。", exampleReading: "こんかいのしけんにはすこしじしんがある。", exampleMeaning: "이번 시험에는 조금 자신이 있습니다." },
  { word: "気温", reading: "きおん", meaning: "기온", pos: "명사", years: ["확인문제 17(표기)"], example: "今日は昨日より気温が五度高い。", exampleReading: "きょうはきのうよりきおんがごどたかい。", exampleMeaning: "오늘은 어제보다 기온이 5도 높습니다." },
  { word: "成績", reading: "せいせき", meaning: "성적", pos: "명사", years: ["확인문제 18(표기)"], example: "テストの成績が良くて安心した。", exampleReading: "てすとのせいせきがよくてあんしんした。", exampleMeaning: "시험 성적이 좋아서 안심했습니다." },
  { word: "原因", reading: "げんいん", meaning: "원인", pos: "명사", years: ["확인문제 18(표기)"], example: "事故の原因を詳しく調べている。", exampleReading: "じこのげんいんをくわしくしらべている。", exampleMeaning: "사고 원인을 자세히 조사하고 있습니다." },
  { word: "減少", reading: "げんしょう", meaning: "감소", pos: "명사·する동사", years: ["확인문제 18(표기)"], example: "ゴミの量が少しずつ減少してきた。", exampleReading: "ごみのりょうがすこしずつげんしょうしてきた。", exampleMeaning: "쓰레기 양이 조금씩 감소해 왔습니다." },
  { word: "痛い", reading: "いたい", meaning: "아프다", pos: "い형용사", years: ["확인문제 19(표기)"], example: "たくさん歩いて足が痛くなった。", exampleReading: "たくさんあるいてあしがいたくなった。", exampleMeaning: "많이 걸어서 다리가 아파졌습니다." },
  { word: "頭痛", reading: "ずつう", meaning: "두통", pos: "명사", years: ["확인문제 19(표기)"], example: "パソコンを長く見すぎて頭痛がする。", exampleReading: "ぱそこんをながくみすぎてずつうがする。", exampleMeaning: "컴퓨터를 오래 봐서 두통이 납니다." },
  { word: "眠って", reading: "ねむって", meaning: "잠들어서(眠る 활용형)", pos: "동사(오단·자동사)", years: ["확인문제 19(표기)"], example: "赤ちゃんは静かに眠っている。", exampleReading: "あかちゃんはじずかにねむっている。", exampleMeaning: "아기가 조용히 잠들어 있습니다." },
  { word: "肝心", reading: "かんじん", meaning: "간절함, 가장 중요함", pos: "な형용사·명사", years: ["확인문제 19(표기)"], example: "肝心なところで約束を忘れないでね。", exampleReading: "かんじんなところでやくそくをわすれないでね。", exampleMeaning: "중요한 순간에 약속을 잊지 마세요." },
  { word: "移って", reading: "うつって", meaning: "옮겨서(移る 활용형)", pos: "동사(오단·자동사)", years: ["확인문제 20(표기)"], example: "去年、東京から大阪に引っ越して移った。", exampleReading: "きょねん、とうきょうからおおさかにひっこしてうつった。", exampleMeaning: "작년에 도쿄에서 오사카로 이사해 옮겼습니다." },
  { word: "浅く", reading: "あさく", meaning: "얕게(浅い 부사형)", pos: "い형용사·부사", years: ["확인문제 20(표기)"], example: "帽子を浅くかぶっている。", exampleReading: "ぼうしをあさくかぶっている。", exampleMeaning: "모자를 얕게 쓰고 있습니다." },
  { word: "帰宅", reading: "きたく", meaning: "귀가", pos: "명사·する동사", years: ["확인문제 20(표기)"], example: "今夜は九時ごろに帰宅するつもりだ。", exampleReading: "こんやはくじごろにきたくするつもりだ。", exampleMeaning: "오늘 밤은 9시쯤 귀가할 생각입니다." },
  { word: "相談", reading: "そうだん", meaning: "상담, 상의", pos: "명사·する동사", years: ["확인문제 20(표기)", "문법·예문 어휘"], example: "進路について先生に相談した。", exampleReading: "しんろについてせんせいにそうだんした。", exampleMeaning: "진로에 대해 선생님과 상의했습니다." },
  { word: "健康", reading: "けんこう", meaning: "건강", pos: "명사·な형용사", years: ["확인문제 20(표기)"], example: "健康のために毎朝散歩をしている。", exampleReading: "けんこうのためにまいあささんぽをしている。", exampleMeaning: "건강을 위해 매일 아침 산책을 하고 있습니다." },
  { word: "追って", reading: "おって", meaning: "뒤따라, 추후(追う 활용형)", pos: "동사·부사", years: ["2010년 기출(표기)"], example: "詳しい案内は追ってご連絡いたします。", exampleReading: "くわしいあんないはおってごれんらくいたします。", exampleMeaning: "자세한 안내는 추후 연락드리겠습니다." },
  { word: "週刊誌", reading: "しゅうかんし", meaning: "주간지", pos: "명사", years: ["2010년 기출(표기)"], example: "電車の中で週刊誌を読んでいる人が多い。", exampleReading: "でんしゃのなかでしゅうかんしをよんでいるひとがおおい。", exampleMeaning: "전철 안에서 주간지를 읽는 사람이 많습니다." },
  { word: "関係", reading: "かんけい", meaning: "관계", pos: "명사·する동사", years: ["2010년 기출(표기)"], example: "睡眠時間と健康は深い関係がある。", exampleReading: "すいみんじかんとけんこうはふかいかんけいがある。", exampleMeaning: "수면 시간과 건강은 깊은 관계가 있습니다." },
  { word: "投げて", reading: "なげて", meaning: "던져서(投げる 활용형)", pos: "동사(일어·타동사)", years: ["2010년 기출(표기)"], example: "ボールを遠くへ投げてキャッチした。", exampleReading: "ぼーるをとおくへなげてきゃっちした。", exampleMeaning: "공을 멀리 던져서 받았습니다." },
  { word: "独身", reading: "どくしん", meaning: "독신", pos: "명사", years: ["2010년 기출(표기)"], example: "彼はまだ独身で一人暮らしをしている。", exampleReading: "かれはまだどくしんでひとりぐらしをしている。", exampleMeaning: "그는 아직 독신으로 혼자 살고 있습니다." },
  { word: "涙", reading: "なみだ", meaning: "눈물", pos: "명사", years: ["2010년 기출(표기)"], example: "感動的な映画を見て涙が出た。", exampleReading: "かんどうてきなえいがをみてなみだがでた。", exampleMeaning: "감동적인 영화를 보고 눈물이 나왔습니다." },
  { word: "複雑", reading: "ふくざつ", meaning: "복잡하다", pos: "な형용사", years: ["2010년 기출(표기)"], example: "この機械の仕組みはとても複雑だ。", exampleReading: "このきかいのしくみはとてもふくざつだ。", exampleMeaning: "이 기계의 구조는 매우 복잡합니다." },
  { word: "輸出", reading: "ゆしゅつ", meaning: "수출", pos: "명사·する동사", years: ["2010년 기출(표기)"], example: "日本から多くの自動車が輸出されている。", exampleReading: "にほんからたくさんのじどうしゃがゆしゅつされている。", exampleMeaning: "일본에서 많은 자동차가 수출되고 있습니다." },
  { word: "波", reading: "なみ", meaning: "파도", pos: "명사", years: ["2010년 기출(표기)"], example: "今日は波が高いので泳がないでください。", exampleReading: "きょうはなみが高いのでおよがないでください。", exampleMeaning: "오늘은 파도가 높으니 수영하지 마세요." },
  { word: "貸す", reading: "かす", meaning: "빌려주다", pos: "동사(오단·타동사)", years: ["2010년 기출(표기)", "예상어휘(동사)"], example: "友達に傘を貸してあげた。", exampleReading: "ともだちにかさをかしてあげた。", exampleMeaning: "친구에게 우산을 빌려주었습니다." },
  { word: "信じる", reading: "しんじる", meaning: "믿다", pos: "동사(일어·타동사)", years: ["2010년 기출(표기)"], example: "自分の力を信じて最後まで頑張ろう。", exampleReading: "じぶんのちからをしんじてさいごまでがんばろう。", exampleMeaning: "자신의 힘을 믿고 끝까지 힘냅시다." },
  { word: "疲れる", reading: "つかれる", meaning: "피곤하다, 지치다", pos: "동사(일어·자동사)", years: ["2010년 기출(표기)"], example: "長時間運転してとても疲れた。", exampleReading: "ちょうじかんうんてんしてとてもつかれた。", exampleMeaning: "장시간 운전해서 매우 피곤했습니다." },
  { word: "アナウンス", reading: "あなうーんす", meaning: "아나운스, 안내 방송", pos: "명사·외래어", years: ["2025년 기출(문맥구성)"], example: "駅のアナウンスをよく聞いて電車に乗った。", exampleReading: "えきのあなうーんすをよくきいてでんしゃにのった。", exampleMeaning: "역 안내 방송을 잘 듣고 전철에 탔습니다." },
  { word: "案外", reading: "あんがい", meaning: "의외로, 생각보다", pos: "부사·な형용사", years: ["2025년 기출(문맥구성)"], example: "テストは難しそうだったが、案外簡単だった。", exampleReading: "てすとはむずかしそうだったが、あんがいかんたんだった。", exampleMeaning: "시험은 어려워 보였지만 의외로 쉬웠습니다." },
  { word: "くやしい", reading: "くやしい", meaning: "분하다, 억울하다", pos: "い형용사", years: ["2025년 기출(문맥구성)"], example: "あと少しで勝てたのに負けてくやしい。", exampleReading: "あとすこしでかてたのにまけてくやしい。", exampleMeaning: "조금만 더 하면 이길 수 있었는데 져서 분합니다." },
  { word: "しかたない", reading: "しかたない", meaning: "어쩔 수 없다, 할 수 없다", pos: "관용·접속·표현", years: ["2025년 기출(문맥구성)"], example: "雨が降ってきたから、散歩はしかたない。", exampleReading: "あめがふってきたから、さんぽはしかたない。", exampleMeaning: "비가 오기 시작했으니 산책은 어쩔 수 없습니다." },
  { word: "リスト", reading: "りすと", meaning: "리스트, 목록", pos: "명사·외래어", years: ["2025년 기출(문맥구성)"], example: "買い物に行く前に必要な物リストを作った。", exampleReading: "かいものにいくまえにひつようなものりすとをつくった。", exampleMeaning: "장 보러 가기 전에 필요한 물건 목록을 만들었습니다." },
  { word: "あきらめる", reading: "あきらめる", meaning: "포기하다", pos: "동사(일어·타동사)", years: ["2024년 기출(문맥구성)"], example: "まだ時間があるから、あきらめないで続けよう。", exampleReading: "まだじかんがあるから、あきらめないでつづけよう。", exampleMeaning: "아직 시간이 있으니 포기하지 말고 계속합시다." },
  { word: "うろうろ", reading: "うろうろ", meaning: "어슬렁어슬렁, 서성거리다", pos: "부사", years: ["2024년 기출(문맥구성)"], example: "駅の前で迷ったのか、うろうろしている人がいる。", exampleReading: "えきのまえでまよったのか、うろうろしているひとがいる。", exampleMeaning: "역 앞에서 길을 잃었는지 서성거리는 사람이 있습니다." },
  { word: "ぴったり", reading: "ぴったり", meaning: "딱 맞음", pos: "부사", years: ["2020년 기출(문맥구성)"], example: "この靴は私の足にぴったりだ。", exampleReading: "このくつはわたしのあしにぴったりだ。", exampleMeaning: "이 신발은 내 발에 딱 맞습니다." },
  { word: "原料", reading: "げんりょう", meaning: "원료", pos: "명사", years: ["2018년 기출(문맥구성)", "2010년 기출(용법)"], example: "このお菓子の主な原料は小麦と砂糖だ。", exampleReading: "このおかしのうおもなげんりょうはこむぎとさとうだ。", exampleMeaning: "이 과자의 주요 원료는 밀가루와 설탕입니다." },
  { word: "しっかり", reading: "しっかり", meaning: "단단히, 똑바로, 확실히", pos: "부사", years: ["2018년 기출(문맥구성)"], example: "寝る前に戸締まりをしっかり確認しよう。", exampleReading: "ねるまえにとじまりをしっかりかくにんしよう。", exampleMeaning: "자기 전에 문단속을 확실히 확인합시다." },
  { word: "組んで", reading: "くんで", meaning: "짜서, 짝을 지어(組む 활용형)", pos: "동사(오단·타동사)", years: ["확인문제 21(문맥구성)"], example: "二人一組でペアを組んで練習した。", exampleReading: "ふたりひとくみでぺあをくんでれんしゅうした。", exampleMeaning: "두 사람이 한 조로 짝을 지어 연습했습니다." },
  { word: "教師", reading: "きょうし", meaning: "교사", pos: "명사", years: ["확인문제 21(문맥구성)"], example: "私は将来、小学校の教師になりたい。", exampleReading: "わたしはしょうらい、しょうがっこうのきょうしになりたい。", exampleMeaning: "저는 장래에 초등학교 교사가 되고 싶습니다." },
  { word: "当たった", reading: "あたった", meaning: "당첨되었다, 맞았다(当たる 과거형)", pos: "동사(오단·자동사)", years: ["확인문제 21(문맥구성)"], example: "くじを引いたら一等が当たった。", exampleReading: "くじをひいたらittouがあたった。", exampleMeaning: "제비를 뽑았더니 1등이 당첨되었습니다." },
  { word: "記録", reading: "きろく", meaning: "기록", pos: "명사·する동사", years: ["확인문제 21(문맥구성)"], example: "今日の天気や気温をノートに記録する。", exampleReading: "きょうのてんきやきおんをのをーとにきろくする。", exampleMeaning: "오늘 날씨와 기온을 노트에 기록합니다." },
  { word: "欠席", reading: "けっせき", meaning: "결석", pos: "명사·する동사", years: ["확인문제 21(문맥구성)"], example: "風邪をひいたので今日の授業を欠席した。", exampleReading: "かぜをひいたのできょうのじゅぎょうをけっせきした。", exampleMeaning: "감기에 걸려서 오늘 수업을 결석했습니다." },
  { word: "温める", reading: "あたためる", meaning: "데우다, 따뜻하게 하다", pos: "동사(일어·타동사)", years: ["확인문제 21(문맥구성)"], example: "冷えたスープをレンジで温めた。", exampleReading: "ひえたすーぷをれんじであたためた。", exampleMeaning: "식은 수프를 전자레인지로 데웠습니다." },
  { word: "暮らした", reading: "くらした", meaning: "지냈다, 살았다(暮らす 과거형)", pos: "동사(오단·자동사)", years: ["확인문제 21(문맥구성)"], example: "子どものころは田舎で元気に暮らした。", exampleReading: "こどものころはいなかでげんきにくらした。", exampleMeaning: "어린 시절은 시골에서 건강하게 지냈습니다." },
  { word: "とじて", reading: "とじて", meaning: "닫아서(閉じる 활용형)", pos: "동사(일어·타동사)", years: ["확인문제 35(문맥구성)"], example: "テストを始めるから、教科書をとじてください。", exampleReading: "てすとをはじめるから、きょうかしょをとじてください。", exampleMeaning: "시험을 시작하니까 교과서를 덮어 주세요." },
  { word: "そっくり", reading: "そっくり", meaning: "쏙 빼닮음, 그대로", pos: "부사·な형용사", years: ["확인문제 21(문맥구성)", "2010년 기출(용법)"], example: "彼は父親に顔も声もそっくりだ。", exampleReading: "かれはちちおやにかおもこえもそっくりだ。", exampleMeaning: "그는 아버지와 얼굴도 목소리도 똑같습니다." },
  { word: "ぐっすり", reading: "ぐっすり", meaning: "푹, 깊이", pos: "부사", years: ["확인문제 22(문맥구성)", "2024년 기출(용법)"], example: "昨日は疲れていたのでぐっすり眠れた。", exampleReading: "きのうはつかれていたのでぐっすりねむれた。", exampleMeaning: "어제는 피곤해서 푹 잘 수 있었습니다." },
  { word: "おぼれた", reading: "おぼれた", meaning: "물에 빠졌다, 익사할 뻔했다", pos: "동사(일어·자동사)", years: ["2010년 기출(문맥구성)"], example: "深いところで泳いで、おぼれそうになった。", exampleReading: "ふかいところでおよいで、おぼれそうになった。", exampleMeaning: "깊은 곳에서 수영하다가 물에 빠질 뻔했습니다." },
  { word: "さまざまな", reading: "さまざまな", meaning: "다양한, 여러 가지의", pos: "관용·접속·표현", synonym: "いろいろな", years: ["2021년 기출(유의표현)"], example: "会場にはさまざまな国の人が集まっている。", exampleReading: "かいじょうにはさまざまなぐにのひとがあつまっている。", exampleMeaning: "행사장에는 다양한 나라 사람들이 모여 있습니다." },
  { word: "そっと", reading: "そっと", meaning: "살며시, 조용히", pos: "부사", synonym: "静かに", years: ["2021년 기출(유의표현)"], example: "赤ちゃんを起こさないように、そっと部屋を出た。", exampleReading: "あかちゃんをおこさないように、そっとへやをでた。", exampleMeaning: "아기가 깨지 않도록 살며시 방을 나왔습니다." },
  { word: "たちました", reading: "たちました", meaning: "지났습니다(立つ/経つ 과거형)", pos: "동사(오단·자동사)", years: ["2021년 기출(유의표현)"], example: "日本に来てからもう三年がたちました。", exampleReading: "にほんにきてからもうさんねんがたちました。", exampleMeaning: "일본에 온 지 벌써 3년이 지났습니다." },
  { word: "おしまい", reading: "おしまい", meaning: "끝, 다 떨어짐", pos: "명사", synonym: "おわり", years: ["2021년 기출(유의표현)"], example: "今日の放送はこれでおしまいです。", exampleReading: "きょうのほうそうはこれでおしまいです。", exampleMeaning: "오늘 방송은 이것으로 끝입니다." },
  { word: "きつい", reading: "きつい", meaning: "힘들다, 빡세다", pos: "い형용사", synonym: "大変だ", years: ["2021년 기출(유의표현)"], example: "今日の練習はとてもきつかった。", exampleReading: "きょうのれんしゅうはとてもきつかった。", exampleMeaning: "오늘 연습은 매우 힘들었습니다." },
  { word: "チャンス", reading: "ちゃんす", meaning: "찬스, 기회", pos: "외래어", synonym: "機会", years: ["2021년 기출(유의표현)"], example: "留学できるいいチャンスを逃さないで。", exampleReading: "りゅうがくできるいいちゃんすをのがさないで。", exampleMeaning: "유학할 수 있는 좋은 기회를 놓치지 마세요." },
  { word: "かならず", reading: "かならず", meaning: "반드시, 꼭", pos: "부사", synonym: "ぜったいに", years: ["2021년 기출(유의표현)"], example: "明日はかならず朝七時に起きます。", exampleReading: "あしたはかならずあさしちじにおきます。", exampleMeaning: "내일은 반드시 아침 7시에 일어납니다." },
  { word: "報告する", reading: "ほうこくする", meaning: "보고하다", pos: "동사(する동사)", synonym: "知らせる", years: ["2021년 기출(유의표현)"], example: "調査の結果を部長に報告した。", exampleReading: "ちょうさのけっかをぶちょうにほうこくした。", exampleMeaning: "조사 결과를 부장님께 보고했습니다." },
  { word: "あたえる", reading: "あたえる", meaning: "주다, 부여하다", pos: "동사(일어·타동사)", synonym: "あげる", years: ["2022년 기출(유의표현)"], example: "植物に十分な水と光をあたえる。", exampleReading: "しょくぶつにじゅうぶんなみずとひかりをあたえる。", exampleMeaning: "식물에 충분한 물과 빛을 줍니다." },
  { word: "グラウンド", reading: "ぐらうんど", meaning: "운동장, 그라운드", pos: "외래어", synonym: "運動場", years: ["2022년 기출(유의표현)"], example: "体育の授業でグラウンドを走った。", exampleReading: "たいいくのじゅぎょうでぐらうんどをはしった。", exampleMeaning: "체육 수업에서 운동장을 달렸습니다." },
  { word: "詳しい", reading: "くわしい", meaning: "자세하다, 밝다", pos: "い형용사", synonym: "よく知っている", years: ["2022년 기출(유의표현)"], example: "この町の歴史に詳しい人が多い。", exampleReading: "このまちのれきしにくわしいひとがおおい。", exampleMeaning: "이 마을 역사에 밝은 사람이 많습니다." },
  { word: "スケジュール", reading: "すけじゅーる", meaning: "스케줄, 일정", pos: "외래어", synonym: "予定", years: ["2022년 기출(유의표현)", "예상어휘(외래어)"], example: "旅行のスケジュールをみんなで決めた。", exampleReading: "りょこうのすけじゅーるをみんなできめた。", exampleMeaning: "여행 일정을 다 같이 정했습니다." },
  { word: "ふだん", reading: "ふだん", meaning: "평소, 늘", pos: "명사·부사", synonym: "普段・いつも", years: ["2022년 기출(유의표현)"], example: "ふだんは電車で通勤しています。", exampleReading: "ふだんはでんしゃでつうきんしています。", exampleMeaning: "평소에는 전철로 출근하고 있습니다." },
  { word: "ようやく", reading: "ようやく", meaning: "겨우, 마침내", pos: "부사", synonym: "やっと", years: ["확인문제 40(유의표현)"], example: "長い練習の末、ようやく大会に出られるようになった。", exampleReading: "ながいれんしゅうのすえ、ようやくたいかいにでられるようになった。", exampleMeaning: "긴 연습 끝에 겨우 대회에 나갈 수 있게 되었습니다." },
  { word: "ほとんど", reading: "ほとんど", meaning: "거의", pos: "부사·명사", synonym: "大半・だいたい", years: ["확인문제 41(유의표현)"], example: "宿題はほとんど終わりました。", exampleReading: "しゅくだいはほとんどおわりました。", exampleMeaning: "숙제는 거의 끝났습니다." },
  { word: "いきなり", reading: "いきなり", meaning: "갑자기, 불쑥", pos: "부사", synonym: "急に・突然", years: ["확인문제 41(유의표현)", "예상어휘(부사)", "예상어휘(확인문제)"], example: "会議中にいきなり大きな音がした。", exampleReading: "かいぎちゅうにいきなりおおきなおとがした。", exampleMeaning: "회의 중에 갑자기 큰 소리가 났습니다." },
  { word: "少しずつ", reading: "すこしずつ", meaning: "조금씩", pos: "부사", synonym: "だんだん", years: ["확인문제 41(유의표현)"], example: "毎日少しずつ日本語の単語を覚えている。", exampleReading: "まいにちすこしずつにほんごのたんごをおぼえている。", exampleMeaning: "매일 조금씩 일본어 단어를 외우고 있습니다." },
  { word: "わけ", reading: "わけ", meaning: "까닭, 이유, 사정", pos: "명사", synonym: "理由", years: ["확인문제 41(유의표현)"], example: "彼が今日休んだわけがわかった。", exampleReading: "かれがきょうやすんだわけがわかった。", exampleMeaning: "그가 오늘 쉰 이유를 알았습니다." },
  { word: "おそろしい", reading: "おそろしい", meaning: "무섭다, 두렵다", pos: "い형용사", synonym: "こわい", years: ["확인문제 41(유의표현)"], example: "夜の山道は少しおそろしい。", exampleReading: "よるのやまみちはすこしおそろしい。", exampleMeaning: "밤 산길은 조금 무섭습니다." },
  { word: "減る", reading: "へる", meaning: "줄어들다", pos: "동사(오단·자동사)", years: ["확인문제 41(유의표현)", "2010년 기출(용법)"], example: "夏休みになると街の人が減る。", exampleReading: "なつやすみになるとまちのひとがへる。", exampleMeaning: "여름방학이 되면 거리 사람이 줄어듭니다." },
  { word: "楽だ", reading: "らくだ", meaning: "편하다, 수월하다", pos: "な형용사", synonym: "簡単だ・気楽だ", years: ["2020년 기출(유의표현)"], example: "この靴は歩きやすくてとても楽だ。", exampleReading: "このくつははあるきやすくてとてもらくだ。", exampleMeaning: "이 신발은 걷기 편해서 매우 편합니다." },
  { word: "あらゆる", reading: "あらゆる", meaning: "온갖, 모든", pos: "관용·접속·표현", synonym: "すべての", years: ["2020년 기출(유의표현)"], example: "あらゆる可能性を考えて準備しよう。", exampleReading: "あらゆるかのうせいをかんがえてじゅんびしよう。", exampleMeaning: "모든 가능성을 생각해서 준비합시다." },
  { word: "協力する", reading: "きょうりょくする", meaning: "협력하다", pos: "동사(する동사)", synonym: "力を合わせる", years: ["2020년 기출(유의표현)"], example: "イベントの成功のためにみんなで協力する。", exampleReading: "いべんとせいこうのためにみんなできょうりょくする。", exampleMeaning: "이벤트 성공을 위해 다 같이 협력합니다." },
  { word: "まぶしい", reading: "まぶしい", meaning: "눈부시다", pos: "い형용사", synonym: "明るすぎる", years: ["2020년 기출(유의표현)"], example: "冬の朝日は雪に反射してまぶしい。", exampleReading: "ふゆのあさひはゆきにはんしゃしてまぶしい。", exampleMeaning: "겨울 아침 햇살은 눈에 반사되어 눈부십니다." },
  { word: "そのまま", reading: "そのまま", meaning: "그대로", pos: "부사·명사", synonym: "何も変えないで", years: ["2010년 기출(유의표현)", "예상어휘(부사)"], example: "書類は元の場所にそのまま置いてください。", exampleReading: "しょるいはもとのばしょにそのままおいてください。", exampleMeaning: "서류는 원래 자리에 그대로 두어 주세요." },
  { word: "あまり", reading: "あまり", meaning: "별로(부정 호응), 그다지", pos: "부사", synonym: "そんなに", years: ["2010년 기출(유의표현)"], example: "このスープはあまり辛くない。", exampleReading: "このすーぷはあまりからくない。", exampleMeaning: "이 수프는 별로 맵지 않습니다." },
  { word: "ぜんぜん", reading: "ぜんぜん", meaning: "전혀", pos: "부사", synonym: "まったく", years: ["2010년 기출(유의표현)"], example: "漢字はまだぜんぜん読めない。", exampleReading: "かんじはまだぜんぜんよめない。", exampleMeaning: "한자는 아직 전혀 읽을 수 없습니다." },
  { word: "くたびれた", reading: "くたびれた", meaning: "지쳤다, 피곤하다", pos: "동사(일어·자동사)", years: ["2010년 기출(유의표현)"], example: "長い会議が続いてくたびれた。", exampleReading: "ながいかいぎがつづいてくたびれた。", exampleMeaning: "긴 회의가 이어져서 지쳤습니다." },
  { word: "共通点", reading: "きょうつうてん", meaning: "공통점", pos: "명사", synonym: "おなじところ", years: ["2010년 기출(유의표현)"], example: "二人の意見の共通点を探してみよう。", exampleReading: "ふたりのいけんのきょうつうてんをさがしてみよう。", exampleMeaning: "두 사람 의견의 공통점을 찾아봅시다." },
  { word: "多少", reading: "たしょう", meaning: "다소, 약간", pos: "부사·명사", synonym: "すこし・ちょっと", years: ["2010년 기출(유의표현)"], example: "予定より多少時間がかかるかもしれない。", exampleReading: "よていよりたしょうじかんがかかるかもしれない。", exampleMeaning: "예정보다 다소 시간이 걸릴지도 모릅니다." },
  { word: "落ち着く", reading: "おちつく", meaning: "진정되다, 차분해지다", pos: "동사(오단·자동사)", years: ["2024년 기출(용법)"], example: "深呼吸をして気持ちを落ち着かせた。", exampleReading: "しんこきゅうをしてきもちをおちつかせた。", exampleMeaning: "심호흡을 하고 마음을 진정시켰습니다." },
  { word: "にこにこ", reading: "にこにこ", meaning: "방긋방긋, 생긋", pos: "부사", years: ["2024년 기출(용법)"], example: "赤ちゃんがにこにこ笑っている。", exampleReading: "あかちゃんがいいにこにこわらっている。", exampleMeaning: "아기가 방긋방긋 웃고 있습니다." },
  { word: "通り過ぎる", reading: "とおりすぎる", meaning: "지나가다, 지나쳐 버리다", pos: "동사(일어·자동사)", years: ["2020년 기출(용법)"], example: "目的の駅をうっかり通り過ぎてしまった。", exampleReading: "もくてきのえきをうっかりとおりすぎてしまった。", exampleMeaning: "목적지 역을 깜빡하고 지나쳐 버렸습니다." },
  { word: "だるい", reading: "だるい", meaning: "나른하다, 몸이 무겁다", pos: "い형용사", years: ["2020년 기출(용법)"], example: "寝不足のせいで体全体がだるい。", exampleReading: "ねぶそくのせいでからだぜんたいがだるい。", exampleMeaning: "수면 부족 탓에 몸 전체가 나른합니다." },
  { word: "気づく", reading: "きづく", meaning: "깨닫다, 눈치채다", pos: "동사(오단·자동사)", years: ["2020년 기출(용법)", "예상어휘(관용·접속)"], example: "財布を忘れたことに駅で気づいた。", exampleReading: "さいふをわすれたことにえきできづいた。", exampleMeaning: "지갑을 잊어버린 것을 역에서 깨달았습니다." },
  { word: "お互いに", reading: "おたがいに", meaning: "서로, 피차", pos: "부사·명사", years: ["2010년 기출(용법)"], example: "お互いに助け合って仕事を終えた。", exampleReading: "おたがいにたすけあってしごとをおえた。", exampleMeaning: "서로 도와가며 일을 마쳤습니다." },
  { word: "身につける", reading: "みにつける", meaning: "익히다, 몸에 붙이다", pos: "동사(일어·타동사)", years: ["2010년 기출(용법)"], example: "毎日練習して英会話の力を身につけた。", exampleReading: "まいにちれんしゅうしてえいかいわのちからをみにつけた。", exampleMeaning: "매일 연습해서 영어 회화 실력을 익혔습니다." },
  { word: "詰める", reading: "つめる", meaning: "채워 넣다, 싸다, 줄이다", pos: "동사(일어·타동사)", years: ["2010년 기출(용법)"], example: "旅行かばんに服を詰めた。", exampleReading: "りょこうかばんにふくをつめた。", exampleMeaning: "여행 가방에 옷을 채워 넣었습니다." },
  { word: "募集", reading: "ぼしゅう", meaning: "모집", pos: "명사·する동사", years: ["2010년 기출(용법)"], example: "イベントのスタッフを募集している。", exampleReading: "いべんとすたっふをぼしゅうしている。", exampleMeaning: "이벤트 스태프를 모집하고 있습니다." },
  { word: "減らす", reading: "へらす", meaning: "줄이다", pos: "동사(오단·타동사)", years: ["2010년 기출(용법)"], example: "甘いお菓子の量を減らすことにした。", exampleReading: "あまいおかしのりょうをへらすことにした。", exampleMeaning: "단 과자 양을 줄이기로 했습니다." },
  { word: "進歩", reading: "しんぽ", meaning: "진보", pos: "명사·する동사", years: ["2010년 기출(용법)"], example: "技術の進歩で生活が便利になった。", exampleReading: "ぎじゅつのしんぽでせいかつがべんりになった。", exampleMeaning: "기술 진보로 생활이 편리해졌습니다." },
  { word: "あわてる", reading: "あわてる", meaning: "당황하다, 허둥대다", pos: "동사(일어·자동사)", years: ["2010년 기출(용법)"], example: "遅刻しそうになってあわてて家を出た。", exampleReading: "ちこくしそうになってあわてていえをでた。", exampleMeaning: "지각할 것 같아서 당황하며 집을 나섰습니다." },
  { word: "資格", reading: "しかく", meaning: "자격", pos: "명사", years: ["2010년 기출(용법)", "청해 발음 구별"], example: "就職のためにパソコンの資格を取った。", exampleReading: "しゅうしょくのためにぱそこんのしかくをとった。", exampleMeaning: "취업을 위해 컴퓨터 자격증을 땄습니다." },
  { word: "見本", reading: "みほん", meaning: "견본, 샘플", pos: "명사", years: ["2010년 기출(용법)"], example: "注文する前に実物の見本を見た。", exampleReading: "ちゅうもんするまえにじつぶつのみほんをみた。", exampleMeaning: "주문하기 전에 실물 견본을 보았습니다." },

  // 예상어휘: 명사 · 동사 · い/な형용사 · 부사 · 외래어 · 접사 · 유의어/관용구/접속사/합성동사 · 확인문제
  { word: "打ち合わせ", reading: "うちあわせ", meaning: "사전 협의, 미팅", pos: "명사", years: ["예상어휘(명사)"], example: "発表の前にメンバーと打ち合わせをした。", exampleReading: "はっぴょうのまえにめんばーとうちあわせをした。", exampleMeaning: "발표 전에 멤버들과 사전 협의를 했습니다." },
  { word: "きっかけ", reading: "きっかけ", meaning: "계기, 실마리", pos: "명사", years: ["예상어휘(명사)", "예상어휘(확인문제)"], example: "映画を見たのがきっかけで日本語に興味を持った。", exampleReading: "えいがをみたのがきっかけでにほんごにきょうみをもった。", exampleMeaning: "영화를 본 것이 계기가 되어 일본어에 흥미를 가졌습니다." },
  { word: "記入", reading: "きにゅう", meaning: "기입, 적어 넣음", pos: "명사·する동사", years: ["예상어휘(명사)"], example: "申込用紙に名前と住所を記入する。", exampleReading: "もうしこみようしになまえとじゅうしょをきにゅうする。", exampleMeaning: "신청서에 이름과 주소를 기입합니다." },
  { word: "支払い", reading: "しはらい", meaning: "지불, 결제", pos: "명사", years: ["예상어휘(명사)"], example: "支払いは現金でもカードでもできます。", exampleReading: "しはらいはげんきんめもかーどでもできます。", exampleMeaning: "결제는 현금으로도 카드로도 할 수 있습니다." },
  { word: "習慣", reading: "しゅうかん", meaning: "습관", pos: "명사", years: ["예상어휘(명사)"], example: "毎朝コップ一杯の水を飲む習慣がある。", exampleReading: "まいあさこっぷいっぱいのみずをのむしゅうかんがある。", exampleMeaning: "매일 아침 물 한 컵을 마시는 습관이 있습니다." },
  { word: "使い道", reading: "つかいみち", meaning: "용도, 쓸모", pos: "명사", years: ["예상어휘(명사)"], example: "もらったポイントの使い道を考えている。", exampleReading: "もらったぽいんとのつかいみちをかんがえている。", exampleMeaning: "받은 포인트 사용처를 생각하고 있습니다." },
  { word: "保存", reading: "ほぞん", meaning: "보존, 저장", pos: "명사·する동사", years: ["예상어휘(명사)"], example: "大切なデータはパソコンに保存しておく。", exampleReading: "たいせつなでーたはぱそこんにほぞんしておく。", exampleMeaning: "소중한 데이터는 컴퓨터에 저장해 둡니다." },
  { word: "単位", reading: "たんい", meaning: "단위, 학점", pos: "명사", years: ["예상어휘(명사)"], example: "今年は必要な単位を全部取れた。", exampleReading: "ことしはひつようなたんいをぜんぶとれた。", exampleMeaning: "올해는 필요한 학점을 전부 땄습니다." },
  { word: "分解", reading: "ぶんかい", meaning: "분해", pos: "명사·する동사", years: ["예상어휘(명사)"], example: "掃除のために部品を分解して洗った。", exampleReading: "そうじのためにぶひんをぶんかいしてあらった。", exampleMeaning: "청소를 위해 부품을 분해해 씻었습니다." },
  { word: "商品", reading: "しょうひん", meaning: "상품", pos: "명사", years: ["예상어휘(명사)"], example: "この店には季節ごとの新商品がある。", exampleReading: "このみせにはきせつごとのしんしょうひんがある。", exampleMeaning: "이 가게에는 계절별 신상품이 있습니다." },
  { word: "人生", reading: "じんせい", meaning: "인생", pos: "명사", years: ["예상어휘(명사)"], example: "留学の経験は私の人生にとって大きな財産だ。", exampleReading: "りゅうがくのけいけんはわたしのじんせいにとっておおきなぜいさんだ。", exampleMeaning: "유학 경험은 내 인생에 큰 재산입니다." },
  { word: "反対", reading: "はんたい", meaning: "반대", pos: "명사·な형용사·する동사", years: ["예상어휘(명사)"], example: "その計画には賛成と反対の意見がある。", exampleReading: "そのけいかくにはさんせいとはんたいのいけんがある。", exampleMeaning: "그 계획에는 찬성과 반대 의견이 있습니다." },
  { word: "話し合い", reading: "はなしあい", meaning: "논의, 대화, 상의", pos: "명사", years: ["예상어휘(명사)"], example: "クラス全員で話し合いをしてルールを決めた。", exampleReading: "くらすぜんいんではなしあいをしてるーるをきめた。", exampleMeaning: "반 전원이 논의해서 규칙을 정했습니다." },
  { word: "発行", reading: "はっこう", meaning: "발행", pos: "명사·する동사", years: ["예상어휘(명사)"], example: "新しい学生証が来週発行される。", exampleReading: "あたらしいがくせいしょうがらいしゅうはっこうされる。", exampleMeaning: "새 학생증이 다음 주에 발행됩니다." },
  { word: "ながめ", reading: "ながめ", meaning: "전망, 경치", pos: "명사", years: ["예상어휘(명사)", "예상어휘(확인문제)"], example: "展望台からのながめはとてもきれいだった。", exampleReading: "てんぼうだいからのながめはとてもきれいだった。", exampleMeaning: "전망대에서 본 경치는 매우 예뻤습니다." },
  { word: "受かる", reading: "うかる", meaning: "합격하다", pos: "동사(오단·자동사)", years: ["예상어휘(동사)"], example: "努力したおかげで試験に受かった。", exampleReading: "どりょくしたおかげでしけんにうかった。", exampleMeaning: "노력한 덕분에 시험에 합격했습니다." },
  { word: "取り入れる", reading: "とりいれる", meaning: "받아들이다, 도입하다", pos: "동사(일어·타동사)", years: ["예상어휘(동사)"], example: "生活の中に軽い運動を取り入れている。", exampleReading: "せいかつのなかにかるいうんどうをとりいれている。", exampleMeaning: "생활 속에 가벼운 운동을 도입하고 있습니다." },
  { word: "支配する", reading: "しはいする", meaning: "지배하다, 다스리다", pos: "동사(する동사)", years: ["예상어휘(동사)", "예상어휘(확인문제)"], example: "感情に支配されず冷静に判断したい。", exampleReading: "かんじょうにしはいされずれいせいにんだんしたい。", exampleMeaning: "감정에 지배당하지 않고 냉정하게 판단하고 싶습니다." },
  { word: "優れる", reading: "すぐれる", meaning: "뛰어나다, 우수하다", pos: "동사(일어·자동사)", years: ["예상어휘(동사)"], example: "彼女は語学力に優れている。", exampleReading: "かのじょはごがくりょくにすぐれている。", exampleMeaning: "그녀는 어학 능력이 뛰어납니다." },
  { word: "ありがたい", reading: "ありがたい", meaning: "고맙다, 감사하다", pos: "い형용사", years: ["예상어휘(い형용사)"], example: "忙しいのに手伝ってもらって本当にありがたい。", exampleReading: "いそがしいのにてつだってもらってほんとうにありがたい。", exampleMeaning: "바쁜데 도와줘서 정말 고맙습니다." },
  { word: "かわいらしい", reading: "かわいらしい", meaning: "귀엽다, 사랑스럽다", pos: "い형용사", years: ["예상어휘(い형용사)", "예상어휘(확인문제)"], example: "小さな子どもがかわいらしい声で歌った。", exampleReading: "ちいさなこどもがかわいらしいこえでうたった。", exampleMeaning: "어린아이가 귀여운 목소리로 노래했습니다." },
  { word: "とんでもない", reading: "とんでもない", meaning: "말도 안 되다, 천만에", pos: "い형용사", years: ["예상어휘(い형용사)", "예상어휘(확인문제)"], example: "「お礼なんて」「とんでもない、当たり前のことです」", exampleReading: "「おれいなんて」「とんでもない、あたりまえのことです」", exampleMeaning: "“감사 인사는요.” “천만에요, 당연한 일입니다.”" },
  { word: "あたりまえだ", reading: "あたりまえだ", meaning: "당연하다", pos: "な형용사", years: ["예상어휘(な형용사)", "예상어휘(확인문제)"], example: "約束を守ることはあたりまえだ。", exampleReading: "やくそくをまもることはあたりまえだ。", exampleMeaning: "약속을 지키는 것은 당연합니다." },
  { word: "幸せだ", reading: "しあわせだ", meaning: "행복하다", pos: "な형용사", years: ["예상어휘(な형용사)"], example: "家族と一緒に食事ができると幸せだと思う。", exampleReading: "かぞくといっしょにしょくじができるとしあわせだとおもう。", exampleMeaning: "가족과 함께 식사할 수 있으면 행복하다고 생각합니다." },
  { word: "なめらかだ", reading: "なめらかだ", meaning: "매끄럽다, 부드럽다", pos: "な형용사", years: ["예상어휘(な형용사)"], example: "よく混ぜたクリームはとてもなめらかだ。", exampleReading: "よくまぜたくりーむはとてもなめらかだ。", exampleMeaning: "잘 섞은 크림은 매우 매끄럽습니다." },
  { word: "まれだ", reading: "まれだ", meaning: "드물다, 희귀하다", pos: "な형용사", years: ["예상어휘(な형용사)"], example: "この地域で雪が降るのはとてもまれだ。", exampleReading: "このちいきでゆきがふるのはとてもまれだ。", exampleMeaning: "이 지역에서 눈이 내리는 것은 매우 드뭅니다." },
  { word: "いよいよ", reading: "いよいよ", meaning: "드디어, 마침내, 갈수록", pos: "부사", years: ["예상어휘(부사)"], example: "明日はいよいよ試験本番だ。", exampleReading: "あしたはいよいよしけんほんばんだ。", exampleMeaning: "내일은 드디어 시험 당일입니다." },
  { word: "必ずしも〜ない", reading: "かならずしも〜ない", meaning: "반드시 ~한 것은 아니다", pos: "부사", years: ["예상어휘(부사)", "예상어휘(확인문제)"], example: "高いものが必ずしも良いとは限らない。", exampleReading: "たかいものがかならずしもよいとはかぎらない。", exampleMeaning: "비싼 것이 반드시 좋다고는 할 수 없습니다." },
  { word: "さっさと", reading: "さっさと", meaning: "어서, 재빨리", pos: "부사", years: ["예상어휘(부사)"], example: "宿題をさっさと終わらせて遊びに行こう。", exampleReading: "しゅくだいをさっさとおわらせてあそびにいこう。", exampleMeaning: "숙제를 얼른 끝내고 놀러 갑시다." },
  { word: "更に", reading: "さらに", meaning: "더욱, 한층 더", pos: "부사", years: ["예상어휘(부사)"], example: "練習を重ねて、更に技術を磨きたい。", exampleReading: "れんしゅうをかさねて、さらにぎじゅつをみがきたい。", exampleMeaning: "연습을 거듭해 더욱 기술을 갈고닦고 싶습니다." },
  { word: "ずいぶん", reading: "ずいぶん", meaning: "꽤, 상당히", pos: "부사·な형용사", years: ["2010년 기출(문맥구성)", "예상어휘(부사)"], example: "久しぶりに会ったら、ずいぶん背が伸びていた。", exampleReading: "ひさしぶりにおあったら、ずいぶんせがのびていた。", exampleMeaning: "오랜만에 만났더니 꽤 키가 자라 있었습니다." },
  { word: "せっかく", reading: "せっかく", meaning: "모처럼, 애써", pos: "부사", years: ["예상어휘(부사)"], example: "せっかく作った料理だから冷めないうちに食べよう。", exampleReading: "せっかくつくったりょうりだからさめないうちにたべよう。", exampleMeaning: "모처럼 만든 요리니까 식기 전에 먹읍시다." },
  { word: "たちまち", reading: "たちまち", meaning: "금세, 순식간에", pos: "부사", years: ["예상어휘(부사)"], example: "強い雨が降って、道がたちまちぬれた。", exampleReading: "つよいあめがふって、みちがたちまちぬれた。", exampleMeaning: "센 비가 내려서 길이 순식간에 젖었습니다." },
  { word: "ただちに", reading: "ただちに", meaning: "즉시, 곧바로", pos: "부사", years: ["예상어휘(부사)", "예상어휘(확인문제)"], example: "異常が見つかった場合はただちに連絡してください。", exampleReading: "いじょうがみつかったばあいはただちにれんらくしてください。", exampleMeaning: "이상이 발견된 경우에는 즉시 연락해 주세요." },
  { word: "どうしても", reading: "どうしても", meaning: "아무리 해도, 꼭·어떻게 해서든", pos: "부사", years: ["예상어휘(부사)", "예상어휘(확인문제)"], example: "今日はどうしても終わらせなければならない仕事がある。", exampleReading: "きょうはどうしてもおわらせなければならないしごとがある。", exampleMeaning: "오늘은 어떻게 해서든 끝내야 하는 일이 있습니다." },
  { word: "どんどん", reading: "どんどん", meaning: "거침없이, 쑥쑥, 계속", pos: "부사", years: ["예상어휘(부사)", "예상어휘(확인문제)"], example: "練習したら、発音がどんどん上手になった。", exampleReading: "れんしゅうしたら、はつおんがどんどんじょうずになった。", exampleMeaning: "연습했더니 발음이 쑥쑥 늘었습니다." },
  { word: "のんびり", reading: "のんびり", meaning: "느긋하게, 한가롭게", pos: "부사", years: ["예상어휘(부사)"], example: "日曜日は海辺でのんびり散歩した。", exampleReading: "にちようびはうみべでのんびりさんぽした。", exampleMeaning: "일요일은 바닷가에서 느긋하게 산책했습니다." },
  { word: "はっきり", reading: "はっきり", meaning: "분명히, 뚜렷이", pos: "부사", years: ["예상어휘(부사)", "예상어휘(확인문제)"], example: "後ろの席からも見えるようにはっきり書いた。", exampleReading: "うしろのせきからもみえるようにはっきりかいた。", exampleMeaning: "뒷자리에서도 보이도록 뚜렷하게 썼습니다." },
  { word: "ますます", reading: "ますます", meaning: "점점 더, 갈수록", pos: "부사", years: ["예상어휘(부사)"], example: "これから日本語の勉強がますます楽しくなる。", exampleReading: "これからにほんごのべんきょうがますますたのしくなる。", exampleMeaning: "앞으로 일본어 공부가 점점 더 즐거워집니다." },
  { word: "まるで", reading: "まるで", meaning: "마치 ~처럼", pos: "부사", years: ["예상어휘(부사)"], example: "ここはまるで夏のように暑い。", exampleReading: "ここはまるでなつのようにあつい。", exampleMeaning: "여기는 마치 여름처럼 덥습니다." },
  { word: "わくわく", reading: "わくわく", meaning: "두근두근 설렘", pos: "부사", years: ["예상어휘(부사)"], example: "旅行の前日はいつもわくわくする。", exampleReading: "りょこうのぜんじつはいつもわくわくする。", exampleMeaning: "여행 전날은 언제나 설렙니다." },
  { word: "わずか", reading: "わずか", meaning: "약간, 조금, 얼마 안 됨", pos: "부사·な형용사", years: ["예상어휘(부사)"], example: "駅まで歩いてわずか三分しかかからない。", exampleReading: "えきまであるいてわずかさんぷんしかかからない。", exampleMeaning: "역까지 걸어서 불과 3분밖에 안 걸립니다." },
  { word: "アンケート", reading: "あんけーと", meaning: "앙케이트, 설문조사", pos: "외래어", years: ["예상어휘(외래어)"], example: "イベント後にアンケートに協力してもらった。", exampleReading: "いべんとごにあんけーとにきょうりょくしてもらった。", exampleMeaning: "이벤트 후 설문조사에 협조받았습니다." },
  { word: "コミュニケーション", reading: "こみゅにけーしょん", meaning: "커뮤니케이션, 의사소통", pos: "외래어", years: ["예상어휘(외래어)"], example: "チーム内でのコミュニケーションを大切にする。", exampleReading: "ちーむないでのこみゅにけーしょんをたいせつにする。", exampleMeaning: "팀 내 의사소통을 중요하게 여깁니다." },
  { word: "メリット", reading: "めりっと", meaning: "메리트, 장점", pos: "외래어", years: ["예상어휘(외래어)", "예상어휘(확인문제)"], example: "早起きすることのメリットは多い。", exampleReading: "はやおきすることのめりっとはおおい。", exampleMeaning: "일찍 일어나는 것의 장점은 많습니다." },
  { word: "新〜", reading: "しん〜", meaning: "신~, 새로운~", pos: "접사·접두어", years: ["예상어휘(접두어)"], example: "来月、新商品が発売される。", exampleReading: "らいげつ、しんしょうひんがはつばいされる。", exampleMeaning: "다음 달에 신상품이 출시됩니다." },
  { word: "〜割引", reading: "〜わりびき", meaning: "~할인", pos: "접사·접미어", years: ["예상어휘(접미어)"], example: "学生証を見せると入場料が二割引になります。", exampleReading: "がくせいしょうをみせるとにゅうじょうりょうがにわりびきになります。", exampleMeaning: "학생증을 보여 주면 입장료가 2할인됩니다." },
  { word: "〜がち", reading: "〜がち", meaning: "~하기 쉽다, ~하는 경향이 있다", pos: "접사·접미어", years: ["예상어휘(접미어)"], example: "冬は運動不足になりがちだ。", exampleReading: "ふゆはうんどうぶそくになりがちだ。", exampleMeaning: "겨울은 운동 부족이 되기 쉽습니다." },
  { word: "〜同士", reading: "〜どうし", meaning: "~끼리", pos: "접사·접미어", years: ["예상어휘(접미어)"], example: "友達同士で意見を出し合った。", exampleReading: "ともだちどうしでいけんをだしあった。", exampleMeaning: "친구끼리 의견을 주고받았습니다." },
  { word: "おそらく", reading: "おそらく", meaning: "아마도, 짐작건대", pos: "부사", synonym: "たぶん", years: ["예상어휘(유의어·관용구)"], example: "明日はおそらく晴れるだろう。", exampleReading: "あしたはおそらくはれるだろう。", exampleMeaning: "내일은 아마 맑을 것입니다." },
  { word: "気に入る", reading: "きにいる", meaning: "마음에 들다", pos: "동사", synonym: "好きになる", years: ["예상어휘(유의어·관용구)"], example: "新しく買ったかばんがとても気に入った。", exampleReading: "あたらしくかったかばんがとてもきにいった。", exampleMeaning: "새로 산 가방이 매우 마음에 들었습니다." },
  { word: "まもなく", reading: "まもなく", meaning: "머지않아, 곧", pos: "부사", synonym: "もうすぐ", years: ["예상어휘(유의어·관용구)"], example: "電車はまもなく到着します。", exampleReading: "でんしゃはまもなくとうちゃくします。", exampleMeaning: "전철은 곧 도착합니다." },
  { word: "したがって", reading: "したがって", meaning: "따라서, 그러므로", pos: "관용·접속·표현", years: ["예상어휘(접속사)"], example: "雨が降った。したがって、運動会は延期になった。", exampleReading: "あめがふった。したがって、うんどうかいはえんきになった。", exampleMeaning: "비가 내렸다. 따라서 운동회는 연기되었습니다." },
  { word: "しかも", reading: "しかも", meaning: "게다가, 더욱이", pos: "관용·접속·표현", years: ["예상어휘(접속사)"], example: "この店は安い。しかも味もとてもいい。", exampleReading: "このみせはやすい。しかもあじもとてもいい。", exampleMeaning: "이 가게는 싸다. 게다가 맛도 매우 좋습니다." },
  { word: "才能", reading: "さいのう", meaning: "재능", pos: "명사", years: ["예상어휘(확인문제)"], example: "音楽の才能を伸ばすために練習を続ける。", exampleReading: "おんがくのさいのうをのばすためにれんしゅうをつづける。", exampleMeaning: "음악 재능을 키우기 위해 연습을 계속합니다." },
  { word: "わりには", reading: "わりには", meaning: "~치고는", pos: "관용·접속·표현", years: ["예상어휘(확인문제)"], example: "値段が安いわりには品質がいい。", exampleReading: "ねだんがやすいわりにはひんしつがいい。", exampleMeaning: "가격이 싼 것 치고는 품질이 좋습니다." },
  { word: "けわしい", reading: "けわしい", meaning: "험하다, 험준하다", pos: "い형용사", years: ["예상어휘(확인문제)"], example: "この山の道はけわしいので気をつけて歩く。", exampleReading: "このやまのみちはけわしいのできをつけてあるく。", exampleMeaning: "이 산길은 험하니 조심해서 걷습니다." },
  { word: "通用", reading: "つうよう", meaning: "통용, 통함", pos: "명사·する동사", years: ["예상어휘(확인문제)"], example: "このルールはどの国でも通用するわけではない。", exampleReading: "このるーるはどのくにでもつうようするわけではない。", exampleMeaning: "이 규칙이 어느 나라에서나 통용되는 것은 아닙니다." },
  { word: "まさか", reading: "まさか", meaning: "설마", pos: "부사", years: ["예상어휘(확인문제)"], example: "まさか彼がそんなことをするとは思わなかった。", exampleReading: "まさかかれがそんなことをするとはおもわなかった。", exampleMeaning: "설마 그가 그런 일을 할 줄은 몰랐습니다." },
  { word: "費用", reading: "ひよう", meaning: "비용", pos: "명사", years: ["예상어휘(확인문제)"], example: "引っ越しにかかる費用を計算した。", exampleReading: "ひっこしにかかるひようをけいさんした。", exampleMeaning: "이사에 드는 비용을 계산했습니다." },
  { word: "手続き", reading: "てつづき", meaning: "절차, 수속", pos: "명사·する동사", years: ["예상어휘(확인문제)"], example: "入学の手続きを早めに済ませた。", exampleReading: "にゅうがくのてつづきをは早めにすませた。", exampleMeaning: "입학 절차를 일찍 마쳤습니다." },
  { word: "支えられて", reading: "ささえられて", meaning: "지탱되어, 도움받아(支える 수동형)", pos: "동사(일어·수동)", years: ["예상어휘(확인문제)"], example: "家族や仲間に支えられてここまで来た。", exampleReading: "かぞくやなかまにささえられてここまでできた。", exampleMeaning: "가족과 동료들에게 지탱받으며 여기까지 왔습니다." },
  { word: "交通機関", reading: "こうつうきかん", meaning: "교통기관", pos: "명사", years: ["예상어휘(확인문제)", "독해·청해 어휘"], example: "大雪の影響で交通機関が遅れている。", exampleReading: "おおゆきのえいきょうでこうつうきかんがおくれている。", exampleMeaning: "폭설 영향으로 교통기관이 지연되고 있습니다." },
  { word: "具現化", reading: "ぐげんか", meaning: "구현화", pos: "명사·する동사", years: ["예상어휘(확인문제)"], example: "アイデアを形にして具現化する。", exampleReading: "あいでぃあをかたちにしてぐげんかする。", exampleMeaning: "아이디어를 형태로 만들어 구현화합니다." },
  { word: "再開", reading: "さいかい", meaning: "재개", pos: "명사·する동사", years: ["예상어휘(확인문제)"], example: "雨がやんだので試合を再開した。", exampleReading: "あめがやんだのでしあいをさいかいした。", exampleMeaning: "비가 그쳐서 시합을 재개했습니다." },
  { word: "着々", reading: "ちゃくちゃく", meaning: "착착, 차근차근", pos: "부사", years: ["예상어휘(확인문제)"], example: "イベントの準備が着々と進んでいる。", exampleReading: "いべんとのじゅんびがちゃくちゃくとすすんでいる。", exampleMeaning: "이벤트 준비가 착착 진행되고 있습니다." },
  { word: "周囲", reading: "しゅうい", meaning: "주위, 주변", pos: "명사", years: ["예상어휘(확인문제)"], example: "周囲の人に感謝の気持ちを伝える。", exampleReading: "しゅういのひとにかんしゃのきもちをつたえる。", exampleMeaning: "주위 사람들에게 감사의 마음을 전합니다." },
  { word: "成分", reading: "せいぶん", meaning: "성분", pos: "명사", years: ["예상어휘(확인문제)"], example: "食品のパッケージで栄養成分を確認する。", exampleReading: "しょくひんのはぱっけーじでえいようせいぶんをかくにんする。", exampleMeaning: "식품 패키지에서 영양 성분을 확인합니다." },
  { word: "散歩", reading: "さんぽ", meaning: "산책", pos: "명사·する동사", years: ["예상어휘(확인문제)", "문법·예문 어휘"], example: "夕方、川沿いをゆっくり散歩した。", exampleReading: "ゆうがた、かわぞいをゆっくりさんぽした。", exampleMeaning: "저녁에 강가를 따라 천천히 산책했습니다." },

  // 문법 · 독해 · 청해 어휘 및 구어 축약형
  { word: "〜うちに", reading: "〜うちに", meaning: "~하는 동안에", pos: "관용·접속·표현", years: ["문법 파트 핵심"], example: "熱いうちにスープを飲んでください。", exampleReading: "あついうちにすーぷをのんでください。", exampleMeaning: "뜨거울 때 수프를 드세요." },
  { word: "〜てしまう", reading: "〜てしまう", meaning: "~해 버리다", pos: "관용·접속·표현", years: ["문법 파트 핵심", "청해 구어 축약"], example: "宿題を忘れてしまった。", exampleReading: "しゅくだいをわすれてしまった。", exampleMeaning: "숙제를 잊어버렸습니다." },
  { word: "公共交通機関", reading: "こうきょうこうつうきかん", meaning: "대중교통기관", pos: "명사", years: ["독해·청해 어휘"], example: "会場へは公共交通機関を利用してください。", exampleReading: "かいじょうへはこうきょうこうつうきかんをりようしてください。", exampleMeaning: "행사장에는 대중교통을 이용해 주세요." },
  { word: "栄養", reading: "えいよう", meaning: "영양", pos: "명사", years: ["독해·청해 어휘"], example: "栄養のバランスを考えて食事をとる。", exampleReading: "えいようのばらんすをかんがえてしょくじをとる。", exampleMeaning: "영양 균형을 생각해 식사를 합니다." },
  { word: "状況", reading: "じょうきょう", meaning: "상황", pos: "명사", years: ["독해·청해 어휘"], example: "現在の状況を詳しく教えてください。", exampleReading: "げんざいのじょうきょうをくわしくおしえてください。", exampleMeaning: "현재 상황을 자세히 알려 주세요." },
  { word: "〜てる", reading: "〜てる", meaning: "~하고 있어(~ている 구어 축약)", pos: "관용·접속·표현", years: ["청해 구어 축약"], example: "今、駅に向かって歩いてるよ。", exampleReading: "いま、えきにむかってあるいてるよ。", exampleMeaning: "지금 역을 향해 걸어가고 있어요." },
  { word: "〜とく", reading: "〜とく", meaning: "~해 두다(~ておく 구어 축약)", pos: "관용·접속·표현", years: ["청해 구어 축약"], example: "席を取っとくからゆっくり来てね。", exampleReading: "せきをとっとくからゆっくりきてね。", exampleMeaning: "자리 잡아 둘 테니까 천천히 와요." },
  { word: "〜ちゃう", reading: "〜ちゃう", meaning: "~해 버리다(~てしまう 구어 축약)", pos: "관용·접속·표현", years: ["청해 구어 축약"], example: "うっかり鍵を忘れてきちゃった。", exampleReading: "うっかりかぎをわすれてきちゃった。", exampleMeaning: "깜빡하고 열쇠를 두고 와 버렸어요." },
  { word: "〜んない", reading: "〜んない", meaning: "~하지 않아/못 해(~らない/れない 축약)", pos: "관용·접속·표현", years: ["청해 구어 축약"], example: "今日は忙しくて行かんないかもしれない。", exampleReading: "きょうはいそがしくていかんないかもしれない。", exampleMeaning: "오늘은 바빠서 안 갈지도 모릅니다." }
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
    statusMap: {},
    favorites: [],
    posNotes: {},
    decks: [],
    wrongLog: {}
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