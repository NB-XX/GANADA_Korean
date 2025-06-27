import os
import json
import re

ROOT = 'resources/text/lessons/book2'

def process_words_json(path, lesson_num):
    with open(path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f'{path} 解析失败: {e}')
            return
    if not isinstance(data, dict) or 'words' not in data or not isinstance(data['words'], list):
        print(f'{path} 结构异常，跳过')
        return
    changed = False
    for idx, word in enumerate(data['words'], 1):
        if isinstance(word, dict):
            new_audio = f'resources/audio/lessons/book2/lesson{lesson_num}/words/{idx}.mp3'
            if word.get('audio') != new_audio:
                word['audio'] = new_audio
                changed = True
    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'{path} audio路径已批量修正')
    else:
        print(f'{path} 无需修改')

def main():
    for root, dirs, files in os.walk(ROOT):
        for file in files:
            if file == 'words.json':
                # 提取lesson号
                m = re.search(r'lesson(\d+)', root)
                if m:
                    lesson_num = m.group(1)
                    process_words_json(os.path.join(root, file), lesson_num)

if __name__ == '__main__':
    main() 