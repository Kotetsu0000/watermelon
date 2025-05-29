// audio.js - サウンド機能の実装

// オーディオファイル参照
const audioFiles = {
    // BGM
    bgm: {
        main: 'sounds/bgm_main.mp3',
        gameOver: 'sounds/bgm_gameover.mp3',
    },
    // 効果音
    sfx: {
        fruitDrop: 'sounds/drop.mp3',
        fruitCollision: 'sounds/collision.mp3',
        fruitMerge: 'sounds/merge.mp3',
        watermelonMerge: 'sounds/watermelon_merge.mp3',
        gameOver: 'sounds/gameover.mp3',
        gameStart: 'sounds/gamestart.mp3',
    },
};

// オーディオオブジェクト格納用
const audioObjects = {
    bgm: {},
    sfx: {},
};

// 音量設定
let bgmVolume = 0.3;
let sfxVolume = 0.5;

// オーディオファイルの事前読み込み
async function preloadAudio() {
    try {
        // BGM読み込み
        for (const [key, path] of Object.entries(audioFiles.bgm)) {
            try {
                audioObjects.bgm[key] = new Audio(path);
                audioObjects.bgm[key].loop = true; // BGMはループ再生
                audioObjects.bgm[key].volume = bgmVolume;

                // エラーハンドリング
                audioObjects.bgm[key].onerror = () => {
                    console.warn(`BGMファイルのロードに失敗しました: ${path}`);
                };
            } catch (e) {
                console.warn(`BGMの読み込みに失敗しました: ${path}`, e);
                // エラー時も続行
            }
        }

        // 効果音読み込み
        for (const [key, path] of Object.entries(audioFiles.sfx)) {
            try {
                audioObjects.sfx[key] = new Audio(path);
                audioObjects.sfx[key].volume = sfxVolume;

                // エラーハンドリング
                audioObjects.sfx[key].onerror = () => {
                    console.warn(
                        `効果音ファイルのロードに失敗しました: ${path}`
                    );
                };
            } catch (e) {
                console.warn(`効果音の読み込みに失敗しました: ${path}`, e);
                // エラー時も続行
            }
        }

        console.log('オーディオファイルの読み込み処理を完了しました');
    } catch (error) {
        console.error(
            'オーディオファイルの読み込み中にエラーが発生しました:',
            error
        );
        // エラー時もゲームは続行できるように
    }
}

// BGM再生
function playBGM(key) {
    try {
        // 現在再生中のBGMをすべて停止
        for (const audio of Object.values(audioObjects.bgm)) {
            audio.pause();
            audio.currentTime = 0;
        }

        // 指定されたBGMを再生
        if (audioObjects.bgm[key]) {
            audioObjects.bgm[key]
                .play()
                .catch((error) =>
                    console.warn(`BGM再生エラー: ${error.message}`)
                );
        }
    } catch (error) {
        console.warn(`BGM再生中にエラーが発生しました: ${error.message}`);
    }
}

// 効果音再生
function playSFX(key) {
    try {
        if (audioObjects.sfx[key]) {
            // 効果音は複数の効果音が重なる可能性があるので、クローンして再生
            const sound = audioObjects.sfx[key].cloneNode();
            sound.volume = sfxVolume;
            sound
                .play()
                .catch((error) =>
                    console.warn(`効果音再生エラー: ${error.message}`)
                );
        }
    } catch (error) {
        console.warn(`効果音再生中にエラーが発生しました: ${error.message}`);
    }
}

// 音量設定
function setBGMVolume(volume) {
    bgmVolume = Math.max(0, Math.min(1, volume));
    for (const audio of Object.values(audioObjects.bgm)) {
        audio.volume = bgmVolume;
    }
}

function setSFXVolume(volume) {
    sfxVolume = Math.max(0, Math.min(1, volume));
}

// オーディオが未ロードでも安全に再生するためのラッパー関数
function safeBGM(key) {
    if (!audioObjects.bgm[key]) return false;
    playBGM(key);
    return true;
}

function safeSFX(key) {
    if (!audioObjects.sfx[key]) return false;
    playSFX(key);
    return true;
}

// ミュート機能
let isMuted = false;

function toggleMute() {
    isMuted = !isMuted;

    for (const audio of Object.values(audioObjects.bgm)) {
        audio.muted = isMuted;
    }

    for (const audio of Object.values(audioObjects.sfx)) {
        audio.muted = isMuted;
    }

    return isMuted; // 現在のミュート状態を返す
}

// エクスポート
window.gameAudio = {
    preload: preloadAudio,
    playBGM: safeBGM,
    playSFX: safeSFX,
    setBGMVolume,
    setSFXVolume,
    toggleMute,
};
