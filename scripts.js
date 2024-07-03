let metaTagDescriptions = {};
let metaTagDetails = {};
let metaTagNames = [];
let metaTagImportance = {};

fetch('meta-details.json')
    .then(response => response.json())
    .then(data => {
        const language = document.documentElement.lang || 'en';
        const metaTags = data[language];
        for (const tagName in metaTags) {
            if (metaTags.hasOwnProperty(tagName)) {
                metaTagDescriptions[tagName] = metaTags[tagName].description;
                metaTagDetails[tagName] = metaTags[tagName].detail;
                metaTagImportance[tagName] = metaTags[tagName].importance;
                metaTagNames.push(tagName);
            }
        }
        // Sort by importance
        metaTagNames.sort((a, b) => metaTagImportance[b] - metaTagImportance[a]);
    })
    .catch(error => {
        console.error('Error loading meta details:', error);
    });

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 防抖后的函数
const fetchMetaTags = debounce(async () => {
    let url = document.getElementById('url-input').value;
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    // 自动添加 'https://' 如果缺少协议部分
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    clearPreviousResults();
    showLoading(); // 显示加载状态
    document.getElementById('fetch-button').disabled = true; // 禁用按钮

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
        const response = await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        hideLoading(); // 隐藏加载状态
        document.getElementById('fetch-button').disabled = false; // 重新启用按钮

        if (response.ok) {
            const score = calculateScore(data);
            displayScore(score);
            displayMetaTags(data);
        } else {
            console.error('Invalid response format:', data);
            showModal('Failed to fetch meta tags', `Error: ${data.error}`);
        }
    } catch (error) {
        hideLoading(); // 隐藏加载状态
        document.getElementById('fetch-button').disabled = false; // 重新启用按钮

        if (error.name === 'AbortError') {
            showModal('Request timed out', 'The request took too long and was aborted.');
        } else {
            console.error('Error fetching meta tags:', error);
            showModal('Error fetching meta tags', error.message);
        }
    }
}, 300); // 300毫秒防抖时间

document.getElementById('url-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        fetchMetaTags();
    }
});

document.getElementById('fetch-button').addEventListener('click', fetchMetaTags);

function clearPreviousResults() {
    const resultsContainer = document.getElementById('meta-results');
    resultsContainer.innerHTML = '';

    const scoreContainer = document.getElementById('score-container');
    if (scoreContainer) {
        scoreContainer.remove();
    }

    hideLoading(); // 确保加载状态隐藏
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function copyToClipboard(text) {
    const tempInput = document.createElement("input");
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    showToast(`Content copied to clipboard: ${text}`);
}

function calculateScore(metaTags) {
    let score = 0;

    const tagScores = {
        // Basic tags
        'description': 20,
        'keywords': 5,
        'viewport': 5,
        // Open Graph tags
        'og:title': 10,
        'og:description': 10,
        'og:image': 10,
        'og:url': 10,
        // Twitter card tags
        'twitter:card': 4,
        'twitter:title': 8,
        'twitter:description': 8,
        // Other important tags
        'canonical': 1,
        'robots': 1,
        'theme-color': 1,
        'author': 1,
        'charset': 1
    };

    metaTags.forEach(tag => {
        if (tagScores[tag.name]) {
            score += tagScores[tag.name];
        }
    });

    // Additional tag scores, each 1-2 points, up to 5 points
    const additionalTags = metaTags.filter(tag => !tagScores[tag.name]);
    score += Math.min(additionalTags.length * 2, 5);

    return score;
}

function displayScore(score) {
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score-container';
    scoreContainer.className = 'bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4';
    scoreContainer.innerHTML = `
        <strong class="font-bold">SEO Score: </strong>
        <span class="block sm:inline">${score} / 100</span>
    `;
    const resultsContainer = document.getElementById('result');
    resultsContainer.parentNode.insertBefore(scoreContainer, resultsContainer);
}

function displayMetaTags(metaTags) {
    const resultsContainer = document.getElementById('meta-results');
    resultsContainer.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-300';
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    thead.innerHTML = `
        <tr>
            <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">#</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Content</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Importance</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Detail</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'divide-y divide-gray-200 bg-white';
    metaTagNames.forEach((tagName, index) => {
        const tag = metaTags.find(t => t.name === tagName);
        const content = tag ? tag.content : '-';
        const description = metaTagDescriptions[tagName];
        const detail = escapeHtml(metaTagDetails[tagName]);
        const metaContent = metaTagDetails[tagName].replace(/^例如：/, ''); // 去掉“例如：”
        const importance = metaTagImportance[tagName];
        const stars = '★'.repeat(importance) + '☆'.repeat(5 - importance);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="whitespace-normal py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">${index + 1}</td>
            <td class="whitespace-normal px-3 py-4 text-sm text-gray-500 max-width-200">${tagName}</td>
            <td class="whitespace-normal px-3 py-4 text-sm text-gray-500">${content}</td>
            <td class="whitespace-normal px-3 py-4 text-sm text-gray-500 max-width-200">${stars}</td>
            <td class="whitespace-normal px-3 py-4 text-sm text-gray-500 max-width-200 min-width-300">${description}</td>
            <td class="whitespace-normal px-3 py-4 text-sm text-gray-500 tooltip" onclick="copyToClipboard('${escapeHtml(metaContent).replace(/'/g, "\\'")}')">
                <span class="tooltiptext">${detail}</span>
                <svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 8h.01M21 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"></path></svg>
            </td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    resultsContainer.appendChild(table);
}
    
    function showModal(title, message) {
        const modal = document.getElementById('error-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
    
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
    }
    
    function closeModal() {
        const modal = document.getElementById('error-modal');
        modal.classList.add('hidden');
    }
    
    

    