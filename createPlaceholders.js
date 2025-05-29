// フルーツのプレースホルダー画像を生成するスクリプト
// Node.jsで実行してください

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// フルーツデータ (game.jsと同じ定義)
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

// プレースホルダー画像を生成する関数
function createFruitPlaceholder(fruit) {
    // 画像サイズはフルーツの半径の2倍 + パディング
    const padding = 4;
    const size = fruit.radius * 2 + padding * 2;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 透明な背景
    ctx.clearRect(0, 0, size, size);
    
    // フルーツの円を描画
    ctx.beginPath();
    ctx.arc(size/2, size/2, fruit.radius, 0, Math.PI * 2);
    ctx.fillStyle = fruit.color;
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // フルーツの名前を描画
    ctx.font = `${Math.max(10, fruit.radius/2)}px sans-serif`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fruit.name, size/2, size/2);

    // PNGとして保存
    const buffer = canvas.toBuffer('image/png');
    const fileName = path.basename(fruit.image);
    const filePath = path.join(__dirname, 'images', fileName);
    fs.writeFileSync(filePath, buffer);
    console.log(`Created: ${filePath}`);
}

// imagesディレクトリの作成（存在しない場合）
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`Created directory: ${imagesDir}`);
}

// すべてのフルーツのプレースホルダー画像を生成
fruitData.forEach(fruit => {
    createFruitPlaceholder(fruit);
});

console.log('All fruit placeholder images created successfully!');
