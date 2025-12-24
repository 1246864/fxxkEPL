const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// API
app.get('/api/main', (req, res) => {
    res.json({
        message: '欢迎使用API模板！',
        timestamp: new Date().toISOString(),
        data: {
            user: 'Guest',
            version: '1.0.0',
            features: ['API调用', '异步请求', '欢迎页面']
        }
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API端点: http://localhost:${PORT}/api/main`);
});
