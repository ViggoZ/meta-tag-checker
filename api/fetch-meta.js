const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();

app.get('/api/fetch-meta', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await axios.get(url);
        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        // 获取 meta 标签
        const metaTags = [...document.querySelectorAll('meta')].map(tag => ({
            name: tag.getAttribute('name') || tag.getAttribute('property') || tag.getAttribute('http-equiv'),
            content: tag.getAttribute('content')
        })).filter(tag => tag.name && tag.content);

        res.json(metaTags);
    } catch (error) {
        console.error('Error fetching meta tags:', error);
        res.status(500).json({ error: 'Error fetching meta tags' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});