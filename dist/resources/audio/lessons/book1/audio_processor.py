
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
音频文件处理工具 - 四合一版本
功能：
1. 删除提示音并筛选文件 (cult.py)
2. 重新排序和分组文件 (re_sort.py)
3. 转换WAV为MP3并去除静音 (tomp3.py)
4. 移动MP3到目标目录 (correct_move_mp3.py)
"""

import os
import re
import shutil
import logging
import subprocess
from datetime import datetime
from pydub import AudioSegment
from pydub.silence import detect_nonsilent


class AudioProcessor:
    def __init__(self, source_dir=".", log_level=logging.INFO):
        self.source_dir = source_dir
        self.setup_logging(log_level)
        
        # 配置参数
        self.min_silence_len = 500    # 静音最小长度（ms）
        self.silence_thresh = -40     # 静音判定阈值（dBFS）
        self.book2_root = "/Users/nbxx/Documents/GitHub/GANADA_Korean/resources/audio/lessons/book2"

        # 音频切割参数（可通过set_split_params方法修改）
        self.split_min_silence_len = 1000  # 切割时的静音最小长度（ms）
        self.split_silence_thresh = -50    # 切割时的静音判定阈值（dBFS）
        
        # 统计信息
        self.stats = {
            'deleted_files': 0,
            'kept_files': 0,
            'moved_files': 0,
            'renamed_files': 0,
            'converted_files': 0,
            'copied_files': 0
        }

    def setup_logging(self, log_level):
        """设置日志系统"""
        # 创建log目录
        log_dir = os.path.join(self.source_dir, "log")
        os.makedirs(log_dir, exist_ok=True)
        
        # 生成日志文件名
        timestamp = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
        log_file = os.path.join(log_dir, f"audio_processor_{timestamp}.txt")
        
        # 配置日志格式
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"音频处理工具启动 - 日志文件: {log_file}")

    def set_split_params(self, min_silence_len=800, silence_thresh=-35):
        """设置音频切割参数

        Args:
            min_silence_len: 最小静音长度(毫秒)
            silence_thresh: 静音阈值(dBFS)
                -20: 相当明显的声音
                -40: 较轻的声音，推荐默认值
                -50: 非常轻微的声音，适合有背景噪音的录音
                -60: 接近数字音频噪音底线
        """
        self.split_min_silence_len = min_silence_len
        self.split_silence_thresh = silence_thresh
        self.logger.info(f"切割参数已更新: 静音长度={min_silence_len}ms, 阈值={silence_thresh}dBFS")

    def convert_mp3_to_wav(self, mp3_file, wav_file):
        """使用 macOS 自带的 afconvert 转换 MP3 到 WAV"""
        try:
            cmd = ['afconvert', '-f', 'WAVE', '-d', 'LEI16@44100', mp3_file, wav_file]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                self.logger.info(f"✅ MP3转WAV成功: {mp3_file} -> {wav_file}")
                return True
            else:
                self.logger.error(f"❌ MP3转WAV失败: {result.stderr}")
                return False
        except Exception as e:
            self.logger.error(f"❌ MP3转WAV出错: {e}")
            return False

    def prepare_audio_files(self):
        """准备音频文件：自动将MP3转换为WAV（如果需要）"""
        self.logger.info("=" * 60)
        self.logger.info("准备音频文件: 检查并转换MP3为WAV")
        self.logger.info("=" * 60)

        # 查找需要转换的 MP3 文件
        mp3_pattern = re.compile(r"(\d\d-\d\d)\.mp3$")
        wav_pattern = re.compile(r"(\d\d-\d\d)_original\.wav$")

        # 获取现有的WAV文件列表
        existing_wav = set()
        for filename in os.listdir(self.source_dir):
            match = wav_pattern.match(filename)
            if match:
                existing_wav.add(match.group(1))  # 添加前缀，如 "10-02"

        # 查找需要转换的MP3文件
        mp3_to_convert = []
        for filename in os.listdir(self.source_dir):
            match = mp3_pattern.match(filename)
            if match:
                prefix = match.group(1)
                if prefix not in existing_wav:
                    mp3_to_convert.append(filename)

        if not mp3_to_convert:
            self.logger.info("所有MP3文件都已转换为WAV，无需重复转换")
            return True

        self.logger.info(f"找到 {len(mp3_to_convert)} 个MP3文件需要转换为WAV")

        success_count = 0
        for mp3_file in mp3_to_convert:
            base_name = os.path.splitext(mp3_file)[0]
            wav_file = f"{base_name}_original.wav"
            mp3_path = os.path.join(self.source_dir, mp3_file)
            wav_path = os.path.join(self.source_dir, wav_file)

            if self.convert_mp3_to_wav(mp3_path, wav_path):
                success_count += 1

        self.logger.info(f"MP3转WAV完成: {success_count}/{len(mp3_to_convert)} 个文件成功转换")
        return success_count == len(mp3_to_convert)

    def analyze_audio_file(self, filename):
        """分析音频文件的详细信息，帮助调试静音检测问题"""
        file_path = os.path.join(self.source_dir, filename)
        if not os.path.exists(file_path):
            self.logger.error(f"文件不存在: {filename}")
            return

        try:
            audio = AudioSegment.from_mp3(file_path)

            print(f"\n{'='*50}")
            print(f"音频文件分析: {filename}")
            print(f"{'='*50}")
            print(f"基本信息:")
            print(f"  - 长度: {len(audio)}ms ({len(audio)/1000:.1f}秒)")
            print(f"  - 声道数: {audio.channels}")
            print(f"  - 采样率: {audio.frame_rate}Hz")
            print(f"  - 位深: {audio.sample_width*8}bit")
            print(f"  - 最大音量: {audio.max_dBFS:.1f}dBFS")
            print(f"  - RMS音量: {audio.dBFS:.1f}dBFS")

            # 分析不同阈值下的静音检测结果
            thresholds = [-20, -30, -40, -50, -60]
            print(f"\n不同静音阈值的检测结果:")
            for thresh in thresholds:
                nonsilent_ranges = detect_nonsilent(
                    audio,
                    min_silence_len=self.split_min_silence_len,
                    silence_thresh=thresh
                )
                print(f"  - 阈值 {thresh}dBFS: 检测到 {len(nonsilent_ranges)} 个片段")
                if nonsilent_ranges:
                    total_duration = sum(end - start for start, end in nonsilent_ranges)
                    print(f"    总时长: {total_duration}ms ({total_duration/1000:.1f}秒)")

            # 检查是否有实际的音频内容
            if audio.max_dBFS < -60:
                print(f"\n⚠️  警告: 音频音量极低，可能是:")
                print(f"    1. 录音音量太小")
                print(f"    2. 音频文件损坏")
                print(f"    3. 音频格式问题")
            elif len(detect_nonsilent(audio, min_silence_len=100, silence_thresh=-60)) == 0:
                print(f"\n⚠️  警告: 即使用最低阈值(-60dBFS)也检测不到音频内容")
                print(f"    可能是纯静音文件或文件损坏")

        except Exception as e:
            self.logger.error(f"分析文件 {filename} 失败: {e}")

    def step0_split_audio_files(self):
        """步骤0: 按静音切割原始音频文件"""
        # 首先准备音频文件（MP3转WAV）
        if not self.prepare_audio_files():
            self.logger.error("音频文件准备失败，无法继续切割")
            return

        self.logger.info("=" * 60)
        self.logger.info("步骤0: 按静音切割原始音频文件")
        self.logger.info("=" * 60)
        self.logger.info(f"切割参数: 静音长度={self.split_min_silence_len}ms, 阈值={self.split_silence_thresh}dBFS")

        # 查找原始音频文件（优先WAV，然后MP3）
        wav_pattern = re.compile(r"(\d\d-\d\d)_original\.wav$")
        mp3_pattern = re.compile(r"(\d\d-\d\d)\.mp3$")
        original_files = []

        # 先查找WAV文件
        for filename in os.listdir(self.source_dir):
            if wav_pattern.match(filename):
                original_files.append(filename)

        # 如果没有WAV文件，查找MP3文件
        if not original_files:
            for filename in os.listdir(self.source_dir):
                if mp3_pattern.match(filename):
                    original_files.append(filename)

        if not original_files:
            self.logger.warning("未找到需要切割的原始音频文件（格式: XX-XX.mp3）")
            return

        self.logger.info(f"找到 {len(original_files)} 个原始音频文件需要切割")

        for filename in original_files:
            self.logger.info(f"处理文件: {filename}")
            file_path = os.path.join(self.source_dir, filename)

            try:
                # 加载音频文件（支持WAV和MP3格式）
                if filename.endswith('.wav'):
                    audio = AudioSegment.from_wav(file_path)
                else:
                    audio = AudioSegment.from_mp3(file_path)
                self.logger.info(f"音频信息: 长度={len(audio)}ms, 声道数={audio.channels}, 采样率={audio.frame_rate}Hz, 位深={audio.sample_width*8}bit")

                # 计算音频的音量统计信息
                max_dBFS = audio.max_dBFS
                rms_dBFS = audio.dBFS
                self.logger.info(f"音频音量: 最大音量={max_dBFS:.1f}dBFS, RMS音量={rms_dBFS:.1f}dBFS")

                # 如果音频太安静，给出警告
                if max_dBFS < -50:
                    self.logger.warning(f"⚠️  音频音量很低 (最大音量: {max_dBFS:.1f}dBFS)，可能需要调整静音阈值")

                # 检测非静音片段
                self.logger.info(f"使用静音检测参数: 最小静音长度={self.split_min_silence_len}ms, 静音阈值={self.split_silence_thresh}dBFS")
                nonsilent_ranges = detect_nonsilent(
                    audio,
                    min_silence_len=self.split_min_silence_len,
                    silence_thresh=self.split_silence_thresh
                )

                if not nonsilent_ranges:
                    self.logger.warning(f"文件 {filename} 中未检测到非静音片段")
                    continue

                self.logger.info(f"检测到 {len(nonsilent_ranges)} 个音频片段")

                # 提取文件名前缀（如 "02-02"）
                base_name = os.path.splitext(filename)[0]
                if base_name.endswith('_original'):
                    base_name = base_name[:-9]  # 移除 "_original" 后缀

                # 切割并保存每个片段
                for i, (start, end) in enumerate(nonsilent_ranges, 1):
                    segment = audio[start:end]

                    # 生成新文件名
                    new_filename = f"{base_name}_{i}.wav"
                    new_path = os.path.join(self.source_dir, new_filename)

                    # 导出音频片段
                    segment.export(new_path, format="wav")

                    duration = end - start
                    self.logger.info(f"✅ 切割片段 {i}: {new_filename} (时长: {duration}ms)")
                    self.stats['converted_files'] += 1

            except Exception as e:
                self.logger.error(f"❌ 切割文件 {filename} 失败: {e}")

        self.logger.info(f"步骤0完成 - 切割生成: {self.stats['converted_files']} 个音频片段")

    def step1_filter_files(self):
        """步骤1: 删除提示音并筛选文件"""
        self.logger.info("=" * 60)
        self.logger.info("步骤1: 删除提示音并筛选文件")
        self.logger.info("=" * 60)
        
        pattern = re.compile(r"(.+?)_(\d+)\.wav$")
        grouped_files = {}
        
        wav_files = [f for f in os.listdir(self.source_dir) if f.endswith('.wav')]
        self.logger.info(f"找到 {len(wav_files)} 个WAV文件")
        
        for filename in wav_files:
            match = pattern.match(filename)
            if not match:
                self.logger.warning(f"文件名格式不匹配: {filename}")
                continue
            
            prefix, num_str = match.groups()
            num = int(num_str)
            
            # 删除提示音（编号为0,1,2）
            if num in (0, 1, 2):
                file_path = os.path.join(self.source_dir, filename)
                os.remove(file_path)
                self.stats['deleted_files'] += 1
                self.logger.info(f"🗑️  删除提示音: {filename}")
                continue
            
            # 存储有效文件
            grouped_files.setdefault(prefix, []).append((num, filename))
        
        # 对每组文件执行"隔一个删除一个"逻辑
        for prefix, file_list in grouped_files.items():
            sorted_files = sorted(file_list, key=lambda x: x[0])
            self.logger.info(f"处理组 {prefix}: {len(sorted_files)} 个文件")
            
            for i, (num, filename) in enumerate(sorted_files):
                full_path = os.path.join(self.source_dir, filename)
                if i % 2 == 0:
                    self.stats['kept_files'] += 1
                    self.logger.debug(f"✅ 保留: {filename}")
                else:
                    os.remove(full_path)
                    self.stats['deleted_files'] += 1
                    self.logger.info(f"🗑️  删除: {filename}")
        
        self.logger.info(f"步骤1完成 - 删除: {self.stats['deleted_files']} 个, 保留: {self.stats['kept_files']} 个")

    def step2_reorganize_files(self):
        """步骤2: 重新排序和分组文件"""
        self.logger.info("=" * 60)
        self.logger.info("步骤2: 重新排序和分组文件")
        self.logger.info("=" * 60)

        pattern = re.compile(r"(\d\d)-\d\d_(\d+)\.wav$")
        grouped_files = {}

        wav_files = [f for f in os.listdir(self.source_dir) if f.endswith('.wav')]
        self.logger.info(f"处理 {len(wav_files)} 个WAV文件")

        # 按课程号分组文件
        for filename in wav_files:
            match = pattern.match(filename)
            if not match:
                self.logger.warning(f"文件名格式不匹配: {filename}")
                continue

            lesson_num = match.group(1)  # 提取课程号，如 "01"
            full_path = os.path.join(self.source_dir, filename)

            grouped_files.setdefault(lesson_num, []).append((filename, full_path))

        # 为每个课程创建子文件夹并复制排序后的文件
        for lesson_num, files in grouped_files.items():
            # 创建目标子文件夹
            target_folder = os.path.join(self.source_dir, lesson_num)
            os.makedirs(target_folder, exist_ok=True)

            # 解析文件信息用于排序
            parsed_files = []
            for filename, full_path in files:
                match = pattern.match(filename)
                if match:
                    # 提取完整前缀（如 "01-02"）和编号
                    full_match = re.match(r"(\d\d-\d\d)_(\d+)\.wav$", filename)
                    if full_match:
                        prefix = full_match.group(1)  # "01-02"
                        number = int(full_match.group(2))  # 3
                        parsed_files.append((prefix, number, filename, full_path))

            # 排序：先按完整前缀，再按编号
            parsed_files.sort(key=lambda x: (x[0], x[1]))
            self.logger.info(f"课程 {lesson_num}: 处理 {len(parsed_files)} 个文件")

            # 复制并重命名文件到子文件夹
            for i, (prefix, number, old_name, src_path) in enumerate(parsed_files, 1):
                new_name = f"{i}.wav"
                target_path = os.path.join(target_folder, new_name)
                shutil.copy2(src_path, target_path)
                self.stats['renamed_files'] += 1
                self.logger.debug(f"� 复制并重命名: {old_name} → {lesson_num}/{new_name}")

        self.logger.info(f"步骤2完成 - 复制并重命名: {self.stats['renamed_files']} 个文件")

    def trim_silence(self, audio):
        """去除音频首尾静音"""
        nonsilent_ranges = detect_nonsilent(
            audio, 
            min_silence_len=self.min_silence_len, 
            silence_thresh=self.silence_thresh
        )
        
        if not nonsilent_ranges:
            return audio
        
        start_trim = nonsilent_ranges[0][0]
        end_trim = nonsilent_ranges[-1][1]
        return audio[start_trim:end_trim]

    def step3_convert_to_mp3(self):
        """步骤3: 转换WAV为MP3并去除静音（仅处理子文件夹中的文件）"""
        self.logger.info("=" * 60)
        self.logger.info("步骤3: 转换WAV为MP3并去除静音")
        self.logger.info("=" * 60)

        # 只处理数字命名的子文件夹
        lesson_folders = [f for f in os.listdir(self.source_dir)
                         if os.path.isdir(os.path.join(self.source_dir, f))
                         and f.isdigit() and len(f) == 2]

        total_files = 0
        for folder in lesson_folders:
            folder_path = os.path.join(self.source_dir, folder)
            wav_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.wav')]
            total_files += len(wav_files)

        self.logger.info(f"找到 {len(lesson_folders)} 个课程文件夹，共 {total_files} 个WAV文件需要转换")

        for folder in lesson_folders:
            folder_path = os.path.join(self.source_dir, folder)
            wav_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.wav')]

            if wav_files:
                self.logger.info(f"处理课程 {folder}: {len(wav_files)} 个文件")

            for filename in wav_files:
                full_path = os.path.join(folder_path, filename)
                try:
                    self.logger.debug(f"🎵 处理: {folder}/{filename}")

                    audio = AudioSegment.from_wav(full_path)
                    trimmed = self.trim_silence(audio)

                    mp3_path = os.path.splitext(full_path)[0] + ".mp3"
                    trimmed.export(mp3_path, format="mp3", bitrate="192k")

                    self.stats['converted_files'] += 1
                    self.logger.info(f"✅ 转换完成: {folder}/{os.path.splitext(filename)[0]}.mp3")

                except Exception as e:
                    self.logger.error(f"❌ 转换失败 {full_path}: {e}")

        self.logger.info(f"步骤3完成 - 转换: {self.stats['converted_files']} 个文件")

    def step4_copy_to_target(self):
        """步骤4: 复制MP3到目标目录"""
        self.logger.info("=" * 60)
        self.logger.info("步骤4: 复制MP3到目标目录")
        self.logger.info("=" * 60)
        
        if not os.path.exists(self.book2_root):
            self.logger.warning(f"目标根目录不存在: {self.book2_root}")
            return
        
        for folder_name in os.listdir(self.source_dir):
            folder_path = os.path.join(self.source_dir, folder_name)
            if not (os.path.isdir(folder_path) and folder_name.isdigit() and len(folder_name) == 2):
                continue
            
            lesson_num = int(folder_name)
            lesson_folder = f"lesson{lesson_num}"
            lesson_path = os.path.join(self.book2_root, lesson_folder)
            words_path = os.path.join(lesson_path, "words")
            
            # 创建目标目录
            os.makedirs(words_path, exist_ok=True)
            
            # 复制MP3文件
            mp3_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.mp3')]
            self.logger.info(f"文件夹 {folder_name}: 复制 {len(mp3_files)} 个MP3文件")
            
            for filename in mp3_files:
                src_path = os.path.join(folder_path, filename)
                dst_path = os.path.join(words_path, filename)
                shutil.copy2(src_path, dst_path)
                self.stats['copied_files'] += 1
                self.logger.debug(f"📋 复制: {filename} → {lesson_folder}/words/")
        
        self.logger.info(f"步骤4完成 - 复制: {self.stats['copied_files']} 个文件")

    def run_all_steps(self):
        """执行所有步骤"""
        start_time = datetime.now()
        self.logger.info("🚀 开始音频处理流程")

        try:
            self.step0_split_audio_files()
            self.step1_filter_files()
            self.step2_reorganize_files()
            self.step3_convert_to_mp3()
            self.step4_copy_to_target()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.logger.info("=" * 60)
            self.logger.info("🎉 所有步骤完成!")
            self.logger.info("=" * 60)
            self.logger.info("处理统计:")
            self.logger.info(f"  删除文件: {self.stats['deleted_files']} 个")
            self.logger.info(f"  保留文件: {self.stats['kept_files']} 个")
            self.logger.info(f"  移动文件: {self.stats['moved_files']} 个")
            self.logger.info(f"  重命名文件: {self.stats['renamed_files']} 个")
            self.logger.info(f"  转换文件: {self.stats['converted_files']} 个")
            self.logger.info(f"  复制文件: {self.stats['copied_files']} 个")
            self.logger.info(f"  总耗时: {duration}")
            
        except Exception as e:
            self.logger.error(f"❌ 处理过程中出现错误: {e}")
            raise


def show_advanced_menu(processor):
    """显示高级选项菜单"""
    print("\n🔧 高级选项")
    print("=" * 40)
    print("1. 仅执行步骤1: 删除提示音并筛选文件")
    print("2. 仅执行步骤2: 重新排序和分组文件")
    print("3. 仅执行步骤3: 转换WAV为MP3")
    print("4. 仅执行步骤4: 复制MP3到目标目录")
    print("0. 返回主菜单")

    choice = input("请选择 (0-4): ").strip()

    try:
        if choice == "1":
            processor.step1_filter_files()
        elif choice == "2":
            processor.step2_reorganize_files()
        elif choice == "3":
            processor.step3_convert_to_mp3()
        elif choice == "4":
            processor.step4_copy_to_target()
        elif choice == "0":
            return
        else:
            print("❌ 无效选择")
    except Exception as e:
        print(f"❌ 执行失败: {e}")


def main():
    """主函数 - 韩语音频处理工具"""
    print("=" * 60)
    print("韩语音频处理工具")
    print("=" * 60)
    print("功能说明:")
    print("• 自动将MP3文件转换为WAV格式（使用macOS自带工具）")
    print("• 按静音切割音频文件（推荐参数：静音长度1500ms，阈值-35dBFS）")
    print("• 过滤和处理音频片段")
    print("• 重命名和保存最终文件")
    print("=" * 60)
    print("1. 🚀 一键处理所有步骤（推荐）")
    print("2. 📂 仅切割音频文件（MP3→WAV→切割）")
    print("3. 🔧 高级选项（单独执行各步骤）")
    print("4. ⚙️  设置音频切割参数")
    print("0. 退出")
    print("=" * 60)

    choice = input("请选择要执行的操作 (0-4): ").strip()

    if choice == "0":
        print("退出程序")
        return

    processor = AudioProcessor()

    # 设置推荐的切割参数（调整为更宽松的设置）
    processor.set_split_params(min_silence_len=1500, silence_thresh=-35)

    try:
        if choice == "1":
            # 一键处理所有步骤
            print("\n🚀 开始一键处理所有步骤...")
            processor.run_all_steps()
            print("\n✅ 所有步骤完成！")

        elif choice == "2":
            # 仅切割音频文件
            print("\n📂 开始切割音频文件...")
            processor.step0_split_audio_files()
            print("\n✅ 音频切割完成！")

        elif choice == "3":
            # 高级选项
            show_advanced_menu(processor)

        elif choice == "4":
            # 设置参数
            print(f"\n当前切割参数:")
            print(f"• 静音长度: {processor.split_min_silence_len}ms")
            print(f"• 静音阈值: {processor.split_silence_thresh}dBFS")
            print(f"• 推荐设置: 静音长度=1500ms, 阈值=-35dBFS")
            try:
                min_len = int(input("请输入静音最小长度(ms) [默认1500]: ") or "1500")
                thresh = int(input("请输入静音判定阈值(dBFS) [默认-35]: ") or "-35")
                processor.set_split_params(min_len, thresh)
                print("✅ 参数设置完成！")
            except ValueError:
                print("❌ 参数格式错误，请输入数字")
        else:
            print("❌ 无效选择")
    except KeyboardInterrupt:
        print("\n用户中断操作")
    except Exception as e:
        print(f"执行失败: {e}")


if __name__ == "__main__":
    main()
