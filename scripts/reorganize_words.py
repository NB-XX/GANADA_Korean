#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

def reorganize_words():
    """重新组织单词文件，按课程编号分组"""
    
    # 获取项目根目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # 文件路径
    input_file = os.path.join(project_root, 'content', 'words.txt')
    output_file = os.path.join(project_root, 'content', 'words_reorganized.txt')
    
    # 存储课程和单词的字典
    course_words = {}
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if ':' in line:
                    word, course = line.split(':', 1)
                    course = int(course)
                    
                    if course not in course_words:
                        course_words[course] = []
                    course_words[course].append(word)
        
        # 按课程编号排序并写入新文件
        with open(output_file, 'w', encoding='utf-8') as f:
            for course in sorted(course_words.keys()):
                f.write(f"{course}\n")
                for word in course_words[course]:
                    f.write(f"{word}\n")
                f.write("\n")  # 课程间用空行分隔
        
        print(f"成功重新组织单词文件！")
        print(f"输入文件: {input_file}")
        print(f"输出文件: {output_file}")
        print(f"共处理了 {len(course_words)} 个课程")
        
        # 显示统计信息
        for course in sorted(course_words.keys()):
            print(f"课程 {course}: {len(course_words[course])} 个单词")
            
    except FileNotFoundError:
        print(f"错误：找不到文件 {input_file}")
    except Exception as e:
        print(f"处理文件时出错：{e}")

if __name__ == "__main__":
    reorganize_words() 