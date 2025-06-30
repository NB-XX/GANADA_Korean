#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 sample/grammar.json 中解析并分割语法点到各课的 grammar.json 文件。
根据 title 前的数字序号分割，序号为 1 标志着新一课的开始。
"""

import json
import re
from pathlib import Path

def save_grammar_file(lesson_num, points_list, project_root):
    """将指定课程的语法点保存到 JSON 文件中。"""
    if not points_list:
        return

    # 创建目录结构
    lesson_dir = project_root / "resources" / "text" / "lessons" / "book1" / f"lesson{lesson_num}"
    lesson_dir.mkdir(parents=True, exist_ok=True)

    # 准备 JSON 数据结构
    json_data = {"points": points_list}

    # 写入文件
    json_file = lesson_dir / "grammar.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"已生成: {json_file}")
    print(f"  语法点数量: {len(points_list)}")
    print()


def main():
    """
    解析 sample/grammar.json 并将其分割为单独的课程文件。
    """
    print("开始解析 sample/grammar.json...")
    project_root = Path(__file__).parent.parent
    source_file = project_root / "sample" / "grammar.json"

    if not source_file.exists():
        print(f"错误: 源文件未找到于 {source_file}")
        return

    with open(source_file, 'r', encoding='utf-8') as f:
        all_grammar_points = json.load(f)

    current_lesson_num = 4  # 课程从第4课开始
    current_lesson_points = []

    for point in all_grammar_points:
        title = point.get('title', '')
        # 使用正则表达式从标题中提取前导数字
        match = re.match(r'^\s*(\d+)\s*(.*)$', title)

        if match:
            grammar_index = int(match.group(1))
            # 清理标题，移除可能存在的前导 '-'
            cleaned_title = match.group(2).strip()
            if cleaned_title.startswith('-'):
                cleaned_title = cleaned_title[1:].strip()

            # 如果是新课的开始（并且不是第一个语法点）
            if grammar_index == 1 and current_lesson_points:
                # 保存上一课的数据
                save_grammar_file(current_lesson_num, current_lesson_points, project_root)
                # 开始新的一课
                current_lesson_num += 1
                current_lesson_points = []
            
            # 使用清理后的标题更新语法点
            point['title'] = cleaned_title
            current_lesson_points.append(point)
        else:
            print(f"警告: 无法从标题解析序号: '{title}'。已跳过。")
            continue
    
    # 循环结束后保存最后一课的数据
    if current_lesson_points:
        save_grammar_file(current_lesson_num, current_lesson_points, project_root)

    print("语法JSON文件生成完成！")


if __name__ == "__main__":
    main() 