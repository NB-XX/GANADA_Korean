#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析reading_kr.txt和reading_cn.txt文件，生成book1的reading.json文件
"""

import json
import os
import re
from pathlib import Path

def parse_reading_files():
    """
    解析reading_kr.txt和reading_cn.txt文件
    """
    project_root = Path(__file__).parent.parent
    
    # 读取韩语文件
    kr_file = project_root / "sample" / "reading_kr.txt"
    cn_file = project_root / "sample" / "reading_cn.txt"
    
    if not kr_file.exists() or not cn_file.exists():
        print("错误: 找不到reading_kr.txt或reading_cn.txt文件")
        return {}
    
    # 读取文件内容
    with open(kr_file, 'r', encoding='utf-8') as f:
        kr_content = f.read()
    
    with open(cn_file, 'r', encoding='utf-8') as f:
        cn_content = f.read()
    
    # 解析韩语文章
    kr_articles = parse_articles(kr_content)
    cn_articles = parse_articles(cn_content)
    
    # 合并文章
    articles = {}
    for lesson_num in kr_articles:
        if lesson_num in cn_articles:
            articles[lesson_num] = {
                'title': kr_articles[lesson_num]['title'],
                'content': kr_articles[lesson_num]['content'],
                'translation': cn_articles[lesson_num]['content']
            }
    
    return articles

def parse_articles(content):
    """
    解析文章内容，按课数分组
    """
    articles = {}
    lines = content.strip().split('\n')
    
    current_lesson = None
    current_title = None
    current_content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 检查是否是课数（数字）
        if re.match(r'^\d+$', line):
            # 保存之前的文章
            if current_lesson and current_title and current_content:
                articles[current_lesson] = {
                    'title': current_title,
                    'content': '\n'.join(current_content)
                }
            
            # 开始新文章
            current_lesson = int(line)
            current_title = None
            current_content = []
        elif current_title is None:
            # 第一行非空行是标题
            current_title = line
        else:
            # 其他行是内容
            current_content.append(line)
    
    # 保存最后一篇文章
    if current_lesson and current_title and current_content:
        articles[current_lesson] = {
            'title': current_title,
            'content': '\n'.join(current_content)
        }
    
    return articles

def generate_reading_json_files(articles):
    """
    生成reading.json文件
    """
    project_root = Path(__file__).parent.parent
    
    for lesson_num in range(4, 31):  # lesson4到lesson30
        if lesson_num in articles:
            article = articles[lesson_num]
            
            # 创建JSON结构
            json_data = {
                "passages": [
                    {
                        "title": article['title'],
                        "translated_title": "",  # 可以根据需要添加翻译标题
                        "content": article['content'],
                        "translation": article['translation']
                    }
                ]
            }
            
            # 创建目录
            lesson_dir = project_root / "resources" / "text" / "lessons" / "book1" / f"lesson{lesson_num}"
            lesson_dir.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            json_file = lesson_dir / "reading.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            print(f"生成: {json_file}")
            print(f"  标题: {article['title']}")
            print(f"  内容行数: {len(article['content'].split(chr(10)))}")
            print(f"  译文行数: {len(article['translation'].split(chr(10)))}")
            print()

def main():
    """
    主函数
    """
    print("开始解析reading文件...")
    
    # 解析文件
    articles = parse_reading_files()
    
    if not articles:
        print("没有找到有效的文章")
        return
    
    print(f"找到 {len(articles)} 篇文章")
    print()
    
    # 生成JSON文件
    print("开始生成reading.json文件...")
    generate_reading_json_files(articles)
    
    print("完成！")

if __name__ == "__main__":
    main() 