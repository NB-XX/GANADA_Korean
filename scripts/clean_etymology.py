#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理words.json文件中的etymology字段
清空只包含韩语字符的etymology，保留包含汉字或英文的etymology
"""

import json
import os
import re
from pathlib import Path

def is_only_korean(text):
    """
    检查文本是否只包含韩语字符和空格
    """
    if not text or text.strip() == "":
        return True
    
    # 韩语字符范围：\uAC00-\uD7AF (韩文音节)
    korean_pattern = r'^[\uAC00-\uD7AF\s]+$'
    
    # 如果只包含韩语字符和空格，返回True
    if re.match(korean_pattern, text):
        return True
    
    return False

def has_chinese_or_english(text):
    """
    检查文本是否包含汉字或英文
    """
    if not text:
        return False
    
    # 汉字范围：\u4E00-\u9FFF (CJK统一汉字)
    chinese_pattern = r'[\u4E00-\u9FFF]'
    
    # 英文检测
    english_pattern = r'[A-Za-z]'
    
    # 检查是否包含汉字或英文
    if re.search(chinese_pattern, text) or re.search(english_pattern, text):
        return True
    
    return False

def should_clear_etymology(etymology):
    """
    判断是否应该清空etymology字段
    """
    if not etymology or etymology.strip() == "":
        return False  # 已经是空的，不需要清空
    
    # 如果只包含韩语字符，应该清空
    if is_only_korean(etymology):
        return True
    
    # 如果包含汉字或英文，应该保留
    if has_chinese_or_english(etymology):
        return False
    
    # 其他情况（如标点符号等），也清空
    return True

def process_words_file(file_path):
    """
    处理单个words.json文件
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'words' not in data:
            print(f"警告: {file_path} 中没有找到words字段")
            return 0
        
        cleared_count = 0
        for word in data['words']:
            if 'etymology' in word:
                original_etymology = word['etymology']
                if should_clear_etymology(original_etymology):
                    word['etymology'] = ""
                    cleared_count += 1
                    print(f"  清空: '{original_etymology}' -> ''")
        
        if cleared_count > 0:
            # 写回文件
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  已清空 {cleared_count} 个etymology字段")
        
        return cleared_count
    
    except Exception as e:
        print(f"错误处理文件 {file_path}: {e}")
        return 0

def main():
    """
    主函数：遍历所有words.json文件
    """
    # 获取项目根目录
    project_root = Path(__file__).parent.parent
    lessons_dir = project_root / "resources" / "text" / "lessons"
    
    if not lessons_dir.exists():
        print(f"错误: 找不到目录 {lessons_dir}")
        return
    
    print("开始清理etymology字段...")
    print(f"搜索目录: {lessons_dir}")
    
    total_files = 0
    total_cleared = 0
    
    # 遍历所有words.json文件
    for words_file in lessons_dir.rglob("words.json"):
        total_files += 1
        relative_path = words_file.relative_to(project_root)
        print(f"\n处理文件: {relative_path}")
        
        cleared_count = process_words_file(words_file)
        total_cleared += cleared_count
    
    print(f"\n处理完成!")
    print(f"总共处理了 {total_files} 个文件")
    print(f"总共清空了 {total_cleared} 个etymology字段")

if __name__ == "__main__":
    main() 