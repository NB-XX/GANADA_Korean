import os
import re

SRC = 'content/words.json'
DST_DIR = 'resources/text/lessons/book2'

# 提取words数组内容
def extract_words_block(text):
    match = re.search(r'"words"\s*:\s*\[(.*?)]', text, re.DOTALL)
    if match:
        return match.group(0)  # "words": [ ... ]
    return None

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        content = f.read()

    # 按lesson分块
    blocks = re.split(r'lesson\s+(\d+)', content)
    # re.split会产生: ['', '1', '...block1...', '2', '...block2...', ...]
    lesson_blocks = zip(blocks[1::2], blocks[2::2])

    for lesson, block in lesson_blocks:
        words_block = extract_words_block(block)
        if not words_block:
            print(f'lesson {lesson} 未找到words数组，跳过')
            continue
        # 包裹为{"words": [...]}结构
        out_data = '{' + f'\n  {words_block}\n' + '}'
        out_dir = os.path.join(DST_DIR, f'lesson{lesson}')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'words.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(out_data)
        # 统计单词数
        word_count = len(re.findall(r'\{\s*"korean"', words_block))
        print(f'lesson {lesson} 写入 {out_path}，约 {word_count} 个单词')

if __name__ == '__main__':
    main() 