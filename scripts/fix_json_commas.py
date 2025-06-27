import re

def fix_json_commas():
    """修复JSON文件中缺失的逗号"""
    with open('content/words.json', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复缺失的逗号：在 } 后面缺少逗号的情况
    # 匹配模式：} 后面跟着换行和 {，但中间没有逗号
    pattern = r'}(\s*)\n(\s*){'
    replacement = r'},\1\n\2{'
    
    # 先修复基本的缺失逗号
    fixed_content = re.sub(pattern, replacement, content)
    
    # 修复特殊情况：} 后面直接跟着 { 的情况
    pattern2 = r'}\s*{'
    replacement2 = r'}, {'
    fixed_content = re.sub(pattern2, replacement2, fixed_content)
    
    # 写回文件
    with open('content/words.json', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print("已修复JSON文件中的缺失逗号")

if __name__ == '__main__':
    fix_json_commas() 