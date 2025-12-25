const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { callRealAI } = require('./ai-service');

// --- 配置 --- 
const PORT = process.env.PORT || 3000;
const CACHE_FILE = path.join(__dirname, 'cache.json');

// --- 全局变量 --- 
let translationCache = {};

// --- 缓存管理 --- 

/**
 * 从文件加载缓存到内存
 */
function loadCacheFromFile() {
    try {
        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        translationCache = JSON.parse(data);
        console.log(`✅ 成功加载 ${Object.keys(translationCache).length} 个缓存词条`);
    } catch (err) {
        console.log('❌ 未找到缓存文件，将创建新的 cache.json');
        translationCache = {};
    }
}

/**
 * 更新缓存并保存到文件
 * @param {Object} newWords - 新的翻译结果对象
 */
function updateCacheAndSave(newWords) {
    // 1. 更新内存缓存
    for (const [originalWord, translatedText] of Object.entries(newWords)) {
        const cacheKey = originalWord.toLowerCase();
        translationCache[cacheKey] = translatedText;
    }

    // 2. 异步保存到硬盘
    saveCacheToFile();
}

/**
 * 将内存中的缓存写入硬盘文件
 */
function saveCacheToFile() {
    try {
        const jsonContent = JSON.stringify(translationCache, null, 2);
        
        fs.writeFile(CACHE_FILE, jsonContent, 'utf8', (err) => {
            if (err) {
                console.error('❌ 缓存写入失败:', err);
            } else {
                console.log(`💾 缓存已动态更新到硬盘 (${new Date().toLocaleTimeString()})`);
            }
        });
    } catch (err) {
        console.error('❌ 写入缓存时发生错误:', err);
    }
}

// --- 文本处理函数 --- 

/**
 * 切分函数：把文章拆成单词和符号两个独立的数组
 * @param {string} article - 原始文章
 * @returns {Object} 包含单词数组、符号数组和是否以单词开头的标志
 */
function splitIntoWordsAndSymbols(article) {
    const words = [];
    const symbols = [];
    
    let currentWord = '';
    let currentSymbol = '';
    
    // 逐字符处理文章
    for (const char of article) {
        if (/[a-zA-Z]/.test(char)) {
            // 是字母，加到当前单词里
            currentWord += char;
            if (currentSymbol) {
                symbols.push(currentSymbol);
                currentSymbol = '';
            }
        } else {
            // 不是字母，加到当前符号里
            currentSymbol += char;
            if (currentWord) {
                words.push(currentWord);
                currentWord = '';
            }
        }
    }
    
    // 处理剩余字符
    if (currentWord) words.push(currentWord);
    if (currentSymbol) symbols.push(currentSymbol);
    
    // 判断文章是否以单词开头
    const startsWithWord = article.length > 0 && /[a-zA-Z]/.test(article[0]);
    
    return { words, symbols, startsWithWord };
}

/**
 * 处理翻译请求
 * @param {Array<string>} wordsFromArticle - 文章中的单词列表
 * @returns {Promise<Array<string>>} 翻译后的单词列表
 */
async function processTranslation(wordsFromArticle) {
    const results = [];
    const notin_cache = [];
    
    // 第一次遍历：收集不在缓存中的单词
    for (const word of wordsFromArticle) {
        const key = word.toLowerCase();
        if (!translationCache[key] && notin_cache.indexOf(word) === -1) {
            console.log(`🔍 发现生词: ${word}, 加入翻译队列`);
            notin_cache.push(word);
        }
    }
    
    // 如果有生词，调用AI翻译
    if (notin_cache.length > 0) {
        console.log(`🔍 缓存中的所有生词: ${notin_cache.join(', ')}, 正在调用 AI...`);
        const aiResult = await callRealAI(notin_cache);
        updateCacheAndSave(aiResult);
    }
    
    // 第二次遍历：根据缓存返回结果
    for (const word of wordsFromArticle) {
        const key = word.toLowerCase();
        results.push(translationCache[key]);
    }
    
    return results;
}

/**
 * 还原函数：把单词和符号数组拼回完整文章
 * @param {Object} params - 包含单词、符号、是否以单词开头和翻译后的单词的对象
 * @returns {string} 拼接后的文章
 */
function assembleText({ words, symbols, startsWithWord, translatedWords }) {
    let result = '';
    let wordIndex = 0;
    let symbolIndex = 0;
    
    if (startsWithWord) {
        // 以单词开头：单词、符号、单词、符号...
        while (wordIndex < translatedWords.length) {
            result += translatedWords[wordIndex];
            wordIndex++;
            
            if (symbolIndex < symbols.length) {
                result += symbols[symbolIndex];
                symbolIndex++;
            }
        }
    } else {
        // 以符号开头：符号、单词、符号、单词...
        while (symbolIndex < symbols.length || wordIndex < translatedWords.length) {
            if (symbolIndex < symbols.length) {
                result += symbols[symbolIndex];
                symbolIndex++;
            }
            
            if (wordIndex < translatedWords.length) {
                result += translatedWords[wordIndex];
                wordIndex++;
            }
        }
    }
    
    return result;
}

/**
 * 主翻译函数
 * @param {string} article - 原始文章
 * @returns {Promise<Object>} 翻译结果对象
 */
async function main(article) {
    // 1. 切分文章
    const { words, symbols, startsWithWord } = splitIntoWordsAndSymbols(article);
    console.log('切分结果:', words, symbols, startsWithWord);
    
    // 2. 处理翻译
    const translatedWords = await processTranslation(words);
    
    // 3. 还原文章
    const result = assembleText({ words, symbols, startsWithWord, translatedWords });
    console.log('翻译结果:', translatedWords, '最终文本:', result);
    
    // 4. 返回结果
    return {
        originalArticle: article,
        originalWords: words,
        translatedWords: translatedWords,
        assembledResult: result
    };
}

// --- 服务器启动 --- 

// 1. 先加载缓存
loadCacheFromFile();

// 2. 创建Express应用
const app = express();

// 3. 配置中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// 4. 定义API路由
app.post('/api/main', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: '请提供有效的文本内容'
            });
        }
        
        const translationResult = await main(message);
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...translationResult
        });
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 翻译服务已启动，监听端口 ${PORT}`);
});