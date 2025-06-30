import os
from pydub import AudioSegment

# 设置要遍历的根目录为当前目录
root_dir = os.getcwd()

# 遍历所有子目录和文件
for foldername, subfolders, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.lower().endswith(".wav"):
            wav_path = os.path.join(foldername, filename)
            mp3_path = os.path.join(foldername, os.path.splitext(filename)[0] + ".mp3")

            try:
                # 加载 wav 文件并导出为 mp3
                sound = AudioSegment.from_wav(wav_path)
                sound.export(mp3_path, format="mp3")
                print(f"✅ 转换成功: {wav_path} → {mp3_path}")

                # 删除原始 wav 文件
                os.remove(wav_path)
                print(f"🗑️ 已删除: {wav_path}")

            except Exception as e:
                print(f"❌ 转换失败: {wav_path}")
                print(f"错误信息: {e}")
