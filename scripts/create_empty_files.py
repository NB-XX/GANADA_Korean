import os

in_dir = 'content/dialogue'
os.makedirs(in_dir, exist_ok=True)

created = []
for i in range(1, 31):
    kr_file = os.path.join(in_dir, f'{i}_kr.txt')
    cn_file = os.path.join(in_dir, f'{i}_cn.txt')
    if not os.path.exists(kr_file):
        with open(kr_file, 'w', encoding='utf-8') as f:
            pass
        created.append(kr_file)
    if not os.path.exists(cn_file):
        with open(cn_file, 'w', encoding='utf-8') as f:
            pass
        created.append(cn_file)

print('=== 已创建空文件 ===')
for f in created:
    print(f) 