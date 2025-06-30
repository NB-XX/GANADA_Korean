#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析dialogue_kr.txt和dialogue_cn.txt文件，生成book1的dialogue.json文件
"""

import json
import os
import re
from pathlib import Path

def parse_dialogue_files():
    """
    解析dialogue_kr.txt和dialogue_cn.txt文件
    """
    project_root = Path(__file__).parent.parent
    
    # 读取韩语文件
    kr_file = project_root / "sample" / "dialogue_kr.txt"
    cn_file = project_root / "sample" / "dialogue_cn.txt"
    
    if not kr_file.exists() or not cn_file.exists():
        print("错误: 找不到dialogue_kr.txt或dialogue_cn.txt文件")
        return {}
    
    # 读取文件内容
    with open(kr_file, 'r', encoding='utf-8') as f:
        kr_content = f.read()
    
    with open(cn_file, 'r', encoding='utf-8') as f:
        cn_content = f.read()
    
    # 解析韩语对话
    kr_dialogues = parse_dialogues(kr_content)
    cn_dialogues = parse_dialogues(cn_content)
    
    # 合并对话
    dialogues = {}
    for lesson_num in kr_dialogues:
        if lesson_num in cn_dialogues:
            dialogues[lesson_num] = {
                'korean': kr_dialogues[lesson_num],
                'chinese': cn_dialogues[lesson_num]
            }
    
    return dialogues

def parse_dialogues(content):
    """
    解析对话内容，按空行分割
    """
    dialogues = {}
    
    # 按空行分割对话
    dialogue_blocks = re.split(r'\n\s*\n', content.strip())
    
    lesson_num = 4  # 从第4课开始
    
    for block in dialogue_blocks:
        if not block.strip():
            continue
            
        # 解析对话中的句子
        sentences = []
        lines = block.strip().split('\n')
        last_speaker = None
        for idx, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            match = re.match(r'^([^:]+):(.+)$', line)
            if match:
                speaker = match.group(1).strip()
                content = match.group(2).strip()
                last_speaker = speaker
                sentences.append({
                    'speaker': speaker,
                    'content': content
                })
            else:
                # 无说话人前缀，继承上一说话人
                if last_speaker is not None:
                    sentences.append({
                        'speaker': last_speaker,
                        'content': line
                    })
                else:
                    # 首行无说话人，跳过或警告
                    print(f"警告: 第{lesson_num}课对话块首行无说话人，内容被跳过: {line}")
        
        if sentences:
            dialogues[lesson_num] = sentences
            lesson_num += 1
    
    return dialogues

def generate_dialogue_json_files(dialogues):
    """
    生成dialogue.json文件
    """
    project_root = Path(__file__).parent.parent
    
    for lesson_num in range(4, 31):  # lesson4到lesson30
        if lesson_num in dialogues:
            dialogue = dialogues[lesson_num]
            
            # 创建JSON结构
            sentences = []
            for i, sentence in enumerate(dialogue['korean']):
                # 查找对应的中文翻译
                chinese_content = ""
                if i < len(dialogue['chinese']):
                    chinese_content = dialogue['chinese'][i]['content']
                
                sentences.append({
                    "speaker": sentence['speaker'],
                    "korean": sentence['content'],
                    "chinese": chinese_content,
                    "audio": f"resources/audio/lessons/book1/lesson{lesson_num}/dialogue/{i+1}.mp3"
                })
            
            json_data = {
                "sentences": sentences
            }
            
            # 创建目录
            lesson_dir = project_root / "resources" / "text" / "lessons" / "book1" / f"lesson{lesson_num}"
            lesson_dir.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            json_file = lesson_dir / "dialogue.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            print(f"生成: {json_file}")
            print(f"  对话数量: {len(sentences)}")
            print(f"  说话者: {', '.join(set(s['speaker'] for s in sentences))}")
            print()

def main():
    """
    主函数
    """
    print("开始解析dialogue文件...")
    
    # 解析文件
    dialogues = parse_dialogue_files()
    
    if not dialogues:
        print("没有找到有效的对话")
        return
    
    print(f"找到 {len(dialogues)} 个对话")
    print()
    
    # 生成JSON文件
    print("开始生成dialogue.json文件...")
    generate_dialogue_json_files(dialogues)
    
    print("完成！")

if __name__ == "__main__":
    main() 