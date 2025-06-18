import os
import json

# 输入目录
in_dir = 'content/dialogue'
# 输出目录前缀
out_dir_prefix = 'resources/text/lessons/book1'
# audio路径前缀
audio_prefix_base = 'resources/audio/lessons/book1'

kr_files = [f for f in os.listdir(in_dir) if f.endswith('_kr.txt')]

success = []
skipped = []

for kr_file in kr_files:
    lesson_num = kr_file.split('_')[0]
    cn_file = f'{lesson_num}_cn.txt'
    kr_path = os.path.join(in_dir, kr_file)
    cn_path = os.path.join(in_dir, cn_file)
    if not os.path.exists(cn_path):
        skipped.append(f'lesson{lesson_num}: 缺少 {cn_file}')
        continue
    # 读取内容
    with open(kr_path, encoding='utf-8') as f:
        kr_lines = [line.strip() for line in f if line.strip()]
    with open(cn_path, encoding='utf-8') as f:
        cn_lines = [line.strip() for line in f if line.strip()]
    if len(kr_lines) != len(cn_lines):
        skipped.append(f'lesson{lesson_num}: 行数不一致')
        continue
    sentences = []
    last_speaker = ''
    audio_prefix = f'{audio_prefix_base}/lesson{lesson_num}/dialogue/'
    for idx, (kr, cn) in enumerate(zip(kr_lines, cn_lines), 1):
        # 解析speaker
        if ':' in kr:
            speaker, korean = kr.split(':', 1)
            speaker = speaker.strip()
            korean = korean.strip()
            last_speaker = speaker
        else:
            speaker = last_speaker
            korean = kr.strip()
        # 处理中文译文，去除冒号及前缀
        if ':' in cn:
            chinese = cn.split(':', 1)[1].strip()
        else:
            chinese = cn.strip()
        audio = f"{audio_prefix}{idx}.mp3"
        sentences.append({
            'speaker': speaker,
            'korean': korean,
            'chinese': chinese,
            'audio': audio
        })
    out_dir = os.path.join(out_dir_prefix, f'lesson{lesson_num}')
    os.makedirs(out_dir, exist_ok=True)
    out_json = os.path.join(out_dir, 'dialogue.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({'sentences': sentences}, f, ensure_ascii=False, indent=2)
    success.append(f'lesson{lesson_num}: 转换成功')

print('=== 转换结果 ===')
for s in success:
    print(s)
for s in skipped:
    print('跳过:', s) 