const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'config.json');

// --- 配置管理 --- 

/**
 * 从配置文件加载配置
 * @returns {Object} 配置对象
 */
function loadConfig() {
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.log('❌ 未找到配置文件，将使用环境变量');
        return {};
    }
}

/**
 * 保存配置到文件
 * @param {Object} config - 配置对象
 */
function saveConfig(config) {
    try {
        const jsonContent = JSON.stringify(config, null, 2);
        fs.writeFileSync(CONFIG_FILE, jsonContent, 'utf8');
        console.log('✅ 配置已保存到文件');
    } catch (err) {
        console.error('❌ 保存配置失败:', err);
    }
}

// --- API密钥管理 --- 

// 先从配置文件加载配置
const config = loadConfig();

// 再从环境变量获取API密钥，如果存在则覆盖配置文件中的值
let API_KEY = config.apiKey;
const envAPIKey = process.env.API_KEY;

if (envAPIKey) {
    API_KEY = envAPIKey;
    // 保存到配置文件
    saveConfig({ ...config, apiKey: API_KEY });
}

// 模型名称
const MODEL_NAME = config.modelName || 'qwen-plus';

// 立即检查API密钥是否存在，如果不存在则退出进程
if (!API_KEY) {
    console.error('❌ API密钥不存在，请设置环境变量API_KEY');
    process.exit(1);
}

/**
 * 调用真实AI服务进行翻译
 * @param {Array<string>} words - 需要翻译的单词列表
 * @returns {Promise<Object>} - 翻译结果对象，键为单词，值为中文谐音
 */
async function callRealAI(words) {
    
    try {
        // 1. 拼接 Prompt
        const prompt = `
你是一个“神经谐音机”，任务是将任何英文单词（包括代码、缩写、无意义字母组合）都转换成搞笑/有趣的中文谐音。
规则：
1. 必须为每一个单词生成【非空】的中文谐音，禁止返回空字符串！
2. 键必须和输入的单词【完全一致】（包括大小写，如 "escapeHtml" 不能变成 "escapehtml"）。
3. 谐音可以夸张、无厘头，但发音要尽量接近。
4. 只返回纯 JSON 对象，不要任何其他文字、注释或 markdown。
5. 一些单词可以用拟声词,例如 "public" 可以用 "啪不里克"。
6. 在翻译后的单词里,不能出现中文,例如 "mayozhayu" 不能翻译成 "妈哟zhayu" 要翻译成 "麻油炸鱼"。

示例输入：["px", "div", "escapeHtml"]
示例输出：{"px": "屁克斯", "div": "弟五", "escapeHtml": "一死凯普嗨特妹儿"}

现在请处理以下单词：
${words.map(word => `"${word}": ""`).join(', ')}

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
        let resultObj;
        try {
            console.log('AI 返回原始文本:', aiText);
            resultObj = JSON.parse(aiText);  // 尝试解析 JSON
        } catch (parseError) {
            console.error('AI 返回格式错误，尝试修复...', aiText);
            // 这里可以写一些简单的字符串解析逻辑作为兜底
            // resultObj = simpleParseFallback(aiText, words);
        }

        return resultObj;

    } catch (error) {
        console.error('调用千问 API 失败:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * 模拟AI函数（用于测试）
 * @param {string} word - 需要翻译的单词
 * @returns {Promise<string>} - 模拟的翻译结果
 */
function callFakeAI(word) {
    // 模拟耗时
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`【${word}的谐音】`);
        }, 500);
    });
}

module.exports = {
    callRealAI,
    callFakeAI
};