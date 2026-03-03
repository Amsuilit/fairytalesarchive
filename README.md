# Book Archive

A digital library archive for classic public domain literature. This open source project provides a searchable, filterable interface with built-in EPUB reading capabilities.

## 📚 Project Overview

This is a static website that displays a collection of books and classic literature in EPUB and PDF formats. The site features:

- **Searchable catalog** by title, author, and publication year
- **Built-in EPUB reader** for reading books directly in the browser
- **Download mode** for bulk downloading books
- **Multiple themes** (light/dark modes)
- **Customizable fonts** for comfortable reading
- **Automated book processing** via GitHub Actions

## 🚀 Quick Start

### For Contributors: Adding New Books

There are two ways to add books to the archive:

#### Method 1: Add RTF Files (Recommended - Automated)

1. Export your book as a **Rich Text Format (.rtf)**
2. Name the file with metadata tags:
   ```
   Title=[Your Title] Author=[Author Name] Year=[YYYY].rtf
   ```
   Example: `Title=[The Three Little Pigs] Author=[Joseph Jacobs] Year=[1890].rtf`

3. Upload the RTF file to the `/books` folder
4. Commit and push to the changes.
5. The automated workflow will:
   - Convert RTF → EPUB
   - Add a custom front page
   - Strip existing metadata
   - Update the catalog automatically

#### Method 2: Add EPUB/PDF Files Directly (Manual)

1. Add your `.epub` or `.pdf` files to the `/books` folder
2. Manually edit `data.js` to add the book entry:
   ```javascript
   {"t": "Book Title", "a": "Author Name", "y": "Year", "base": "filename-without-extension", "epub": true, "rtf": false}
   ```
3. Commit and push

## 📁 Repository Structure

```
fairytalesarchive/
├── .github/
│   └── workflows/
│       └── update_library.yml    # Automated book processing workflow
├── books/                        # All book files (EPUB, PDF, RTF)
│   ├── Instructions.txt          # Naming format example
│   └── [book files]
├── css/
│   └── themes.css                # Theme definitions
├── js/
│   ├── epub.min.js               # EPUB.js library
│   ├── index.js                  # Main library interface
│   ├── jszip.min.js              # ZIP handling for EPUBs
│   ├── reader.js                 # EPUB reader logic
│   └── themes.js                 # Theme switching logic
├── data.js                       # Book catalog (auto-generated)
├── index.html                    # Main library page
├── reader.html                   # EPUB reader page
├── sw.js                         # Service worker (PWA support)
└── README.md                     # This file
```

## 🛠️ Editing Guide

### Editing the Website Interface

#### Changing the Site Title
Edit `index.html`, line 6 and line 99:
```html
<title>Your Archive Name</title>
...
<h1>Your Archive Name</h1>
```

#### Modifying Themes
Edit `css/themes.css` to add new color schemes or modify existing ones. Each theme defines:
- `--bg`: Background color
- `--text`: Text color
- `--border`: Border color
- `--accent`: Accent color
- `--hover-bg`: Hover background
- `--hover-text`: Hover text

Example:
```css
.theme-custom {
    --bg: #f5f5f5;
    --text: #333;
    --border: #999;
    --accent: #ccc;
    --hover-bg: #333;
    --hover-text: #fff;
}
```

Then add it to the theme dropdown in `js/themes.js`:
```javascript
{name: "Custom Theme", class: "theme-custom"}
```

#### Adding New Fonts
Edit `index.html` around line 110-119 to add font options:
```html
<option value="'Your Font', fallback">Font Name</option>
```

#### Modifying Search/Filter Behavior
The search and filter logic is in `index.html` (lines 312-363 in the `render()` function). This controls:
- Title/author filtering
- Year range filtering
- Alphabetical dividers
- Table rendering

### Editing the EPUB Reader

The reader is in `reader.html` and `js/reader.js`. You can customize:
- **Reader themes**: Edit the `readerThemes` object in `reader.js`
- **Navigation controls**: Modify the button handlers in `reader.js`
- **Font options**: Edit the font dropdown in `reader.html`
- **Layout**: Modify CSS in `reader.html`

### Managing the Book Database

The `data.js` file contains the book catalog. Each entry has:
```javascript
{
  "t": "Title",           // Book title
  "a": "Author",          // Author name(s)
  "y": "Year",            // Publication year
  "base": "filename",     // Base filename (without extension)
  "epub": true,           // Has EPUB version?
  "rtf": false            // Has RTF version?
}
```

**Note**: If you're using the automated workflow, `data.js` is auto-generated. Don't edit it manually unless you're adding books without RTF files.

## 🤖 Automated Workflow

The GitHub Actions workflow (`.github/workflows/update_library.yml`) automatically:

1. **Watches** the `/books` folder for changes
2. **Detects** RTF files with metadata tags in the filename
3. **Converts** RTF → EPUB using Calibre
4. **Injects** a custom front page with title/author/year
5. **Strips** all embedded metadata to prevent conflicts
6. **Updates** `data.js` with the new book entry
7. **Commits** changes back to the original folder location

### Metadata Extraction

The workflow extracts metadata from filenames:
```
Title=[The Story Title] Author=[Author Name] Year=[0000].rtf
```

Tags:
- `Title=[...]` - Book title
- `Author=[...]` - Author name(s)
- `Year=[...]` - Publication year

If tags are missing, it tries to match existing entries in `data.js` or generates a title from the filename.

### Converting Existing PDFs to EPUB

If you have PDFs and want EPUB versions:
1. Install Calibre: `sudo apt-get install calibre`
2. Run: `ebook-convert input.pdf output.epub`
3. Upload the EPUB to `/books`
4. Update `data.js`

## 🌐 Deployment

### GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Set **Source** to: Deploy from a branch
3. Select **branch**: `main` and **folder**: `/ (root)`
4. Save
5. Your site will be live at `https://yourusername.github.io/repository-name`

### Custom Domain

1. Add a `CNAME` file to the root with your domain:
   ```
   archive.yourdomain.com
   ```
2. Configure DNS:
   - For apex domain (`yourdomain.com`): Add A records to GitHub Pages IPs
   - For subdomain (`archive.yourdomain.com`): Add CNAME to `yourusername.github.io`
3. In Settings → Pages, add your custom domain

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fairytalesarchive.git
   cd fairytalesarchive
   ```

2. Serve locally (Python):
   ```bash
   python3 -m http.server 8000
   ```
   Or (Node.js):
   ```bash
   npx serve
   ```

3. Open `http://localhost:8000` in your browser

## 🎨 Customization Ideas

### Add a Logo
Add an image and modify `index.html`:
```html
<div class="header-top">
    <img src="logo.png" alt="Logo" style="height: 50px;">
    <h1>Digital Library Archive</h1>
</div>
```

### Add Book Covers
1. Store cover images in `/books/covers/`
2. Modify `data.js` to include cover paths:
   ```javascript
   {"t": "Title", ..., "cover": "covers/book-cover.jpg"}
   ```
3. Update the table rendering in `index.html` to display covers

### Add Categories/Tags
1. Add a `category` field to book entries in `data.js`
2. Add a category filter dropdown in `index.html`
3. Update the `render()` function to filter by category

### Statistics Dashboard
Add a stats section showing:
- Total books
- Books by century
- Authors with most books
- Most recent additions

Example:
```javascript
const stats = archiveData.reduce((acc, book) => {
    const century = Math.floor(parseInt(book.y) / 100) * 100;
    acc[century] = (acc[century] || 0) + 1;
    return acc;
}, {});
```


**Happy archiving! 📖**

