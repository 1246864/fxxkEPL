const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const API_KEY = ''; // 替换为你的实际 API 密钥
const MODEL_NAME = 'qwen-plus'; // 替换为你的实际模型名称

async function callRealAI(words) {
    try {
        // 1. 拼接 Prompt
        // 把你要翻译的单词列表发给 AI，并要求它返回 JSON 格式
        const prompt = `
你是一个“神经谐音机”，任务是将任何英文单词（包括代码、缩写、无意义字母组合）都转换成搞笑/有趣的中文谐音。
规则：
1. 必须为每一个单词生成【非空】的中文谐音，禁止返回空字符串！
2. 键必须和输入的单词【完全一致】（包括大小写，如 "escapeHtml" 不能变成 "escapehtml"）。
3. 谐音可以夸张、无厘头，但发音要尽量接近。
4. 只返回纯 JSON 对象，不要任何其他文字、注释或 markdown。

示例输入：["px", "div", "escapeHtml"]
示例输出：{"px": "屁克斯", "div": "弟五", "escapeHtml": "一死凯普嗨特妹儿"}

现在请处理以下单词：
${words.map(word => `"${word.toLowerCase()}": ""`).join(', ')}

请直接返回 JSON：
`;


        // 2. 调用 API (这里以阿里云百炼为例)
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', // 👈 百炼的接口地址
            {
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: 'You are a translator.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1, // 温度低一点，结果更稳定
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`, // 👈 携带 Key
                    'Content-Type': 'application/json'
                }
            }
        );

        // 3. 解析返回结果
        const aiText = response.data.choices[0].message.content;
        
        // AI 返回的应该是一个 JSON 字符串，我们把它转成对象
        // 注意：这里可能需要 try-catch，因为 AI 有时候可能会“发疯”不返回标准 JSON
        let resultObj;
        try {
            console.log('AI 返回原始文本:', aiText);
            resultObj = JSON.parse(aiText);  // 尝试解析 JSON

        } catch (parseError) {
            console.error('AI 返回格式错误，尝试修复...', aiText);
            // 这里可以写一些简单的字符串解析逻辑作为兜底
            //resultObj = simpleParseFallback(aiText, words);
        }

        return resultObj;

    } catch (error) {
        console.error('调用千问 API 失败:', error.response?.data || error.message);
        throw error;
    }
}

// 1. 定义缓存文件的路径
const CACHE_FILE = path.join(__dirname, 'cache.json');

// 2. 全局缓存变量（内存中的数据）
let translationCache = {};

// --- 启动时加载 ---

// 服务器启动时，尝试从硬盘读取缓存到内存
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

// --- 核心：动态更新缓存 ---

// 这是一个通用函数，用于添加新词并保存到文件
function updateCacheAndSave(newWords) {
    // 1. 更新内存
    // 转小写作为键，防止大小写冲突 (Hello 和 hello 是同一个词)
  for (const [originalWord, translatedText] of Object.entries(newWords)) {
        // 统一转为小写作为缓存的 key（避免 Hello/HELLO/hello 被当成不同词）
        const cacheKey = originalWord.toLowerCase();
        translationCache[cacheKey] = translatedText;
    }

    // 2. 更新硬盘 (异步，不阻塞用户)
    saveCacheToFile();
}

// 将内存中的缓存写入硬盘文件
function saveCacheToFile() {
    try {
        // 将 JS 对象转成 JSON 字符串
        // null, 2 是为了让 JSON 文件格式好看一点（带缩进）
        const jsonContent = JSON.stringify(translationCache, null, 2);

        // 异步写入文件
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

// 主逻辑
async function main(article) {
    // 1. 切分文章
    const { words, symbols, startsWithWord } = splitIntoWordsAndSymbols(article);
    console.log('切分结果:', words, symbols, startsWithWord);
    // 2. 处理翻译（异步操作，需要await）
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

/**
 * 1. 切分函数：把文章拆成两个独立的数组
 */
function splitIntoWordsAndSymbols(article) {
    // 这里我们不使用正则的 split，而是用 match 来分别获取
    // 但是为了保持顺序，我们需要记录它们是怎么交错的
    // 更简单的方法：我们用正则扫描，手动归类

    const words = [];
    const symbols = [];

    let currentWord = '';
    let currentSymbol = '';

    // 把文章变成字符流，一个个看
    for (let i = 0; i < article.length; i++) {
        const char = article[i];

        // 判断是不是字母 (a-z, A-Z)
        if (/[a-zA-Z]/.test(char)) {
            // 如果是字母，加到当前单词里
            currentWord += char;
            // 如果之前有积累符号，说明符号断了，存进去
            if (currentSymbol) {
                symbols.push(currentSymbol);
                currentSymbol = '';
            }
        } else {
            // 如果不是字母，加到当前符号里
            currentSymbol += char;
            // 如果之前有积累单词，说明单词断了，存进去
            if (currentWord) {
                words.push(currentWord);
                currentWord = '';
            }
        }
    }

    // 循环结束后，检查最后有没有残留
    if (currentWord) words.push(currentWord);
    if (currentSymbol) symbols.push(currentSymbol);

    // 判断文章是以什么开头的（这决定了后面怎么拼）
    const startsWithWord = article.length > 0 && /[a-zA-Z]/.test(article[0]);

    return { words, symbols, startsWithWord };
}


// --- 2.核心：处理翻译 ---
async function processTranslation(wordsFromArticle) {
    const results = [];
    var notin_cache = [];
    for (const word of wordsFromArticle) {
        const key = word.toLowerCase();

        // 1. 先查内存
        if (!translationCache[key]&&notin_cache.indexOf(word) == -1) {

            console.log(`🔍 发现生词: ${word}, 先统一缓存`);
            notin_cache.push(word);
        }
    }
    if (notin_cache.length > 0) {
        // 2. 内存没有，去“问 AI”
        console.log(`🔍 缓存中的所有生词: ${notin_cache.join(', ')}, 正在调用 AI...`);
        const aiResult = await callRealAI(notin_cache); // 模拟 AI 返回

        // 3. 【关键步骤】动态更新：把 AI 的答案存下来
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
 * 3. 还原函数：把两个数组拼回去
 */
function assembleText({ words, symbols, startsWithWord, translatedWords }) {
    let result = '';
    let wordIndex = 0;
    let symbolIndex = 0;

    // 根据开头决定第一块拼什么
    if (startsWithWord) {
        // 如果原文以单词开头，顺序是：单词、符号、单词、符号...
        while (wordIndex < translatedWords.length) {
            // 拼单词
            result += translatedWords[wordIndex];
            wordIndex++;

            // 拼对应的符号（如果还有符号的话）
            if (symbolIndex < symbols.length) {
                result += symbols[symbolIndex];
                symbolIndex++;
            }
        }
    } else {
        // 如果原文以符号开头，顺序是：符号、单词、符号、单词...
        while (symbolIndex < symbols.length || wordIndex < translatedWords.length) {
            // 拼符号
            if (symbolIndex < symbols.length) {
                result += symbols[symbolIndex];
                symbolIndex++;
            }

            // 拼单词
            if (wordIndex < translatedWords.length) {
                result += translatedWords[wordIndex];
                wordIndex++;
            }
        }
    }

    return result;
}
// 模拟 AI 函数
function callFakeAI(word) {
    // 模拟耗时
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`【${word}的谐音】`);
        }, 500);
    });
}

// --- 启动服务器 ---

// 1. 先加载缓存
loadCacheFromFile();



// // 2. 模拟用户发来请求
// setTimeout(() => {
//     console.log('\n--- 用户请求开始 ---');
//     processTranslation(['Hello', 'World', 'Nodejs']).then(res => {
//         console.log('翻译结果:', res);
//     });
// }, 1000);

const app = express();
const PORT = process.env.PORT || 3000;

// 托管静态文件（如 public/index.html）
app.use(express.static(path.join(__dirname, 'public')));

// 使用 body-parser 解析 JSON 请求体
app.use(bodyParser.json());

// POST /api/main 接口：接收文章内容，返回翻译结果
app.post('/api/main', async (req, res) => {
    try {
        // 接收前端发送的消息
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: '请提供有效的文本内容'
            });
        }

        // 调用翻译处理函数（异步操作，需要await）
        const translationResult = await main(message);

        // 返回翻译结果
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

// 启动 HTTP 服务器
app.listen(PORT, () => {
    console.log(`🚀 翻译服务已启动，监听端口 ${PORT}`);
});


