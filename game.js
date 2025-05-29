// Matter.js モジュール
const { Engine, Render, Runner, World, Bodies, Events } = Matter;

// DOM要素
const gameCanvas = document.getElementById('gameCanvas');
const currentScoreDisplay = document.getElementById('currentScore');
const highScoreDisplay = document.getElementById('highScore');
const nextFruitImageDisplay = document.getElementById('nextFruitImage');
const messageTextDisplay = document.getElementById('messageText');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const retryButton = document.getElementById('retryButton');
const muteButton = document.getElementById('muteButton');
const muteIcon = document.getElementById('muteIcon');

// ゲーム設定
const canvasWidth = 300;
const canvasHeight = 500;

// フルーツの進化テーブル (仕様書 2.1)
const fruitData = [
    {
        id: 0,
        name: 'さくらんぼ',
        evolutionTo: 1,
        score: 1,
        radius: 15,
        image: 'images/sakuranbo.png',
        color: '#FFB6C1',
    }, // LightPink
    {
        id: 1,
        name: 'いちご',
        evolutionTo: 2,
        score: 3,
        radius: 20,
        image: 'images/ichigo.png',
        color: '#FF6347',
    }, // Tomato
    {
        id: 2,
        name: 'ぶどう',
        evolutionTo: 3,
        score: 6,
        radius: 25,
        image: 'images/budou.png',
        color: '#8A2BE2',
    }, // BlueViolet
    {
        id: 3,
        name: 'デコポン',
        evolutionTo: 4,
        score: 10,
        radius: 30,
        image: 'images/dekopon.png',
        color: '#FFA500',
    }, // Orange
    {
        id: 4,
        name: 'かき',
        evolutionTo: 5,
        score: 15,
        radius: 35,
        image: 'images/kaki.png',
        color: '#FF8C00',
    }, // DarkOrange
    {
        id: 5,
        name: 'りんご',
        evolutionTo: 6,
        score: 21,
        radius: 40,
        image: 'images/ringo.png',
        color: '#FF0000',
    }, // Red
    {
        id: 6,
        name: 'なし',
        evolutionTo: 7,
        score: 28,
        radius: 45,
        image: 'images/nashi.png',
        color: '#90EE90',
    }, // LightGreen
    {
        id: 7,
        name: 'もも',
        evolutionTo: 8,
        score: 36,
        radius: 50,
        image: 'images/momo.png',
        color: '#FFC0CB',
    }, // Pink
    {
        id: 8,
        name: 'パイナップル',
        evolutionTo: 9,
        score: 45,
        radius: 55,
        image: 'images/pineapple.png',
        color: '#FFFFE0',
    }, // LightYellow
    {
        id: 9,
        name: 'メロン',
        evolutionTo: 10,
        score: 55,
        radius: 60,
        image: 'images/melon.png',
        color: '#98FB98',
    }, // PaleGreen
    {
        id: 10,
        name: 'スイカ',
        evolutionTo: null,
        score: 66,
        radius: 70,
        image: 'images/suika.png',
        color: '#32CD32',
    }, // LimeGreen
];

// Matter.js エンジン初期化
const engine = Engine.create();
const world = engine.world;
engine.world.gravity.y = 0.8; // 重力設定 (仕様書 3.2)

// レンダラー設定 (Matter.js のレンダラーは使わず、Canvas APIで自前描画する方針)
// const render = Render.create({
// element: document.querySelector('.game-area'), // HTMLの描画コンテナ
// engine: engine,
// canvas: gameCanvas,
// options: {
// width: canvasWidth,
// height: canvasHeight,
// wireframes: false, // ワイヤーフレーム表示をオフに
// background: '#ffffff'
// }
// });

// Runner作成 (物理エンジンの更新)
const runner = Runner.create();

// ゲームの境界 (壁)
const wallOptions = {
    isStatic: true,
    restitution: 0.1, // 反発係数
    friction: 0.1, // 摩擦係数
};

const wallThickness = 20; // 壁の厚さ

// 左壁
World.add(
    world,
    Bodies.rectangle(
        wallThickness / 2,
        canvasHeight / 2,
        wallThickness,
        canvasHeight,
        wallOptions
    )
);
// 右壁
World.add(
    world,
    Bodies.rectangle(
        canvasWidth - wallThickness / 2,
        canvasHeight / 2,
        wallThickness,
        canvasHeight,
        wallOptions
    )
);
// 床
World.add(
    world,
    Bodies.rectangle(
        canvasWidth / 2,
        canvasHeight - wallThickness / 2,
        canvasWidth,
        wallThickness,
        wallOptions
    )
);
// 天井 (フルーツが溢れるのを検知するためのセンサーとして利用することも検討)
// World.add(world, Bodies.rectangle(canvasWidth / 2, wallThickness / 2, canvasWidth, wallThickness, { ...wallOptions, isSensor: true, label: 'ceiling' }));

// ゲーム状態
let gameState = 'beforeStart'; // 'beforeStart', 'playing', 'paused', 'gameOver'
let currentScore = 0;
let highScore = localStorage.getItem('watermelonHighScore') || 0;
let nextFruitType = null; // 次に落ちるフルーツの型 (fruitDataの要素)
let currentDroppingFruit = null; // 現在操作中のフルーツ

// Canvas 2D コンテキスト取得
const ctx = gameCanvas.getContext('2d');
gameCanvas.width = canvasWidth;
gameCanvas.height = canvasHeight;

// 天井ライン（ゲームオーバー判定ライン）の設定
const ceilingY = wallThickness * 2; // 上部から少し下にラインを設定

// ゲームオーバー判定用の変数
let overflowTimer = 0; // フルーツがラインを超えた時間カウンター
let isOverflowing = false; // ラインを超えているか

// フルーツ画像の読み込み
const fruitImages = {};

// 全フルーツの画像を事前に読み込む
function preloadImages() {
    let loadedCount = 0;
    const totalImages = fruitData.length;

    return new Promise((resolve, reject) => {
        fruitData.forEach((fruit) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            img.onerror = () => {
                console.warn(`画像の読み込みに失敗しました: ${fruit.image}`);
                // 失敗してもゲームは続行できるようにする
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            img.src = fruit.image;
            fruitImages[fruit.id] = img;
        });
    });
}

// ゲームループ
function gameLoop(timestamp) {
    if (gameState === 'playing') {
        // 物理エンジンの更新
        Engine.update(engine, 1000 / 60); // 60FPS想定

        // ゲームオーバー判定
        checkGameOver();

        // 描画処理
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// 描画関数
function draw() {
    // Canvasクリア
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 天井ラインの描画（ゲームオーバーライン可視化）
    ctx.beginPath();
    ctx.moveTo(0, ceilingY);
    ctx.lineTo(canvasWidth, ceilingY);
    ctx.strokeStyle = isOverflowing ? '#FF0000' : '#AAAAAA'; // 超えていると赤色
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 点線
    ctx.stroke();
    ctx.setLineDash([]); // 点線リセット

    // Matter.js のボディを描画
    const bodies = Matter.Composite.allBodies(world);
    bodies.forEach((body) => {
        if (body.isStatic) {
            // 静的な壁など
            // 必要に応じて壁を描画
        } else if (body.fruitInfo) {
            // フルーツの描画
            const fruit = body.fruitInfo;
            const img = fruitImages[fruit.id];

            // 画像が読み込まれていればそれを描画、なければ色付きの円を描画
            if (img) {
                // 回転を適用して画像描画
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                ctx.drawImage(
                    img,
                    -fruit.radius,
                    -fruit.radius,
                    fruit.radius * 2,
                    fruit.radius * 2
                );
                ctx.restore();
            } else {
                // 画像が無い場合の代替表示（既存の色付き円）
                ctx.beginPath();
                ctx.arc(
                    body.position.x,
                    body.position.y,
                    fruit.radius,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = fruit.color;
                ctx.fill();
                ctx.strokeStyle = '#555'; // 輪郭線
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            }
        }
    });

    // 次に落下するフルーツのプレビュー (もしあれば)
    if (currentDroppingFruit && gameState === 'playing') {
        const previewFruit = currentDroppingFruit.fruitInfo;
        const img = fruitImages[previewFruit.id];

        if (img) {
            // 半透明で画像を表示
            ctx.globalAlpha = 0.5;
            ctx.drawImage(
                img,
                currentDroppingFruit.position.x - previewFruit.radius,
                currentDroppingFruit.position.y - previewFruit.radius,
                previewFruit.radius * 2,
                previewFruit.radius * 2
            );
            ctx.globalAlpha = 1.0;
        } else {
            // 画像がなければ色付き円で表示
            ctx.beginPath();
            ctx.arc(
                currentDroppingFruit.position.x,
                currentDroppingFruit.position.y,
                previewFruit.radius,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = previewFruit.color;
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.closePath();
        }
    }
}

// フルーツ生成関数 (仕様書 3.4)
function createFruit(x, y, fruitType, isStatic = false) {
    const radius = fruitType.radius;
    // 「小さいフルーツの方が相対的に重い」を再現するため、密度を半径の逆数に比例させるか、質量を調整
    // 例: density = 1 / radius または mass を直接設定
    // Matter.jsでは density を設定するのが一般的
    // 仕様書3.2: 小さいフルーツの方が相対的に重い -> 密度を大きくする
    // 基準となる密度。半径が小さいほど密度が大きくなるように調整。
    // 例えば、最小半径のさくらんぼ(15)の密度を基準(e.g., 0.01)とし、半径が大きくなるにつれて密度を小さくする
    const baseDensity = 0.005; // 基本密度 (要調整)
    const densityFactor = fruitData[0].radius / radius; // さくらんぼの半径を基準とした係数
    const density = baseDensity * densityFactor * 2; // さらに重みを増すために係数をかける (要調整)

    const fruitBody = Bodies.circle(x, y, radius, {
        isStatic: isStatic,
        label: `fruit_${fruitType.name}`,
        fruitInfo: fruitType, // フルーツ情報をボディに持たせる
        restitution: 0.3, // 反発係数 (仕様書 3.2, 要調整)
        friction: 0.2, // 摩擦係数 (仕様書 3.2, 要調整)
        density: density, // 密度設定
        // 回転に関する設定
        frictionAir: 0.01, // 空気抵抗（回転減衰）
        torque: 0, // 初期トルク
    });

    // フルーツをワールドに追加
    World.add(world, fruitBody);
    return fruitBody;
}

// 初期化関数
async function initializeGame() {
    // スコア表示の初期化
    currentScore = 0;
    currentScoreDisplay.textContent = currentScore;
    highScore = localStorage.getItem('watermelonHighScore') || 0;
    highScoreDisplay.textContent = highScore;

    // 画像の事前読み込み
    try {
        await preloadImages();
        console.log('すべてのフルーツ画像の読み込みが完了しました');
    } catch (error) {
        console.error('画像の読み込み中にエラーが発生しました:', error);
    }

    // オーディオファイルの事前読み込み（audioモジュールが利用可能な場合）
    if (window.gameAudio) {
        try {
            await window.gameAudio.preload();
        } catch (error) {
            console.warn(
                'オーディオの読み込み中にエラーが発生しました:',
                error
            );
        }
    }

    // ゲーム状態初期化
    gameState = 'beforeStart';
    messageTextDisplay.textContent = 'ゲームをスタート';

    // イベントリスナー設定
    setupEventListeners();

    // 次のフルーツ選択
    selectNextFruit();

    // 物理エンジン開始
    Runner.run(runner, engine);

    // ゲームループ開始
    requestAnimationFrame(gameLoop);
}

// 次のフルーツをランダムに選択 (仕様書 2.3)
function selectNextFruit() {
    // さくらんぼ、いちご、ぶどう、デコポン、かきが均等確率（各20%）
    const initialFruits = fruitData.slice(0, 5);
    const randomIndex = Math.floor(Math.random() * initialFruits.length);
    nextFruitType = initialFruits[randomIndex];

    // 次のフルーツ画像表示
    const img = fruitImages[nextFruitType.id];
    if (img) {
        nextFruitImageDisplay.src = nextFruitType.image;
        nextFruitImageDisplay.style.backgroundColor = 'transparent';
    } else {
        // 画像が利用できない場合は色で表示
        nextFruitImageDisplay.src = '';
        nextFruitImageDisplay.style.backgroundColor = nextFruitType.color;
        nextFruitImageDisplay.style.borderRadius = '50%';
    }
}

// マウス/タッチ座標をCanvas座標に変換
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
    };
}

// イベントリスナー設定
function setupEventListeners() {
    // スタートボタン
    startButton.addEventListener('click', startGame);

    // 一時停止ボタン
    pauseButton.addEventListener('click', togglePause);

    // リトライボタン
    retryButton.addEventListener('click', resetGame);

    // ミュートボタン
    muteButton.addEventListener('click', toggleMute);

    // マウス移動時のプレビュー更新
    gameCanvas.addEventListener('mousemove', updatePreview);

    // タッチデバイスのための対応
    gameCanvas.addEventListener('touchmove', function(evt) {
        evt.preventDefault(); // スクロール防止
        const touch = evt.touches[0];
        const mouseEvt = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        updatePreview(mouseEvt);
    });

    // クリック時のフルーツ落下
    gameCanvas.addEventListener('click', dropFruit);
    
    // タップでのフルーツ落下
    gameCanvas.addEventListener('touchend', function(evt) {
        evt.preventDefault(); // タップ後のズーム防止
        const mouseEvt = new MouseEvent('click');
        dropFruit(mouseEvt);
    });

    // 衝突イベント
    Events.on(engine, 'collisionStart', handleCollisions);
}

// ミュート機能の切り替え
function toggleMute() {
    if (window.gameAudio) {
        const isMuted = window.gameAudio.toggleMute();
        muteIcon.textContent = isMuted ? '🔇' : '🔊';
    }
}

// ゲーム開始
function startGame() {
    if (gameState === 'beforeStart') {
        gameState = 'playing';
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        messageTextDisplay.textContent = '';

        // ゲーム開始効果音とBGM再生
        if (window.gameAudio) {
            window.gameAudio.playSFX('gameStart');
            window.gameAudio.playBGM('main');
        }
    }
}

// 一時停止切り替え
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseButton.textContent = '再開';
        messageTextDisplay.textContent = '一時停止中';

        // BGMをフェードアウトさせるなどの処理も可能
        // 今回はシンプルにループのみ停止
        if (
            window.gameAudio &&
            audioObjects &&
            audioObjects.bgm &&
            audioObjects.bgm.main
        ) {
            audioObjects.bgm.main.pause();
        }
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseButton.textContent = '一時停止';
        messageTextDisplay.textContent = '';

        // BGM再開
        if (
            window.gameAudio &&
            audioObjects &&
            audioObjects.bgm &&
            audioObjects.bgm.main
        ) {
            audioObjects.bgm.main
                .play()
                .catch((e) => console.warn('BGM再開エラー:', e));
        }
    }
}

// ゲームリセット
function resetGame() {
    // 古いフルーツをすべて削除
    const bodies = Matter.Composite.allBodies(world);
    bodies.forEach((body) => {
        if (!body.isStatic) {
            World.remove(world, body);
        }
    });

    // スコア・UI状態のリセット
    currentScore = 0;
    currentScoreDisplay.textContent = currentScore;

    // UI表示の更新
    retryButton.style.display = 'none';
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';

    // 次のフルーツ選択
    selectNextFruit();

    // ゲーム状態の更新
    gameState = 'beforeStart';
    messageTextDisplay.textContent = 'ゲームをスタート';
}

// プレビュー位置の更新
function updatePreview(evt) {
    if (gameState !== 'playing' || currentDroppingFruit) return;

    const pos = getMousePos(gameCanvas, evt);

    // 左右の壁との間の範囲に制限
    const minX = wallThickness + nextFruitType.radius;
    const maxX = canvasWidth - wallThickness - nextFruitType.radius;
    const boundedX = Math.min(Math.max(pos.x, minX), maxX);

    // 新しいプレビューフルーツを作成 (静的で、ワールドには追加せず表示のみ)
    currentDroppingFruit = {
        position: { x: boundedX, y: nextFruitType.radius + 5 }, // 上部に配置
        fruitInfo: nextFruitType,
    };
}

// フルーツ落下
function dropFruit(evt) {
    if (gameState !== 'playing' || currentDroppingFruit === null) return;

    // フルーツの生成位置
    const dropX = currentDroppingFruit.position.x;
    const dropY = nextFruitType.radius + 5; // 画面上部（少し余裕を持たせる）

    // 実際のフルーツを作成してワールドに追加
    const newFruit = createFruit(dropX, dropY, nextFruitType);

    // フルーツ落下効果音
    if (window.gameAudio) {
        window.gameAudio.playSFX('fruitDrop');
    }

    // フルーツが箱に入らなかった場合のゲームオーバー判定（仕様書2.5）
    const leftWallX = wallThickness;
    const rightWallX = canvasWidth - wallThickness;

    if (
        dropX - nextFruitType.radius < leftWallX ||
        dropX + nextFruitType.radius > rightWallX
    ) {
        // 箱の外にフルーツが落下した場合
        console.log('フルーツが箱の外に落下しました');
        gameOver();
        return;
    }

    // 次のフルーツを選択
    selectNextFruit();

    // プレビューをクリア（落下中は次のプレビュー非表示）
    currentDroppingFruit = null;

    // 少し待ってから次のプレビューを有効化（連打防止）
    setTimeout(() => {
        // フルーツ落下完了を判定する何らかのロジック
        // この例では単純に時間で判断
        currentDroppingFruit = {
            position: { x: dropX, y: dropY },
            fruitInfo: nextFruitType,
        };
    }, 500); // 0.5秒待機
}

// 衝突ハンドリング
function handleCollisions(event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        // 衝突音の再生
        if (window.gameAudio) {
            window.gameAudio.playSFX('fruitCollision');
        }

        // 両方がフルーツかつ同じ種類かチェック
        if (
            bodyA.fruitInfo &&
            bodyB.fruitInfo &&
            bodyA.fruitInfo.id === bodyB.fruitInfo.id
        ) {
            // 進化可能かチェック（スイカではない）
            if (bodyA.fruitInfo.evolutionTo !== null) {
                // 中央位置を計算
                const centerX = (bodyA.position.x + bodyB.position.x) / 2;
                const centerY = (bodyA.position.y + bodyB.position.y) / 2;

                // 古いフルーツを削除
                World.remove(world, bodyA);
                World.remove(world, bodyB);

                // 進化後のフルーツを取得
                const nextFruitId = bodyA.fruitInfo.evolutionTo;
                const evolvedFruit = fruitData.find(
                    (fruit) => fruit.id === nextFruitId
                );

                // 「ポップコーン現象」のバランス調整 - 新しいフルーツに軽い初速・角速度を与える
                // 衝突の強さに比例した力を追加
                const collisionForce = Math.sqrt(
                    pairs[i].collision.depth * pairs[i].collision.normal.x ** 2 +
                    pairs[i].collision.depth * pairs[i].collision.normal.y ** 2
                ) * 0.05; // バランス係数、調整可能
                
                // 少しランダム性を加味
                const randomAngle = Math.random() * Math.PI * 2;
                const forceX = Math.cos(randomAngle) * collisionForce;
                const forceY = Math.sin(randomAngle) * collisionForce;
                
                // 進化したフルーツを生成
                const newFruit = createFruit(centerX, centerY, evolvedFruit);
                
                // 初速度と角速度を設定
                Matter.Body.setVelocity(newFruit, { 
                    x: forceX,
                    y: forceY * -1 // 少し上向きに
                });
                Matter.Body.setAngularVelocity(newFruit, (Math.random() - 0.5) * 0.2);

                // フルーツ結合音を再生
                if (window.gameAudio) {
                    window.gameAudio.playSFX('fruitMerge');
                }

                // スコア加算
                updateScore(evolvedFruit.score);
            } else {
                // スイカ同士の場合は消滅して特別スコア加算
                World.remove(world, bodyA);
                World.remove(world, bodyB);

                // スイカ合体の特殊効果音
                if (window.gameAudio) {
                    window.gameAudio.playSFX('watermelonMerge');
                }

                // スイカ同士の結合は66点 (仕様書 2.2)
                updateScore(66);
            }
        }
    }
}

// スコア更新
function updateScore(points) {
    currentScore += points;
    currentScoreDisplay.textContent = currentScore;

    // ハイスコア更新チェック
    if (currentScore > highScore) {
        highScore = currentScore;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('watermelonHighScore', highScore);
    }
}

// ゲームオーバー判定
function checkGameOver() {
    // ラインを超えるフルーツがあるかチェック
    const bodies = Matter.Composite.allBodies(world);
    let anyFruitOverflowing = false;

    // 動的なフルーツだけをチェック
    bodies.forEach((body) => {
        if (!body.isStatic && body.fruitInfo) {
            // フルーツがライン（天井）を超えているか
            if (body.position.y - body.fruitInfo.radius < ceilingY) {
                anyFruitOverflowing = true;
            }
        }
    });

    // ラインを超えている状態の管理
    if (anyFruitOverflowing) {
        if (!isOverflowing) {
            // 初めてラインを超えた
            isOverflowing = true;
            overflowTimer = Date.now();
        } else {
            // すでにラインを超えている時間をチェック
            const overflowDuration = Date.now() - overflowTimer;

            // 3秒ルール (仕様書 2.5)
            if (overflowDuration >= 3000) {
                gameOver();
            }
        }
    } else {
        // ラインを超えていない
        isOverflowing = false;
    }
}

// ゲームオーバー処理
function gameOver() {
    gameState = 'gameOver';

    // UI更新
    messageTextDisplay.textContent = 'GAME OVER';
    pauseButton.style.display = 'none';
    retryButton.style.display = 'inline-block';

    // ゲームオーバー効果音とBGM切り替え
    if (window.gameAudio) {
        window.gameAudio.playSFX('gameOver');
        window.gameAudio.playBGM('gameOver');
    }

    console.log('ゲームオーバー！最終スコア:', currentScore);
}

// 初期化実行
initializeGame();

console.log('スイカゲーム script loaded');
console.log('Matter.js version:', Matter.version);
