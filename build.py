#!/usr/bin/env python3
import os
import re
import sys

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def inline_file(content, placeholder, file_path):
    """Replace {{placeholder}} with the content of file_path."""
    if os.path.exists(file_path):
        file_content = read_file(file_path)
        return content.replace(placeholder, file_content)
    else:
        print(f"Warning: {file_path} not found", file=sys.stderr)
        return content

def build_index():
    template = read_file('src/index.src.html')
    # Inline CSS and JS
    template = inline_file(template, '{{THEME_CSS}}', 'css/themes.css')
    template = inline_file(template, '{{THEME_JS}}', 'js/themes.js')
    template = inline_file(template, '{{INDEX_JS}}', 'js/index.js')
    write_file('index.html', template)
    print("index.html built")

def build_reader():
    template = read_file('src/reader.src.html')
    template = inline_file(template, '{{THEME_CSS}}', 'css/themes.css')
    template = inline_file(template, '{{THEME_JS}}', 'js/themes.js')
    template = inline_file(template, '{{READER_JS}}', 'js/reader.js')
    # Also inline library scripts if you want (optional)
    # template = inline_file(template, '{{JSZIP}}', 'js/jszip.min.js')
    # template = inline_file(template, '{{EPUBJS}}', 'js/epub.min.js')
    write_file('reader.html', template)
    print("reader.html built")

if __name__ == '__main__':
    os.makedirs('src', exist_ok=True)
    build_index()
    build_reader()