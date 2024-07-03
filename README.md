Run
```node server.js```

```http://localhost:3000/```

Deploy to Vercel
```vercel login```
```vercel```

Update to Vercel
```vercel --prod```

Push to Github
```
git branch -M main
git push -u origin main
```

Update to Github
```
git add .
git commit -m "Update"
git push origin main
```

Generate robots.txt and sitemap.xml files and place them in the root directory of the project.
```node generate-sitemap-robots.js```