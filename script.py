import re
from typing import List
from tools.lint.constants import CSS_REQUIREMENT_FLAGS
from os import listdir
from os.path import isfile, join

def remove_invalid_css_flags() -> None:
    files_list = get_all_file_names('css', [])
    for file in files_list:
        remove_invalid_flags_from_file(file)



def remove_invalid_flags_from_file(filepath) -> None:
    try:
        with open(filepath, 'r') as reader:
            lines = reader.readlines()
            found_bad_flag = False
            for i, line in enumerate(lines):
                is_flags_tag = re.search('name=[\'\"]flags[\'\"]', line)
                if is_flags_tag:
                    m = re.search('(?<=content=[\'\"])[^\'\"]*?(?=[\'\"])', line)
                    tags_original = m.group()
                    if tags_original:
                        found_bad_flag = True
                        tags = tags_original.split()
                        tags = [tag for tag in tags if tag in CSS_REQUIREMENT_FLAGS['valid']]
                        line = line.replace(tags_original, " ".join(tags))
                        lines[i] = line
        if found_bad_flag:
            with open(filepath, 'w') as writer:
                writer.writelines(lines)
    except Exception as error:
        print(error)

def get_all_file_names(directory: str, files_list: List[str]) -> List[str]:
    for f in  listdir(directory):
        filepath = join(directory, f)
        if not isfile(filepath):
            get_all_file_names(filepath, files_list)
        else:
            files_list.append(filepath)
    return files_list

if __name__ == '__main__':
    remove_invalid_css_flags()
