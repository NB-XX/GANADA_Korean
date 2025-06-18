import os
import shutil

# 设置原始目录和目标根目录
src_root = '/Users/nbxx/Desktop/分句'  # 你当前的路径
dst_root = '/Users/nbxx/Desktop/新结构'  # 输出路径，避免覆盖原始内容

# 确保目标根目录存在
os.makedirs(dst_root, exist_ok=True)

# 遍历原始目录中的文件夹
for folder in os.listdir(src_root):
    folder_path = os.path.join(src_root, folder)
    if os.path.isdir(folder_path) and folder.isdigit():
        lesson_name = f'lesson{folder}'
        dst_lesson_path = os.path.join(dst_root, lesson_name, 'dialogue')
        os.makedirs(dst_lesson_path, exist_ok=True)

        for file in os.listdir(folder_path):
            if file.endswith('.mp3'):
                src_file = os.path.join(folder_path, file)
                dst_file = os.path.join(dst_lesson_path, file)
                shutil.copy2(src_file, dst_file)

print('转换完成 ✅')
