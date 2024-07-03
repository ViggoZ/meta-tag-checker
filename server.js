const express = require('express');
const path = require('path');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

// 提供静态文件
app.use(express.static(path.join(__dirname)));

// 提供 meta-details.json 文件
app.get('/meta-details.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'meta-details.json'));
});

// API 路由
app.get('/api/fetch-meta', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            },
            timeout: 5000 // 设置请求超时时间为5秒
        });
        const dom = new JSDOM(response.data);
        const metaTags = [...dom.window.document.getElementsByTagName('meta')];

        const metaTagData = metaTags.map(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property') || tag.getAttribute('http-equiv');
            const content = tag.getAttribute('content');
            return { name, content };
        });

        res.json(metaTagData);
    } catch (error) {
        console.error('Error fetching meta tags:', error.message);
        res.status(500).json({ error: 'Error fetching meta tags', details: error.message });
    }
});

// 将所有其他请求重定向到 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});