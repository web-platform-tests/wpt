import re
from typing import List
from os import listdir
from os.path import isfile, join


def remove_invalid_css_flags() -> None:
    files_list = get_all_file_names('css/CSS2/borders', [])
    unique_removed = set()
    for file in files_list:
        remove_invalid_flags_from_file(file, unique_removed)
    print("UNIQUE TAGS REMOVED:")
    for unique in unique_removed:
        print(unique)


def remove_invalid_flags_from_file(filepath, unique_removed) -> None:
    try:
        with open(filepath, 'r') as reader:
            lines = reader.readlines()
            line_removed = False
            for i, line in enumerate(lines.copy()):
                is_flags_tag = re.search('name=[\'\"]flags[\'\"]', line)
                if is_flags_tag:
                    m = re.search('(?<=content=[\'\"])[^\'\"]*?(?=[\'\"])',
                                  line)
                    tags = m.group()
                    if len(tags.strip()) == 0:
                        line_removed = True
                        unique_removed.add(line.strip())
                        lines.pop(i)
                    # if tags_original:
                    #     tags = tags_original.split()
                    #     tags_left = []
                    #     for tag in tags:
                    #         if tag.strip().lower() != 'interact':
                    #             tags_left.append(tag.strip())
                    #         else:
                    #             found_bad_flag = True
                    #     # tags_left = [tag.strip() for tag in tags_left
                    #     #              if tag.lower() != 'ahem' or tag]
                    #     line = line.replace(tags_original, " ".join(tags_left))
                    #     if found_bad_flag:
                    #         if tags_left:
                    #             lines[i] = line
                    #         else:
                    #             lines.pop(i)
        if line_removed:
            with open(filepath, 'w') as writer:
                writer.writelines(lines)
    except Exception:
        pass


def get_all_file_names(directory: str, files_list: List[str]) -> List[str]:
    for f in listdir(directory):
        filepath = join(directory, f)
        if not isfile(filepath):
            get_all_file_names(filepath, files_list)
        else:
            files_list.append(filepath)
    return files_list


if __name__ == '__main__':
    remove_invalid_css_flags()
