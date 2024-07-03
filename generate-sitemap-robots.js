const fs = require('fs');
const path = require('path');

// Define the base URL of your website
const BASE_URL = 'https://www.metatagchecker.com';

// Define the directories to scan for HTML files
const DIRECTORIES = ['.'];  // Root directory, you can add more directories if needed

// Function to scan directories and collect HTML files
function scanDirectories(directories) {
  let htmlFiles = [];
  directories.forEach(directory => {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        htmlFiles = htmlFiles.concat(scanDirectories([filePath]));
      } else if (file.endsWith('.html')) {
        htmlFiles.push(filePath);
      }
    });
  });
  return htmlFiles;
}

// Function to generate robots.txt
function generateRobotsTxt() {
  const content = `
User-agent: *
Disallow: /api/
Disallow: /node_modules/

Sitemap: ${BASE_URL}/sitemap.xml
  `;
  fs.writeFileSync(path.join(__dirname, 'robots.txt'), content.trim());
}

// Function to generate sitemap.xml
function generateSitemapXml(htmlFiles) {
  const urls = htmlFiles.map(file => {
    const loc = `${BASE_URL}/${path.relative(__dirname, file).replace(/\\/g, '/')}`;
    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>${file.includes('index.html') ? '1.00' : '0.80'}</priority>
  </url>`;
  }).join('\n');
  
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
  
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), content.trim());
}

// Main function to generate both files
function generateFiles() {
  const htmlFiles = scanDirectories(DIRECTORIES);
  generateRobotsTxt();
  generateSitemapXml(htmlFiles);
  console.log('robots.txt and sitemap.xml have been generated successfully.');
}

generateFiles();