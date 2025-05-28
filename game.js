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

// ゲーム設定
const canvasWidth = 300;
const canvasHeight = 500;

// フルーツの進化テーブル (仕様書 2.1)
const fruitData = [
    { id: 0, name: 'さくらんぼ', evolutionTo: 1, score: 1, radius: 15, image: 'images/sakuranbo.png', color: '#FFB6C1' }, // LightPink
    { id: 1, name: 'いちご', evolutionTo: 2, score: 3, radius: 20, image: 'images/ichigo.png', color: '#FF6347' }, // Tomato
    { id: 2, name: 'ぶどう', evolutionTo: 3, score: 6, radius: 25, image: 'images/budou.png', color: '#8A2BE2' }, // BlueViolet
    { id: 3, name: 'デコポン', evolutionTo: 4, score: 10, radius: 30, image: 'images/dekopon.png', color: '#FFA500' }, // Orange
    { id: 4, name: 'かき', evolutionTo: 5, score: 15, radius: 35, image: 'images/kaki.png', color: '#FF8C00' },     // DarkOrange
    { id: 5, name: 'りんご', evolutionTo: 6, score: 21, radius: 40, image: 'images/ringo.png', color: '#FF0000' },   // Red
    { id: 6, name: 'なし', evolutionTo: 7, score: 28, radius: 45, image: 'images/nashi.png', color: '#90EE90' },   // LightGreen
    { id: 7, name: 'もも', evolutionTo: 8, score: 36, radius: 50, image: 'images/momo.png', color: '#FFC0CB' },     // Pink
    { id: 8, name: 'パイナップル', evolutionTo: 9, score: 45, radius: 55, image: 'images/pineapple.png', color: '#FFFFE0' }, // LightYellow
    { id: 9, name: 'メロン', evolutionTo: 10, score: 55, radius: 60, image: 'images/melon.png', color: '#98FB98' },   // PaleGreen
    { id: 10, name: 'スイカ', evolutionTo: null, score: 66, radius: 70, image: 'images/suika.png', color: '#32CD32' }    // LimeGreen
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

// ゲームループ
function gameLoop(timestamp) {
    if (gameState === 'playing') {
        // 物理エンジンの更新
        Engine.update(engine, 1000 / 60); // 60FPS想定

        // 描画処理
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// 描画関数
function draw() {
    // Canvasクリア
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Matter.js のボディを描画
    const bodies = Matter.Composite.allBodies(world);
    bodies.forEach((body) => {
        if (body.isStatic) { // 静的な壁などの描画 (デバッグ用)
            // ctx.beginPath();
            // body.parts.forEach((part, i) => {
            //     if (i === 0) ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
            //     else ctx.lineTo(part.vertices[0].x, part.vertices[0].y);
            //     for (let k = 1; k < part.vertices.length; k++) {
            //         ctx.lineTo(part.vertices[k].x, part.vertices[k].y);
            //     }
            //     if (i === 0) ctx.lineTo(part.vertices[0].x, part.vertices[0].y);
            // });
            // ctx.strokeStyle = '#333';
            // ctx.lineWidth = 1;
            // ctx.stroke();
        } else if (body.fruitInfo) { // フルーツの描画
            const fruit = body.fruitInfo;
            // TODO: 画像描画処理 (仕様書 4.2)
            // 現時点では色付きの円で描画
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, fruit.radius, 0, Math.PI * 2);
            ctx.fillStyle = fruit.color;
            ctx.fill();
            ctx.strokeStyle = '#555'; // 輪郭線
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            // フルーツの名前をデバッグ表示 (任意)
            // ctx.fillStyle = 'black';
            // ctx.font = '10px Arial';
            // ctx.textAlign = 'center';
            // ctx.fillText(fruit.name, body.position.x, body.position.y + fruit.radius + 10);
        }
    });

    // 次に落下するフルーツのプレビュー (もしあれば)
    if (currentDroppingFruit && gameState === 'playing') {
        const previewFruit = currentDroppingFruit.fruitInfo;
        ctx.beginPath();
        ctx.arc(currentDroppingFruit.position.x, currentDroppingFruit.position.y, previewFruit.radius, 0, Math.PI * 2);
        ctx.fillStyle = previewFruit.color;
        ctx.globalAlpha = 0.5; // 半透明で表示
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.closePath();
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
        friction: 0.2,    // 摩擦係数 (仕様書 3.2, 要調整)
                canvasHeight / 2,
                wallThickness,
                canvasHeight,
                wallOptions
            )
        );
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

        // selectNextFruit();
    }
}

// 初期化実行
initializeGame();

console.log('スイカゲーム script loaded');
console.log('Matter.js version:', Matter.version);
