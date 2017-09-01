import os
import platform

AHEM_NAME = 'AHEM____.TTF'
HERE = os.path.split(__file__)[0]
AHEM_PATH = u'%s' % os.path.join(HERE, AHEM_NAME)
SYSTEM = platform.system()


class Ahem(object):

    def __init__(self):
        self.font_dir = None
        self.installed_ahem = False

    def install(self):
        if SYSTEM == 'Linux':
            from shutil import copy2
            from subprocess import call

            self.font_dir = os.path.join(os.path.expanduser('~'),
                                         '.local/share/fonts')
            try:
                os.makedirs(self.font_dir)
            except OSError:
                pass
            if not os.path.exists(os.path.join(self.font_dir, AHEM_NAME)):
                copy2(AHEM_PATH, self.font_dir)
                self.installed_ahem = True
            return not call('fc-cache')
        if SYSTEM == 'Darwin':
            from shutil import copy2

            self.font_dir = os.path.join(os.path.expanduser('~'),
                                         'Library/Fonts')
            if not os.path.exists(os.path.join(self.font_dir, AHEM_NAME)):
                copy2(AHEM_PATH, self.font_dir)
                self.installed_ahem = True
            return True
        if SYSTEM == 'Windows':
            from ctypes import WinDLL, windll
            hwnd_broadcast = 0xFFFF
            wm_fontchange = 0x001D

            gdi32 = WinDLL('gdi32')
            if gdi32.AddFontResourceW(AHEM_PATH):
                self.installed_ahem = True
                return bool(windll.user32.SendMessageW(hwnd_broadcast,
                                                       wm_fontchange))
        return False

    def remove(self):
        if not self.installed_ahem:
            return False

        if SYSTEM == 'Linux':
            from subprocess import call

            os.remove('%s/%s' % (self.font_dir, AHEM_NAME))
            return not call('fc-cache')
        if SYSTEM == 'Darwin':
            os.remove(os.path.join(self.font_dir, AHEM_NAME))
            return True
        if SYSTEM == 'Windows':
            from ctypes import WinDLL, windll
            hwnd_broadcast = 0xFFFF
            wm_fontchange = 0x001D

            gdi32 = WinDLL('gdi32')
            if gdi32.RemoveFontResourceW(AHEM_PATH):
                return bool(windll.user32.SendMessageW(hwnd_broadcast,
                                                       wm_fontchange))
        return False
