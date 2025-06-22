import os
import json

SRC = 'content/grammar.json'
DST_ROOT = 'resources/text/lessons/book2'

with open(SRC, encoding='utf-8') as f:
    raw = f.read().strip()

# 统一换行符
raw = raw.replace('\r\n', '\n').replace('\r', '\n')

# 按两个换行分割为30课
parts = [p.strip() for p in raw.split('\n\n') if p.strip()]

if len(parts) != 30:
    print(f'分割后不是30份，而是{len(parts)}份，请检查原始文件格式！')
    exit(1)

for idx, part in enumerate(parts, 1):
    # 每课可能有多个字典对象，用逗号分隔，需组装成数组
    # 先去掉首尾逗号
    part = part.strip(',\n ')
    # 用逗号分割每个对象
    # 但不能简单split，需用json语法包裹
    # 方案：在每课前后加[]，然后用json.loads解析
    json_str = f'[{part}]'
    try:
        points = json.loads(json_str)
    except Exception as e:
        print(f'第{idx}课 JSON解析失败:', e)
        print('出错内容:', json_str[:200])
        exit(1)
    out_dir = os.path.join(DST_ROOT, f'lesson{idx}')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'grammar.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({"points": points}, f, ensure_ascii=False, indent=2)
    print(f'写入: {out_path}')
print('全部完成！') 