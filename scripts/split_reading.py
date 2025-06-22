import os
import json

KR_SRC = 'content/words/reading_kr.txt'
CN_SRC = 'content/words/reading_cn.txt'
DST_ROOT = 'resources/text/lessons/book2'

def parse_reading_file(filepath):
    lessons = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    current_lesson_num = None
    current_lines = []
    
    for line in content.splitlines():
        line = line.strip()
        if line.isdigit():
            if current_lesson_num and current_lines:
                title = current_lines[0]
                body = '\n'.join(current_lines[1:])
                lessons[current_lesson_num] = {'title': title, 'body': body}
            
            current_lesson_num = line
            current_lines = []
        elif line:
            current_lines.append(line)
    
    if current_lesson_num and current_lines:
        title = current_lines[0]
        body = '\n'.join(current_lines[1:])
        lessons[current_lesson_num] = {'title': title, 'body': body}

    return lessons

kr_lessons = parse_reading_file(KR_SRC)
cn_lessons = parse_reading_file(CN_SRC)

for lesson_num_str, kr_data in kr_lessons.items():
    if lesson_num_str in cn_lessons:
        cn_data = cn_lessons[lesson_num_str]
        
        output_data = {
            "passages": [
                {
                    "title": kr_data['title'],
                    "translated_title": cn_data['title'],
                    "content": kr_data['body'],
                    "translation": cn_data['body']
                }
            ]
        }
        
        out_dir = os.path.join(DST_ROOT, f'lesson{lesson_num_str}')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'reading.json')
        
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
            
        print(f'写入: {out_path}')

print('全部完成！') 