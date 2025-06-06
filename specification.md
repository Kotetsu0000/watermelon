# **スイカゲーム Web アプリ版 完コピ仕様書**

### **1\. はじめに**

本仕様書は、世界中で人気を博しているパズルゲーム「スイカゲーム」の Web アプリケーション版を、JavaScript、HTML、CSS といったクライアントサイド技術のみを用いて完全に再現するための詳細な技術要件を定義することを目的としています。サーバーサイドの処理は一切行わず、ユーザーの Web ブラウザ上で全ての機能が完結するスタンドアロンアプリケーションとして設計し、最終的には GitHub Pages での公開を目指します。この文書は、開発者が本情報のみでゲームを再現できるよう、ゲームルール、物理挙動、UI/UX、サウンド、ゲームフロー、および技術的実装の詳細とパフォーマンス最適化について、包括的な指針を提供します。

本プロジェクトの技術スタックは、ゲームの基本的な構造と Canvas 要素の定義に HTML を、ゲーム画面のレイアウト、UI 要素のスタイリング、レスポンシブデザインの対応に CSS を、そしてゲームロジック、物理エンジンの制御、描画処理、イベントハンドリング、状態管理の全てに JavaScript を採用します。特に、フルーツのリアルな落下、衝突、転がり、結合時の挙動をシミュレートするためには、Matter.js または Planck.js のような既存の 2D 物理エンジンライブラリの導入が不可欠です。

デプロイメントモデルとしては、GitHub Pages でのホスティングを前提とし、全ての機能がクライアントサイドで動作するように設計されます。これにより、サーバーサイドのインフラコストや管理が不要となり、手軽な公開と運用が可能になります。

### **2\. ゲームの基本ルールとメカニクス**

スイカゲームの核となるルールと、それらを Web アプリ上でどのように再現するかを詳細に定義します。

#### **2.1. フルーツの種類と進化順序**

スイカゲームには全 11 種類のフルーツが登場し、同じ種類のフルーツが接触すると、より大きな次の段階のフルーツに変化します 1。この進化順序と各フルーツの相対的なサイズは、ゲームの戦略性に大きく影響します。

ゲームに登場するフルーツは、そのサイズによって「小物」と「デカ玉」という概念に分類されます 2。さくらんぼ、いちご、ぶどうが「小物」に該当し、デコポン、かき、りんご、なし、もも、パイナップル、メロン、スイカが「デカ玉」に分類されます 2。この分類は、単なる大きさの区別を超え、ゲームプレイにおける戦略的な意味合いを持ちます。例えば、りんご以上の「デカ玉」は盤面を安定させる土台として機能し、積み上げの安定性に寄与します 2。一方で、小さなフルーツ（さくらんぼやいちご）を隙間に配置した場合、その上に大きなフルーツを重ねると、合体しにくくなったり、自重で位置がずれたりするリスクがあるため、配置には細心の注意が必要です 2。このようなフルーツごとの特性は、物理エンジンの各ボディのプロパティ（特に質量や密度）が、その見た目のサイズだけでなく、ゲームプレイ上の役割を考慮して調整されるべきであることを示唆しています。例えば、小さいフルーツを相対的に「重く」設定することで、大きなフルーツを動かす「テコ」として利用する高度な戦略を可能にするなど、ゲームの奥深さを生み出す要素となります 4。

以下のテーブルは、ゲームの根幹をなすデータとして、フルーツの種類、進化順序、獲得スコア、そして物理的な相対サイズの関係性を一元的に定義します。これにより、開発者はゲームの核となるロジックを正確に実装できるだけでなく、物理エンジンのボディ作成時の半径設定に直接反映させ、ゲームの物理挙動と視覚的な整合性を保つ上で不可欠な情報源となります。

**フルーツ進化テーブル**

| フルーツ名   | 進化順 | 進化元フルーツ | 進化先フルーツ | 獲得スコア (点) | 相対サイズ (直径比) | 備考               |
| :----------- | :----- | :------------- | :------------- | :-------------- | :------------------ | :----------------- |
| さくらんぼ   | 1      | \-             | いちご         | \-              | 1.0 (基準)          | 小物               |
| いちご       | 2      | さくらんぼ     | ぶどう         | 1               | 約 1.2              | 小物               |
| ぶどう       | 3      | いちご         | デコポン       | 3               | 約 1.5              | 小物               |
| デコポン     | 4      | ぶどう         | かき           | 6               | 約 1.8              | デカ玉             |
| かき         | 5      | デコポン       | りんご         | 10              | 約 2.1              | デカ玉             |
| りんご       | 6      | かき           | なし           | 15              | 約 2.5              | デカ玉             |
| なし         | 7      | りんご         | もも           | 21              | 約 2.9              | デカ玉             |
| もも         | 8      | なし           | パイナップル   | 28              | 約 3.3              | デカ玉             |
| パイナップル | 9      | もも           | メロン         | 36              | 約 3.7              | デカ玉             |
| メロン       | 10     | パイナップル   | スイカ         | 45              | 約 4.2              | デカ玉             |
| スイカ       | 11     | メロン         | 消滅           | 55              | 約 4.8              | デカ玉             |
| (消滅)       | \-     | スイカ         | \-             | 66              | \-                  | スイカ同士の結合時 |

#### **2.2. フルーツの落下と結合**

プレイヤーは、箱の上部からフルーツを一つずつ落とし積み上げていきます。フルーツは物理演算によって転がり、同じ種類のフルーツ同士が触れると、接触位置を起点に一段階大きなフルーツに変化します 1。

-   **落下操作**: プレイヤーはマウスカーソル（またはタッチ操作）の横位置に合わせてフルーツを配置し、クリック（またはタップ/ドロップ）で落下させます 5。落下するフルーツの初期の高さは固定です 6。
-   **結合時のフルーツ生成位置**: 結合したフルーツは、元の 2 つのフルーツの接触位置を起点として、その中央に新しいフルーツが生成されます 2。この生成位置が元の場所から「ズレる」特性は、ゲームの戦略において重要な要素となります。プレイヤーはこの特性を利用して、隅にあるフルーツを中央に移動させる「整地」テクニックを駆使することが可能になります 9。物理エンジンは、結合時に元の 2 つのボディを削除し、その重心位置（または接触点の中央）に新しいボディを生成する必要があります。この際、生成される新しいフルーツに適切な初期速度や角速度を与えることで、元のフルーツが持っていた運動量や衝突エネルギーをある程度引き継ぎ、自然な「弾け飛び」や「転がり」を再現することが求められます。
-   **スイカ+スイカの挙動**: Nintendo Switch 版のスイカゲームでは、スイカを 2 つ組み合わせると、それ以上進化することなく「消滅」し、66 点がスコアに加算されます 2。スイカが消滅することで盤面に空きスペースが生まれ、他のフルーツは盤面に残るため、スコアを継続したまま序盤と同じような状況となり、高得点を継続的に狙うことが可能になります 9。この仕組みは、ゲームが無限に続くことを防ぎつつ、高得点を目指す上での重要な「リセット」メカニズムとして機能します。
-   **物理挙動の「予測困難性」と「中毒性」**: スイカゲームの物理演算は、単にリアルさを追求するだけでなく、プレイヤーに「予測困難な挙動」を体験させることで、ゲームの奥深さと中毒性を生み出しています 4。フルーツがくっついた時にどう跳ねるか、落とした時にどう転がっていくかといった予測困難な要素は、プレイヤーに「運」の要素を感じさせつつも、「もっと良い点取れたはず！」というリベンジ心を掻き立て、結果として継続的なプレイを促します 4。また、フルーツの合体時に発生する強い反発力によって、他のフルーツが箱から弾け飛び、意図せずゲームオーバーにつながる「ポップコーン現象」 12 も、この予測不能な面白さに寄与します。物理パラメータの微調整は、この「ポップコーン現象」の発生頻度と激しさをコントロールし、プレイヤーが許容できる範囲の「理不尽さ」に抑えるために非常に重要です。

#### **2.3. フルーツの出現確率**

ゲーム開始時およびフルーツ落下時には、次に落とすフルーツが画面上部に予告表示されます 13。この予告機能は、プレイヤーが戦略を立てる上で非常に重要な役割を果たします 13。

-   **出現するフルーツの種類**: 画面上部からランダムに落ちてくるフルーツは、「さくらんぼ」「いちご」「ぶどう」「デコポン」「かき」の 5 種類に限定されています 2。
-   **出現確率**: 上記 5 種類のフルーツは、それぞれ 20%の均一な確率で出現します 9。特定のフルーツが出やすい、出にくいといった偏りはありません 16。
-   **りんご以上のフルーツ**: りんご以上の大きなフルーツは、落下してくることはありません 2。プレイヤーは、既存のフルーツを合体させて自力でこれらのフルーツを生成する必要があります 2。
-   **ランダム性と戦略のバランス**: フルーツの出現がランダムであることは「ガチャのようなワクワク感」 14 を生み出し、ゲームのリプレイ性を高めます。同時に、次に落ちてくるフルーツが予告されることで、プレイヤーは完全に運任せではなく、ある程度の計画性を持ってプレイすることが可能になります。この「ランダム性＋予告」の組み合わせは、プレイヤーが「運」と「スキル」のバランスを感じる上で重要であり、ゲームの戦略的深さを生み出す要素となります。

#### **2.4. スコアリングシステム**

フルーツが結合して進化するたびにスコアが加算されます。小さいフルーツよりも大きいフルーツ同士を合体させる方が、より高いスコアが得られます 2。

以下のテーブルは、各フルーツの進化とそれに対応する獲得点数を明確に定義します。このテーブルは、ゲームロジックにおけるスコア加算処理の直接的な参照となり、正確なスコアリングシステムの再現を保証します。また、ゲームの難易度調整やバランス調整を行う際にも、各進化段階のスコアが一覧できることで、その影響を評価しやすくなります。

**フルーツ進化と獲得スコア**

| 結合元フルーツ            | 結果フルーツ | 獲得点数 |
| :------------------------ | :----------- | :------- |
| さくらんぼ+さくらんぼ     | いちご       | 1 点     |
| いちご+いちご             | ぶどう       | 3 点     |
| ぶどう+ぶどう             | デコポン     | 6 点     |
| デコポン+デコポン         | かき         | 10 点    |
| かき+かき                 | りんご       | 15 点    |
| りんご+りんご             | なし         | 21 点    |
| なし+なし                 | もも         | 28 点    |
| もも+もも                 | パイナップル | 36 点    |
| パイナップル+パイナップル | メロン       | 45 点    |
| メロン+メロン             | スイカ       | 55 点    |
| スイカ+スイカ             | 消滅         | 66 点    |

Nintendo Switch 版の最高得点は 9999 点（カンスト）とされており 10、3000 点を超えると上級者、5000 点を超えるとプロ級と認識されます 10。スコアはゲーム画面の UI にリアルタイムで表示され 13、プレイヤーが現在の達成度を常に把握できるようにします。

スコアリングシステムは、単に点数を記録するだけでなく、プレイヤーがより大きなフルーツを目指す強い動機付けとなります。特にスイカの消滅時に 66 点という高得点が加算され、同時に盤面に空きスペースが生まれることは、ゲームの継続性を高め、高得点を目指す上での重要な戦略的要素となります 2。これは、単純な「積み重ねてゲームオーバー」のパズルゲームとは一線を画し、高レベルプレイヤーがさらに上を目指すための「リセットメカニズム」として機能します。ゲームオーバー画面でのハイスコア表示 19 を考慮すると、クライアントサイドのローカルストレージにハイスコアを保存する機能の実装が望ましいでしょう。これにより、プレイヤーの達成感を高め、リプレイ性を向上させます。

#### **2.5. ゲームオーバー条件**

ゲームは、フルーツが箱から溢れた場合に終了します。

-   **基本条件**: フルーツが箱の境界線から溢れたらゲームオーバーとなります 1。
-   **「3 秒ルール」**: ゲーム画面の一番上に設定された判定ラインにフルーツが 3 秒間（または 4 秒間）衝突し続けている場合、ゲームオーバーとなります 6。この「猶予期間」は、フルーツが一時的に跳ね上がったり、合体の衝撃でラインを越えたりしても、すぐにゲームオーバーにならないためのものです。これにより、プレイヤーは瞬間的な不運による理不尽なゲームオーバーを回避でき、より戦略的なプレイを継続できます。同時に、ライン際での緊張感を高め、プレイヤーに迅速な判断と操作を促します。
-   **落下時の判定**: 落下させたフルーツが、そもそも箱の内部に入らなかった場合もゲームオーバーと見なされます 19。
-   **ゲームオーバー時の処理**: ゲームオーバー条件が満たされると、ゲームオーバーの表示（例: "GAME OVER"、最終スコア、ハイスコア）が画面に表示されます 19。プレイヤーの操作（フルーツの移動、落下）は無効になり 19、盤面上のフルーツの物理的な動き（重力、衝突）も停止します 19。必要に応じて、フルーツの当たり判定も切ることで、さらなる予期せぬ挙動を防ぐことが推奨されます 19。ゲームオーバー判定は、物理エンジン内の衝突判定と連動させ、ラインを越えたフルーツに対してタイマーを開始し、3 秒経過したらゲームオーバー状態に遷移させるロジックを実装する必要があります。この際、落下中のフルーツがラインに触れても即座にゲームオーバーにならないよう、落下完了後の安定状態を考慮する実装が求められます 19。

#### **2.6. 時間制限の有無**

スイカゲームには時間制限がありません 2。この設計は、プレイヤーが焦ることなく、じっくりと盤面の状況を見極め、最適な配置を熟考する機会を提供します 2。これにより、ゲームの難易度が「スピード」から「戦略的思考」と「空間認識能力」にシフトし、より深い戦略性が生まれます。ゲームのメインループには、時間経過による強制終了のロジックを組み込む必要はなく、プレイヤーの操作と物理シミュレーションに集中した設計が可能です。

### **3\. 物理エンジンの選定と設定**

スイカゲームのリアルな物理挙動は、ゲームの核となる魅力です。JavaScript でこれを再現するには、2D 物理エンジンの導入が不可欠です。

#### **3.1. Matter.js または Planck.js の推奨と理由**

JavaScript で 2D 物理シミュレーションを実現するためのライブラリとして、Matter.js または Planck.js の利用が推奨されます 6。

-   **Matter.js の推奨**: Matter.js は、物体の条件設定、計算、結果の表示までが非常に簡単に実装できると評価されており 24、スイカゲームの物理演算に Matter.js の利用が直接推奨されています 6。このライブラリは、重力、摩擦係数、反発係数などの物理パラメータを容易に設定できる機能を備えています 25。
-   **Planck.js の考慮**: Planck.js は、クロスプラットフォームの 2D 物理エンジン「Box2D」をベースにしており、Web およびモバイルプラットフォーム向けに最適化されています 23。Matter.js と同様に、重力、摩擦、反発係数などの設定が可能です 31。

物理エンジンの選定は、単に物理法則を再現するだけでなく、スイカゲーム特有の「予測不可能性」や「絶妙な手触り」を再現できるかどうかに直結します。ゲームの物理挙動は「複雑系で起こる事象に再現性がない」 4 と評されつつも、「本物そっくりな物理演算」 11 と評価されています。Matter.js がスイカゲームの物理演算に直接推奨されているのは、その設定の容易さだけでなく、ゲームの要求する挙動の再現性において実績があるためと考えられます。開発者は Matter.js を優先的に検討すべきですが、単にライブラリを導入するだけでなく、そのパラメータを徹底的に調整し、オリジナルのスイカゲームが持つ「物理的な納得感と予測不能性のバランス」を追求することが重要です。これは、単なる物理的な正確さではなく、ゲームプレイの「楽しさ」に寄与する「ゲーム物理」の実現を意味します。

#### **3.2. 物理パラメータ詳細**

選択した物理エンジンにおいて、以下のパラメータを調整し、スイカゲーム特有の挙動を再現します。これらの値は、実際のゲームプレイを参考に調整を重ねる必要があります。

-   **重力 (Gravity)**: Matter.js では engine.world.gravity.y を設定することで調整可能です 25。地球の重力加速度 9.8m/s^2 を基準としつつも、ゲームの「しっくりくる」速度感を出すために、例えば 20 40 や 0.5 25 のような調整値が示唆されています。これは、現実の物理法則に厳密に従うのではなく、ゲームとしての「面白さ」や「気持ちよさ」を追求するために調整されるべきパラメータです。
-   **摩擦 (Friction)**: フルーツが接触して滑る際の抵抗力を定義します。Matter.js では Body のプロパティとして設定可能です 26。動摩擦係数として 0.5 などの値が例示されています 41。
-   **反発係数 (Restitution/Bounciness)**: フルーツが衝突した際に跳ね返る度合いを定義します。Matter.js では Body のプロパティとして設定可能です 26。衝突点での相対速度から反射ベクトルを算出することで、自然な動きを実現します 11。
-   **各フルーツの物理プロパティ**: 物理エンジンでは、各ボディに質量や密度を設定できます 26。スイカゲームでは、「小さいフルーツの方が重量が重く作られているので、一番小さいさくらんぼで、大きいフルーツをうまく移動させることも可能」という特徴が指摘されています 4。これは、各フルーツの物理プロパティ（特に密度や質量）が、その見た目のサイズに比例するのではなく、ゲームプレイ上の戦略的な役割を考慮して個別に調整されるべきであることを意味します。この非直感的な質量設定は、小さいフルーツを「押し込み」や「整地」に利用できるという、ゲームの高度な戦略性（例: 角スイカ戦略における小さなフルーツの活用）を生み出します。この設定は、ゲームの「手触り」に大きく影響するため、試行錯誤が不可欠です。

以下のテーブルは、各フルーツの物理的な特性を具体的に定義し、ゲームの「手触り」を再現するための出発点を提供します。特に質量とサイズの関係性、および摩擦・反発係数の調整は、フルーツの転がり方や積み重なり方に大きく影響し、ゲームの難易度と面白さを決定づけます。これらの値は、実際のプレイを通じて微調整が必要となる「チューニングパラメータ」です。

**フルーツごとの物理プロパティ (初期値案)**

| フルーツ名   | 直径 (px) (基準: さくらんぼ=50px) | 質量 (相対値) | 摩擦係数 (Friction) | 反発係数 (Restitution) | 備考                 |
| :----------- | :-------------------------------- | :------------ | :------------------ | :--------------------- | :------------------- |
| さくらんぼ   | 50                                | 1.5           | 0.3                 | 0.2                    | 小さいが相対的に重い |
| いちご       | 60                                | 1.8           | 0.3                 | 0.2                    |                      |
| ぶどう       | 75                                | 2.0           | 0.3                 | 0.2                    |                      |
| デコポン     | 90                                | 2.5           | 0.4                 | 0.15                   |                      |
| かき         | 105                               | 3.0           | 0.4                 | 0.15                   |                      |
| りんご       | 125                               | 3.5           | 0.45                | 0.1                    |                      |
| なし         | 145                               | 4.0           | 0.45                | 0.1                    |                      |
| もも         | 165                               | 4.5           | 0.5                 | 0.08                   |                      |
| パイナップル | 185                               | 5.0           | 0.5                 | 0.08                   |                      |
| メロン       | 210                               | 5.5           | 0.55                | 0.05                   |                      |
| スイカ       | 240                               | 6.0           | 0.6                 | 0.05                   |                      |

### **4\. グラフィックと UI/UX**

ユーザーがゲームを快適にプレイできるよう、視覚的な要素とユーザーインターフェースの設計を定義します。

#### **4.1. ゲーム画面の解像度とサイズ**

-   推奨されるゲーム画面の内部ロジックは、例えば横 500px、縦 700px のような固定の論理サイズで設計します 6。
-   実際の表示は、CSS や JavaScript を用いてブラウザのウィンドウサイズに合わせてスケーリングします。ゲーム画面全体はフル HD (1920x1080 ピクセル) などの一般的な解像度を想定しつつ 42、ゲーム画面はその中央に配置するか、UI スケールモードを「スケール with スクリーンサイズ」に設定するなどして、レスポンシブにスケールするように設計します 44。
-   クライアントサイドの Web アプリとして GitHub Pages で公開する場合、ユーザーのデバイス（PC、タブレット、スマートフォン）やブラウザウィンドウのサイズは多岐にわたります。固定されたピクセルサイズで設計すると、表示崩れや操作性の低下を引き起こすため、レスポンシブデザインは必須です。HTML Canvas 要素は、CSS で最大幅や最大高さを設定し、object-fit: contain;のようなプロパティを使用してアスペクト比を維持しながら表示領域にフィットさせます。JavaScript 側では、Canvas の描画コンテキストを、CSS で設定された実際の表示サイズに合わせて調整するロジックが必要です。これにより、どのデバイスや画面サイズでも一貫したゲーム体験を提供できます。ゲームボックスの縦横比（例: 70 で示唆される一般的なモバイル画面比率）を維持しつつ、画面サイズに合わせて拡大縮小する実装が理想的です。

**推奨ゲーム画面とボックスサイズ**

| 項目                     | 推奨値                                   | 備考                              |
| :----------------------- | :--------------------------------------- | :-------------------------------- |
| 論理ゲーム画面サイズ     | 横 500px, 縦 700px                       | 内部ロジックの基準サイズ 6        |
| ゲームボックス内部サイズ | 論理画面幅の約 90%, 論理画面高さの約 80% | フルーツが積み上がる領域          |
| 縦横比                   | 5:7 (ゲーム画面)                         | オリジナルのプレイ感を維持        |
| 表示スケーリング         | レスポンシブ (アスペクト比維持)          | ブラウザウィンドウサイズに適合 44 |

#### **4.2. フルーツのアセットとサイズ比率**

11 種類のフルーツそれぞれに対応する画像アセットを用意します。フルーツの画像サイズは、進化順に大きくなるように設定し、例えば 52x52px から始まる例が挙げられています 45。

以下のテーブルは、各フルーツの推奨画像サイズと、物理エンジンにおける半径設定の基準となる相対直径を示します。

**フルーツ画像サイズと相対直径テーブル**

| フルーツ名   | 推奨画像サイズ (px) | 相対直径 (比率) |
| :----------- | :------------------ | :-------------- |
| さくらんぼ   | 52x52               | 1.0             |
| いちご       | 80x80               | 約 1.5          |
| ぶどう       | 108x108             | 約 2.0          |
| デコポン     | 130x130 (例)        | 約 2.5          |
| かき         | 155x155 (例)        | 約 3.0          |
| りんご       | 180x180 (例)        | 約 3.5          |
| なし         | 205x205 (例)        | 約 4.0          |
| もも         | 230x230 (例)        | 約 4.5          |
| パイナップル | 255x255 (例)        | 約 5.0          |
| メロン       | 280x280 (例)        | 約 5.5          |
| スイカ       | 305x305 (例)        | 約 6.0          |

フルーツの画像サイズは単なる見た目だけでなく、ゲームの物理挙動と密接に関連します。視覚的なサイズ比率が適切でないと、物理エンジンのシミュレーション結果（例：隙間の埋まり方、転がり方）とプレイヤーの直感との間に乖離が生じ、ゲームプレイの満足度が低下する可能性があります。特に、進化によってフルーツが大きくなる際の視覚的なインパクトは、プレイヤーの達成感に直結します。スイカゲームのパロディとして、実際の惑星の大きさ比率で惑星が落ちてくる「惑星ゲーム」の例が示唆するように 46、視覚的なサイズ比率はゲーム体験に大きな影響を与えます。上記のテーブルの「相対直径」は、物理エンジンにおける各フルーツの半径設定に直接反映されるべきです。画像アセットは、この相対直径に基づいて作成またはスケーリングされる必要があります。これにより、視覚と物理挙動の一貫性が保たれ、プレイヤーはフルーツの挙動をより直感的に理解し、戦略を立てやすくなります。

#### **4.3. UI 要素の配置とデザイン**

-   **スコア表示**: ゲーム画面の目立つ位置に現在のスコアをリアルタイムで表示します 13。フォントサイズは例えば 75px 程度 18、色は黒 18 など、視認性の高いものを採用します。
-   **次のフルーツ予告表示**: ゲーム画面上部、フルーツ落下位置の近くに、次に落ちてくるフルーツの画像を常に表示します 13。この機能は戦略を立てる上で「非常に重要」であるため 13、明確かつ視認性の高いデザインと配置を心がけます。
-   **レイアウト**: UI 要素は画面サイズに応じて適切にスケーリングされるよう、レスポンシブな配置を考慮します 44。例えば、UI 要素の周囲に 20 ピクセル程度の余白を設けることで、画面端に要素が密着するのを防ぎます 44。

UI は単なる情報表示ではなく、ゲームプレイそのものに影響を与えます。次のフルーツが予告されることで、プレイヤーは落下位置を事前に計画し、連鎖を狙うなどの戦略を立てることができます 13。スコアのリアルタイム表示は、プレイヤーのモチベーションを維持し、高得点への挑戦意欲を刺激します。UI 要素は、ゲームの描画ループとは独立して、または効率的に更新されるように実装する必要があるでしょう。例えば、Canvas 上に別途 UI 用のレイヤーを設けるか、HTML/CSS 要素を重ねて配置することで、物理演算の負荷とは別に UI の描画パフォーマンスを最適化できます。フォントや色の選択も、視認性とゲームの世界観に合致するように慎重に行うべきです。

#### **4.4. ゲーム開始画面**

ゲーム開始前に表示される画面です。

-   「ゲームスタート」ボタンなどを配置し、ゲーム本編への遷移を促します 47。
-   背景デザイン、BGM、キャラクター（ポッピィー）、デコレーション素材などが含まれる場合があります 48。これらはスキンとして変更可能であることが示唆されており 48、ゲームの見た目を簡単に変更できるモジュラーなアセット管理と UI 構造を前提とします。これは、将来的な機能拡張や、ユーザーによるカスタマイズ（例：推しフルーツ）の余地を生み出す可能性を秘めています。
-   画像や BGM などのアセットは、パスや ID で管理し、設定ファイルや JavaScript のオブジェクトとして定義することで、容易に切り替えられるように設計すべきです。

#### **4.5. ゲームオーバー画面**

ゲームオーバー条件が満たされた際に表示される画面です。

-   「GAME OVER」のテキスト表示 19。
-   最終的な獲得スコアを表示します 19。
-   「リトライ」ボタンを配置し、ゲームを再開できるようにします 21。
-   可能であれば、ハイスコアの表示と、現在のスコアがハイスコアを更新したかどうかの表示を実装します 19。

ゲームオーバーは終わりではなく、次のプレイへの移行点として機能します。スコア表示とリトライボタンは、プレイヤーがすぐに次のゲームを始められるようにすることで、ゲームのリプレイ性を高め、中毒性を維持します。ハイスコアの記録は、プレイヤーの競争心や自己ベスト更新への意欲を刺激し、継続的なプレイを促します。ハイスコアは、クライアントサイドの Web アプリであるため、Web Storage API (localStorage/sessionStorage) を利用してブラウザに永続的に保存されるべきです。これにより、ブラウザを閉じてもハイスコアが保持され、プレイヤーの体験が向上します。

### **5\. サウンドデザイン**

サウンドはゲームの没入感とフィードバックに不可欠な要素です。

#### **5.1. BGM (背景音楽)**

-   ゲームプレイ中の BGM をループ再生します 21。
-   ゲーム開始時、ゲームオーバー時など、ゲームの状態遷移に応じて BGM を切り替えることを検討します 21。
-   公式の BGM コレクションが存在しますが 51、著作権に配慮し、自作またはフリー素材の BGM を使用します。
-   BGM は単なる背景音ではなく、ゲームの「気分」や「テンポ」をプレイヤーに伝える重要な要素です。特に、異なるスキンに合わせた BGM の変更は 53、ゲームの多様性を演出し、プレイヤーの飽きを防ぐ効果があります。Audio API または HTML \<audio\>要素を用いて BGM を管理し、ゲームの状態管理ロジックと連携させることで、この効果を最大限に引き出せます。BGM の音量調整機能も実装することで、ユーザーの好みに合わせたプレイ環境を提供できます。

#### **5.2. 効果音 (SFX)**

以下の主要なゲームイベントに対して効果音を実装します。

-   **フルーツ落下音**: フルーツが箱に落ちた際に再生されます 45。
-   **フルーツ衝突音**: フルーツ同士がぶつかった際に再生されます。
-   **フルーツ結合/進化音**: 同じ種類のフルーツが結合し、新しいフルーツに進化する際に再生されます 45。この音は「気持ち良さ」を向上させる重要な要素です 56。
-   **ゲームオーバー音**: ゲームオーバー条件が満たされた際に再生されます 51。
-   **連続結合時の演出とサウンド**: 複数のフルーツが連続して結合・進化する際に、特別なアニメーションやサウンドエフェクトを伴うことで、プレイヤーに爽快感を提供します 12。

適切なタイミングと種類の効果音は、プレイヤーの操作に対する即時的なフィードバックを提供し、ゲームプレイの満足度を高めます。特にフルーツの結合音は、成功体験を強調し、プレイヤーに「爽快感」を与えることで、ゲームの中毒性を高めます 56。パーティクルエフェクトとの組み合わせ 20 は、視覚と聴覚の両方でフィードバックを強化し、ゲーム体験をより豊かにします。各効果音は、ゲームイベントのトリガー（例: 衝突イベント、合体イベント、ゲームオーバーイベント）と同期して再生されるように実装し、Web Audio API を利用することで、より細かい音量調整や同時再生の制御が可能となります。

### **6\. ゲームフローと状態管理**

ゲームは以下の主要な状態間で遷移し、それぞれの状態で異なるロジックが適用されます。

-   **ゲーム開始 (Start)**:
    -   ゲーム開始画面が表示され、プレイヤーの入力を待ちます。
    -   BGM が再生されます。
-   **プレイ中 (Playing)**:
    -   プレイヤーがフルーツを落下させ、物理シミュレーションがリアルタイムで実行されます。
    -   現在のスコアと次に落ちてくるフルーツの予告が表示されます。
    -   ゲームオーバーラインの監視が継続的に行われます。
-   **一時停止 (Paused)**:
    -   プレイ中に特定の操作（例: ESC キー、UI ボタン）によりゲームが一時停止します 59。
    -   物理シミュレーション、タイマー、フルーツの生成などがすべて停止し、盤面上のフルーツの動きが止まります。
    -   一時停止を示す UI が表示されます。
    -   物理演算によってフルーツが常に動くスイカゲームにおいて、一時停止機能はプレイヤーが盤面をじっくり分析し、次の手を熟考するための重要な戦略的ツールとなります 61。これにより、ゲームの難易度を緩和し、より深い戦略性を許容します。一時停止機能の実装では、物理エンジンの更新ループを停止させ、ゲームのメインループ（requestAnimationFrame など）も一時的に停止させる必要があります。UI の表示も適切に切り替えることで、プレイヤーに現在の状態を明確に伝えます。
-   **ゲームオーバー (Game Over)**:
    -   ゲームオーバー条件が満たされた際に遷移します。
    -   物理シミュレーションが停止し、プレイヤーの操作が無効になります 19。
    -   ゲームオーバー画面が表示され、最終スコアとリトライオプションが提示されます。
-   **リスタート (Restart)**:
    -   ゲームオーバー画面のリトライボタンが押されると、ゲームが初期状態に戻り、「ゲーム開始」状態に遷移します。

### **7\. 技術的実装詳細と最適化**

#### **7.1. HTML Canvas の利用**

ゲームの描画はすべて HTML \<canvas\> 要素上で行います。2D グラフィックの描画には Canvas API を使用します。HTML5 Canvas はウェブ上の 2D グラフィックで最も広くサポートされている標準であり 63、本プロジェクトの描画基盤となります。物理演算を伴うリアルタイムゲームでは、毎フレーム大量のオブジェクトが描画されるため、Canvas の描画処理がボトルネックになりやすい傾向があります 64。パフォーマンスが悪いと、フレームレートの低下やユーザー体験の悪化につながるため 65、以下の最適化手法を積極的に導入し、スムーズな描画を目指す必要があります。これにより、ゲームの「手触り」が向上し、プレイヤーの満足度が高まります。

#### **7.2. 描画ループとパフォーマンス最適化**

スムーズなゲームプレイを実現するために、以下の最適化手法を導入します。

-   **requestAnimationFrame の利用**: ゲームのメイン描画ループには、setTimeout や setInterval の代わりに requestAnimationFrame を使用します 64。これにより、ブラウザのリフレッシュレートに同期した滑らかなアニメーションが実現され、CPU 負荷も軽減されます 67。
-   **ダブルバッファリング (Double Buffering)**: 直接表示用の Canvas に描画するのではなく、メモリ上に非表示の「バックバッファ」Canvas を用意し、そちらに全ての描画を行います 64。描画が完了したら、バックバッファの内容を一度に表示用 Canvas にコピーします。これにより、描画中のちらつき（ティアリング）を防ぎ、スムーズな画面更新を実現します 68。
-   **clearRect の最適化**: 毎フレーム Canvas 全体をクリアするのではなく、変更があった領域（例: フルーツが移動した領域、結合によって消滅した領域）のみを部分的にクリアすることを検討します 64。ただし、物理演算による複雑な動きを伴う場合、全体クリアの方が管理が容易で、現代のブラウザではパフォーマンス差が小さい場合もあります。実装の複雑性とパフォーマンスのバランスを考慮して決定します。
-   **GPU アクセラレーションの活用**: CSS アニメーションや CSS 座標変換（transform プロパティ）を UI 要素に適用することで、ブラウザの GPU アクセラレーションを活用し、CPU 負荷を軽減できます 69。Canvas 自体もブラウザによって GPU アクセラレーションされる場合があります 63。

#### **7.3. イベントハンドリング (マウス/タッチによる落下操作)**

-   **マウス操作**: マウスの mousemove イベントを監視し、現在のマウスカーソル X 座標を取得します 6。これにより、次に落とすフルーツの水平位置をプレイヤーがプレビューできるようにします。マウスの click イベント（または mousedown/mouseup）を監視し、クリックされた瞬間にプレビュー中のフルーツを落下させます 6。
-   **タッチ操作 (モバイル対応)**: touchmove イベントで指の X 座標を追跡し、フルーツの水平位置をプレビューします。touchend イベントで指が離された瞬間にフルーツを落下させます 7。

ゲームの操作は直感的でシンプルであり、これがスイカゲームが幅広い層に受け入れられた要因の一つです。特に、マウス/タッチによる「狙い定め → 落下」のフローは、物理演算の予測不能性と相まって、プレイヤーに「自分の操作が結果に影響を与える」という感覚を与えます。マウスとタッチの両方に対応することで、PC とモバイルデバイスの両方でシームレスな体験を提供します。落下位置のプレビュー（点線など）を実装することで、プレイヤーがより正確にフルーツを配置できるよう補助し、ゲームの戦略性を高めます。

#### **7.4. GitHub Pages へのデプロイ考慮事項**

本アプリケーションは、HTML、CSS、JavaScript、画像、音声ファイルなどの静的アセットのみで構成される必要があります。外部 API やサーバーサイドのデータベースは使用しません。ハイスコアの保存には、Web Storage API (localStorage) などのクライアントサイドストレージを利用します。

すべてのパスは相対パスで記述し、GitHub Pages のサブディレクトリ構造（例: your-username.github.io/your-repo-name/）に対応できるようにします。index.html をルートに配置し、GitHub Pages のデフォルト設定で公開できるようにします。

サーバーではなくクライアントのブラウザですべてが完結するという要件 \[ユーザー要件\] は、開発の複雑さを大幅に軽減し、デプロイメントを極めてシンプルにします。GitHub Pages は静的サイトホスティングに特化しているため、このモデルに完全に合致します。これにより、開発者は純粋にゲームロジックとフロントエンド技術に集中できます。ハイスコアの永続化など、通常サーバーサイドで管理される機能は、Web Storage API (localStorage) を活用してクライアントサイドで実現する必要があり、これによりユーザー固有のデータ（ハイスコアなど）をブラウザに保存し、リロード後も維持できます。アセットのパス管理は、GitHub Pages のベース URL を考慮した相対パスまたは動的なパス解決を用いることで、デプロイ時の問題を防ぎます。

### **結論**

本仕様書は、スイカゲームの Web アプリ版を完全に再現するために必要な全ての技術的要素とゲームメカニクスを網羅しています。各項目における詳細な記述と、ゲームの「らしさ」や「楽しさ」を技術的にどのように実現するかという考察は、単なる機能要件を超えた深い理解を提供します。

特に、物理エンジンの選定とパラメータ調整は、ゲームの「予測不能性」と「手触り」を再現する上で極めて重要であり、単なる物理法則の正確な再現ではなく、ゲームプレイの面白さを最大化するためのチューニングが求められます。また、UI/UX の設計においては、レスポンシブデザインと、プレイヤーの戦略的思考を補助する情報表示が不可欠です。サウンドデザインは、ゲームの没入感を高め、プレイヤーへのフィードバックを強化する上で重要な役割を果たします。

本仕様書に記載された情報と推奨事項を基にすることで、開発者は高品質なスイカゲームの Web アプリクローンを構築し、GitHub Pages を通じて手軽に公開することが可能となるでしょう。

#### **引用文献**

1. スイカゲームをやった｜ mofu \- note, 5 月 28, 2025 にアクセス、 [https://note.com/rimo_ton/n/nebeb17abb01b](https://note.com/rimo_ton/n/nebeb17abb01b)
2. これだけ知ってれば大丈夫！スイカゲームの攻略と初心者のコツ完全版 \- 合同会社フィリー, 5 月 28, 2025 にアクセス、 [https://fily.co.jp/diary/suikagame-beginners-guide/](https://fily.co.jp/diary/suikagame-beginners-guide/)
3. 私のテニス熱狂を支える“スイカゲーム”の魅力とは, 5 月 28, 2025 にアクセス、 [https://king-gear.com/articles/1804](https://king-gear.com/articles/1804)
4. 【スイカゲーム】流行った理由は、物理エンジンによる複雑系だが完全運ゲーではないバランスの良さ | かずログ, 5 月 28, 2025 にアクセス、 [https://kazulog.fun/note/suikagame/](https://kazulog.fun/note/suikagame/)
5. スイカゲーム \- Wikipedia, 5 月 28, 2025 にアクセス、 [https://ja.wikipedia.org/wiki/%E3%82%B9%E3%82%A4%E3%82%AB%E3%82%B2%E3%83%BC%E3%83%A0](https://ja.wikipedia.org/wiki/%E3%82%B9%E3%82%A4%E3%82%AB%E3%82%B2%E3%83%BC%E3%83%A0)
6. AI 活用でゲームは作れる！？ChatGPT-4o でスイカゲームを作ってみた | SOLUTION MAGAZINE, 5 月 28, 2025 にアクセス、 [https://ai-create.net/magazine/2024/10/16/post-19691/](https://ai-create.net/magazine/2024/10/16/post-19691/)
7. 日本ゲーム（スイカゲーム） | フリーゲーム投稿サイト unityroom, 5 月 28, 2025 にアクセス、 [https://unityroom.com/games/nihongame](https://unityroom.com/games/nihongame)
8. Android 版 スイカゲーム-Aladdin X まとめページ \- 4Gamer, 5 月 28, 2025 にアクセス、 [https://www.4gamer.net/games/788/G078806/](https://www.4gamer.net/games/788/G078806/)
9. スイカゲームのルール・操作方法のまとめ【Nintendo Switch】, 5 月 28, 2025 にアクセス、 [https://www.workgame-espo.com/game/watermelon-game/watermelon-game-rules/](https://www.workgame-espo.com/game/watermelon-game/watermelon-game-rules/)
10. 【スイカゲーム】最高得点は何点？世界記録や何点からすごいのか成績を調査スイカゲーム 最高得点 | アプリテラス, 5 月 28, 2025 にアクセス、 [https://mba-international.jp/article/suikagame-bestscore/](https://mba-international.jp/article/suikagame-bestscore/)
11. Scratch でスイカゲームの本物再現に挑戦してる作品 9 作 \- スクラッチコーチ, 5 月 28, 2025 にアクセス、 [https://scratch.coach/segment/suika-game-real/](https://scratch.coach/segment/suika-game-real/)
12. 『スイカゲーム』完全攻略。スイカの作り方から、整地する技術や時差置きなど上級テクニックまで, 5 月 28, 2025 にアクセス、 [https://news.denfaminicogamer.jp/kikakuthetower/231031f](https://news.denfaminicogamer.jp/kikakuthetower/231031f)
13. SG-次に落とすフルーツを予告する part09 \- あのゲームの作り方 Web 版, 5 月 28, 2025 にアクセス、 [https://anogame.net/sg-09-yokoku-drop-fruits/](https://anogame.net/sg-09-yokoku-drop-fruits/)
14. 【\#068】発売から 2 年！突然話題になった『スイカゲーム』 \- やさしさまんてん, 5 月 28, 2025 にアクセス、 [https://mannten.com/1482/](https://mannten.com/1482/)
15. 初心者向けページ 基本ルールなど \- スイカゲーム攻略 wiki \- atwiki（アットウィキ）, 5 月 28, 2025 にアクセス、 [https://w.atwiki.jp/suikagame/pages/19.html](https://w.atwiki.jp/suikagame/pages/19.html)
16. 今話題の【スイカゲーム】のコツ｜上手くなる方法 \- NoxPlayer, 5 月 28, 2025 にアクセス、 [https://jp.bignox.com/blog/%E4%BB%8A%E8%A9%B1%E9%A1%8C%E3%81%AE%E3%80%90%E3%82%B9%E3%82%A4%E3%82%AB%E3%82%B2%E3%83%BC%E3%83%A0%E3%80%91%E3%81%AE%E3%82%B3%E3%83%84%EF%BD%9C%E4%B8%8A%E6%89%8B%E3%81%8F%E3%81%AA%E3%82%8B%E6%96%B9/](https://jp.bignox.com/blog/%E4%BB%8A%E8%A9%B1%E9%A1%8C%E3%81%AE%E3%80%90%E3%82%B9%E3%82%A4%E3%82%AB%E3%82%B2%E3%83%BC%E3%83%A0%E3%80%91%E3%81%AE%E3%82%B3%E3%83%84%EF%BD%9C%E4%B8%8A%E6%89%8B%E3%81%8F%E3%81%AA%E3%82%8B%E6%96%B9/)
17. スイカゲームは時間泥棒｜ sora \- note, 5 月 28, 2025 にアクセス、 [https://note.com/soranozuttosaki/n/nd2e71dd77bee](https://note.com/soranozuttosaki/n/nd2e71dd77bee)
18. SG10 \- スイカゲームの作り方 スコアアップ処理と UI への反映 \- YouTube, 5 月 28, 2025 にアクセス、 [https://www.youtube.com/watch?v=Nm1T93suU6s](https://www.youtube.com/watch?v=Nm1T93suU6s)
19. SG-ゲームオーバーの実装！part11 \- あのゲームの作り方 Web 版, 5 月 28, 2025 にアクセス、 [https://anogame.net/sg-11-gameover/](https://anogame.net/sg-11-gameover/)
20. 【Unity】「ぷるぷる ゆっくり すいかげーむ」を作ってみた(１)ゲームシステム編 \- note, 5 月 28, 2025 にアクセス、 [https://note.com/yamasho55/n/nc067d17e20b6](https://note.com/yamasho55/n/nc067d17e20b6)
21. 爆速(1 時間)でスイカゲーム作ってみた\!\! \- Qiita, 5 月 28, 2025 にアクセス、 [https://qiita.com/bearl27/items/fd02c0f959112d2690b6](https://qiita.com/bearl27/items/fd02c0f959112d2690b6)
22. UE5 でスイカゲーム風 \#11 ゲームオーバー | よっしーの 100 チャレンジ, 5 月 28, 2025 にアクセス、 [https://yossi40-100.com/ue5suika12/](https://yossi40-100.com/ue5suika12/)
23. \[JS\]スマホも対応、HTML5 を使ったゲームを作成できる 2D の JavaScript 物理エンジン \-Planck.js, 5 月 28, 2025 にアクセス、 [https://coliss.com/articles/build-websites/operation/javascript/2d-javascript-physics-engine-planck.html](https://coliss.com/articles/build-websites/operation/javascript/2d-javascript-physics-engine-planck.html)
24. 【GAS でサイエンス】2D 物理シミュレーション用ライブラリ「Matter.js」を GAS に組み込んでみる, 5 月 28, 2025 にアクセス、 [https://note.com/prog_article5/n/nc8a38a7522d3](https://note.com/prog_article5/n/nc8a38a7522d3)
25. ブラウザで動く物理エンジン【Matter.js】を試してみる \- 株式会社グローバルゲート公式ブログ, 5 月 28, 2025 にアクセス、 [https://www.globalgate.co.jp/blog/using-matterjs](https://www.globalgate.co.jp/blog/using-matterjs)
26. 【Babylon.js】物理エンジンを使ってみた \#JavaScript \- Qiita, 5 月 28, 2025 にアクセス、 [https://qiita.com/yuki_doi/items/896c38fa8ed9f7b39944](https://qiita.com/yuki_doi/items/896c38fa8ed9f7b39944)
27. \[UI デザイナーが学ぶ\]Three.js の物理演算の話｜ fsato \- note, 5 月 28, 2025 にアクセス、 [https://note.com/satofaction/n/n706cf00e3168](https://note.com/satofaction/n/n706cf00e3168)
28. matter.js でゲーム \- 趣味でプログラミング, 5 月 28, 2025 にアクセス、 [https://game.handmade.jp/matter-js%E3%81%A7%E3%82%B2%E3%83%BC%E3%83%A0%E4%BD%9C%E3%82%8A/](https://game.handmade.jp/matter-js%E3%81%A7%E3%82%B2%E3%83%BC%E3%83%A0%E4%BD%9C%E3%82%8A/)
29. matter.js × 加速度センサーで web 上で物体をシェイクさせよう！ \#JavaScript \- Qiita, 5 月 28, 2025 にアクセス、 [https://qiita.com/cheez921/items/f0c14e856d8508f1b04a](https://qiita.com/cheez921/items/f0c14e856d8508f1b04a)
30. 【Matter.js】物理演算で遊べるサイトを作る【エイプリルフール】 \- Zenn, 5 月 28, 2025 にアクセス、 [https://zenn.dev/orch_canvas/articles/matterjs-resize-dispose](https://zenn.dev/orch_canvas/articles/matterjs-resize-dispose)
31. 理科カタログ 2023 \- 島津理化, 5 月 28, 2025 にアクセス、 [https://www.shimadzu-rika.co.jp/guide/actibook/s_high2023/original.pdf](https://www.shimadzu-rika.co.jp/guide/actibook/s_high2023/original.pdf)
32. 中村伝『統計力学』 \- 理論物理学 PDF (要点と途中計算を分離), 5 月 28, 2025 にアクセス、 [http://everything-arises-from-the-principle-of-physics.com/wp-content/uploads/2020/06/stat-rewrite-Merged.pdf](http://everything-arises-from-the-principle-of-physics.com/wp-content/uploads/2020/06/stat-rewrite-Merged.pdf)
33. 虎の巻 \- CBI 学会, 5 月 28, 2025 にアクセス、 [https://cbi-society.org/home/documents/eBook/Biomod2016.pdf](https://cbi-society.org/home/documents/eBook/Biomod2016.pdf)
34. R 言語 CRAN パッケージ一覧 \- トライフィールズ・ラボ, 5 月 28, 2025 にアクセス、 [https://www.trifields.jp/statistical-analysis-r-cran-packages-341](https://www.trifields.jp/statistical-analysis-r-cran-packages-341)
35. 量子力学 Ⅰ/一次元箱形障壁のトンネル \- 武内＠筑波大, 5 月 28, 2025 にアクセス、 [https://dora.bk.tsukuba.ac.jp/\~takeuchi/?%E9%87%8F%E5%AD%90%E5%8A%9B%E5%AD%A6%E2%85%A0/%E4%B8%80%E6%AC%A1%E5%85%83%E7%AE%B1%E5%BD%A2%E9%9A%9C%E5%A3%81%E3%81%AE%E3%83%88%E3%83%B3%E3%83%8D%E3%83%AB](https://dora.bk.tsukuba.ac.jp/~takeuchi/?%E9%87%8F%E5%AD%90%E5%8A%9B%E5%AD%A6%E2%85%A0/%E4%B8%80%E6%AC%A1%E5%85%83%E7%AE%B1%E5%BD%A2%E9%9A%9C%E5%A3%81%E3%81%AE%E3%83%88%E3%83%B3%E3%83%8D%E3%83%AB)
36. 第 33 回 照明光の色味｜ CCS \- シーシーエス株式会社, 5 月 28, 2025 にアクセス、 [https://www.ccs-inc.co.jp/guide/column/light_color/vol33.html](https://www.ccs-inc.co.jp/guide/column/light_color/vol33.html)
37. 電気のお話その 1 \- 機械技術屋から見た電気、エネルギー編 \- AnfoWorld, 5 月 28, 2025 にアクセス、 [http://www.anfoworld.com/Elecitel.html](http://www.anfoworld.com/Elecitel.html)
38. 分子動力学法の基礎 \- CBI 学会, 5 月 28, 2025 にアクセス、 [https://cbi-society.org/home/documents/eBook/ebook6_MD_ed1A.pdf](https://cbi-society.org/home/documents/eBook/ebook6_MD_ed1A.pdf)
39. エレクトロニクス：理学科物理コース, 5 月 28, 2025 にアクセス、 [https://www.phys.kindai.ac.jp/laboratory/kondo/lectures/electronics.pdf](https://www.phys.kindai.ac.jp/laboratory/kondo/lectures/electronics.pdf)
40. Flutter と Flame でスイカゲーム風のゲームを作る（サンプルソースあり） \- Zenn, 5 月 28, 2025 にアクセス、 [https://zenn.dev/yousetsu/articles/ccf20273927087](https://zenn.dev/yousetsu/articles/ccf20273927087)
41. 物理から作るスイカゲーム \#C++ \- Qiita, 5 月 28, 2025 にアクセス、 [https://qiita.com/comefrombottom/items/244cdf905e9275b5ee5f](https://qiita.com/comefrombottom/items/244cdf905e9275b5ee5f)
42. 100 インチで「スイカゲーム」 Aladdin X、15 万円を切る超短焦点プロジェクターを発売 \- ITmedia, 5 月 28, 2025 にアクセス、 [https://www.itmedia.co.jp/news/articles/2310/30/news162.html](https://www.itmedia.co.jp/news/articles/2310/30/news162.html)
43. 本家『スイカゲーム』もプレイできる！ 100 インチの大画面でゲームや映画が楽しめる置き型プロジェクター“Aladdin Marca（アラジン マルカ）”がすごい \- 電撃オンライン, 5 月 28, 2025 にアクセス、 [https://dengekionline.com/articles/209083/](https://dengekionline.com/articles/209083/)
44. SG09 \- スイカゲームの作り方 次のフルーツを予告する UI 作成 \- YouTube, 5 月 28, 2025 にアクセス、 [https://www.youtube.com/watch?v=eAeVNBLFqZs](https://www.youtube.com/watch?v=eAeVNBLFqZs)
45. スイカゲーム （수박게임) の作り方 【画像付き】 推しバージョンを作ってみよう \- Nicho-log, 5 月 28, 2025 にアクセス、 [https://nicho-i-land.com/watermelongame/](https://nicho-i-land.com/watermelongame/)
46. 「スイカゲーム」で実際の大きさ比率の“惑星版”を作った結果 オチに「分かっていたのに笑った」「想像以上のスケールｗ」（1/2） | ねとらぼ, 5 月 28, 2025 にアクセス、 [https://nlab.itmedia.co.jp/cont/articles/3365124/](https://nlab.itmedia.co.jp/cont/articles/3365124/)
47. ［iPad］でゲーム 画面を横にして遊べるようになった［スイカゲーム］を iPad で入手して遊ぼう \- YouTube, 5 月 28, 2025 にアクセス、 [https://www.youtube.com/watch?v=bJoyCCcyhhc](https://www.youtube.com/watch?v=bJoyCCcyhhc)
48. スイカゲーム画面をカスタマイズ！？Nintendo Switch 版「スイカゲーム ®」パーツを組み合わせて着せ替えも楽しめるスキン追加パックが新登場！, 5 月 28, 2025 にアクセス、 [https://suikagame.jp/news/323/](https://suikagame.jp/news/323/)
49. Nintendo Switch 版スイカゲーム ® に可愛さ満開の春デザインが新登場！4 種類の新作スキンでゲーム画面が華やかに！ | 最新情報 | スイカゲーム 【公式サイト】 | Aladdin X Inc., 5 月 28, 2025 にアクセス、 [https://suikagame.jp/news/586/](https://suikagame.jp/news/586/)
50. Nintendo Switch 版スイカゲーム ® に可愛さ満開の春デザインが新登場！4 種類の新作スキンでゲーム画面が華やかに！, 5 月 28, 2025 にアクセス、 [https://prtimes.jp/main/html/rd/p/000000063.000105092.html](https://prtimes.jp/main/html/rd/p/000000063.000105092.html)
51. 『スイカゲーム』の公式 BGM 集“スイカゲーム BGM コレクション”が各種音楽配信サービスで配信スタート。メインテーマ曲をはじめ全 6 曲を収録 \- ファミ通, 5 月 28, 2025 にアクセス、 [https://www.famitsu.com/article/202411/25852](https://www.famitsu.com/article/202411/25852)
52. 「スイカゲーム BGM コレクション」，Apple Music や Spotify などの音楽配信サービスで配信開始。メインテーマを含む全 6 曲を収録 \- 4Gamer, 5 月 28, 2025 にアクセス、 [https://www.4gamer.net/games/608/G060891/20241129018/](https://www.4gamer.net/games/608/G060891/20241129018/)
53. 『スイカゲーム』にて「クリスマススキン」期間限定で登場。ゲーム中 BGM もクリスマス化、フルーツたちの賑やかクリスマス \- AUTOMATON, 5 月 28, 2025 にアクセス、 [https://automaton-media.com/articles/newsjp/20231221-276864/](https://automaton-media.com/articles/newsjp/20231221-276864/)
54. 「スイカゲーム」，本日よりクリスマススキンを配信。背景やキャラ，BGM がホリデー仕様に変化する, 5 月 28, 2025 にアクセス、 [https://www.4gamer.net/games/608/G060891/20231221021/](https://www.4gamer.net/games/608/G060891/20231221021/)
55. 【スイカゲーム】もう無理だと諦めかけた、次の瞬間…。【異音注意】 \#shorts \#スイカゲーム, 5 月 28, 2025 にアクセス、 [https://www.youtube.com/watch?v=x8I6nV78iNg](https://www.youtube.com/watch?v=x8I6nV78iNg)
56. スイカゲームクローン ロロパズミクスの企画意図と改善点｜とくめい（匿名） \- note, 5 月 28, 2025 にアクセス、 [https://note.com/tokumeinanasi/n/nb8ad2568340d](https://note.com/tokumeinanasi/n/nb8ad2568340d)
57. スイカゲーム BGM コレクション \- OTOTOY, 5 月 28, 2025 にアクセス、 [https://ototoy.jp/\_/default/p/2426092](https://ototoy.jp/_/default/p/2426092)
58. 『スイカゲーム』高得点のコツとテクニック \- みみほネット, 5 月 28, 2025 にアクセス、 [https://mimiho.net/?p=44](https://mimiho.net/?p=44)
59. ワンクリ勇者 | フリーゲーム投稿サイト unityroom, 5 月 28, 2025 にアクセス、 [https://unityroom.com/games/rhythm_battle](https://unityroom.com/games/rhythm_battle)
60. 用語集 \- スイカゲーム攻略 wiki \- atwiki（アットウィキ）, 5 月 28, 2025 にアクセス、 [https://w.atwiki.jp/suikagame/pages/18.html](https://w.atwiki.jp/suikagame/pages/18.html)
61. Q：プレイ中に一瞬ポーズをするのはなぜですか？【スイカゲーム】 \- YouTube, 5 月 28, 2025 にアクセス、 [https://m.youtube.com/shorts/9a1rbVMGuhU](https://m.youtube.com/shorts/9a1rbVMGuhU)
62. よくある質問 \- スイカゲーム攻略 wiki \- atwiki（アットウィキ）, 5 月 28, 2025 にアクセス、 [https://w.atwiki.jp/suikagame/pages/5.html](https://w.atwiki.jp/suikagame/pages/5.html)
63. HTML5 Canvas のパフォーマンスの改善 | Articles \- web.dev, 5 月 28, 2025 にアクセス、 [https://web.dev/articles/canvas-performance?hl=ja](https://web.dev/articles/canvas-performance?hl=ja)
64. 【HTML】Canvas の高速化【JavaScript】 \- Qiita, 5 月 28, 2025 にアクセス、 [https://qiita.com/ML081/items/c63e22c706eb0298dd75](https://qiita.com/ML081/items/c63e22c706eb0298dd75)
65. ゲームでの処理の最適化について｜黒河優介 \- note, 5 月 28, 2025 にアクセス、 [https://note.com/wotakuro/n/n792dda31d92d](https://note.com/wotakuro/n/n792dda31d92d)
66. Canvas2D アニメーション基本のキ \- Zenn, 5 月 28, 2025 にアクセス、 [https://zenn.dev/con_ns_pgm/articles/41aa0d6dac01b8](https://zenn.dev/con_ns_pgm/articles/41aa0d6dac01b8)
67. Canvas だけじゃない！requestAnimationFrame を使ったアニメーション表現 \- ICS MEDIA, 5 月 28, 2025 にアクセス、 [https://ics.media/entry/210414/](https://ics.media/entry/210414/)
68. JavaScript でゲーム作り「17-3：Canvas 描画の最適化 ダブルバッファリング」 \- Timelessberry, 5 月 28, 2025 にアクセス、 [https://timelessberry.com/column/jsgame/js17ex3doublebuffer.html](https://timelessberry.com/column/jsgame/js17ex3doublebuffer.html)
69. パフォーマンスの基礎 \- MDN Web Docs, 5 月 28, 2025 にアクセス、 [https://developer.mozilla.org/ja/docs/Web/Performance/Guides/Fundamentals](https://developer.mozilla.org/ja/docs/Web/Performance/Guides/Fundamentals)
70. 【AQUOS sense9 レビュー】性能もカメラも進化！使いやすさ No.1 スマホ！使ってみた感想とメリット・デメリット・評価 \- ちびめがねアンテナ, 5 月 28, 2025 にアクセス、 [https://chibimegane.jp/aquos-sense9/](https://chibimegane.jp/aquos-sense9/)
71. Diary \- WHITE ARTS, 5 月 28, 2025 にアクセス、 [https://tomoki.yukishigure.com/diary.htm](https://tomoki.yukishigure.com/diary.htm)
