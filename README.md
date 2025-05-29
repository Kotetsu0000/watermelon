# # スイカゲーム Web アプリ

Matter.js を使用した HTML5 ゲーム「スイカゲーム」の Web ブラウザ版です。

## 遊び方

1. 「スタート」ボタンをクリックしてゲームを開始
2. マウスでフルーツを落とす位置を決め、クリックして落下させる
3. 同じフルーツ同士が衝突すると合体して次のフルーツに進化
4. できるだけ大きなフルーツを作りスコアを稼ごう
5. フルーツが上部ラインを 3 秒以上超えるか、落下位置が不正だとゲームオーバー

## アセットについて

### フルーツ画像

-   `generate_placeholders.html` をブラウザで開いて「プレースホルダー画像を生成」ボタンをクリックし、
    表示された画像を右クリックで保存して `images/` フォルダに配置してください。
-   各フルーツ画像は以下のファイル名で保存する必要があります:
    -   さくらんぼ: sakuranbo.png
    -   いちご: ichigo.png
    -   ぶどう: budou.png
    -   デコポン: dekopon.png
    -   かき: kaki.png
    -   りんご: ringo.png
    -   なし: nashi.png
    -   もも: momo.png
    -   パイナップル: pineapple.png
    -   メロン: melon.png
    -   スイカ: suika.png

### サウンドファイル

-   以下の音声ファイルを `sounds/` フォルダに配置してください:
    -   BGM: bgm_main.mp3, bgm_gameover.mp3
    -   効果音: drop.mp3, collision.mp3, merge.mp3, watermelon_merge.mp3, gameover.mp3, gamestart.mp3
