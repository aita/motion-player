# -*- coding:utf-8 -*-
from PIL import Image
import hashlib
import glob
import os
import sys
import mimetypes
import itertools
# import base64
import json


def make_key(path):
    no = os.path.basename(path).split('.')[0]
    return int(no)


def is_image(path):
    mime_type, _ = mimetypes.guess_type(path)
    if mime_type is None:
        # TODO: warnログを吐く
        return False
    return mime_type.split('/')[0] == 'image'


def create_video_data(out, image_paths, framerate):
    frame_images = [Image.open(path) for path in image_paths]
    width, height = frame_images[0].size

    video_images = []
    n = 0
    nx, ny = int(1024/width), int(1024/height)
    x, y = 0, 0
    video_image = Image.new('RGB', (1024, 1024))
    while True:
        if x >= nx:
            x, y = 0, y+1
        if y >= ny or n >= len(frame_images):
            m = hashlib.sha1()
            m.update(video_image.tobytes())
            image_name = '{}.jpg'.format(m.hexdigest())
            video_image.save(os.path.join(os.path.dirname(out), image_name))
            video_images.append({
                'name': image_name,
                'numFrames': y*nx+x,
            })
            x, y = 0, 0
            video_image = Image.new('RGB', (1024, 1024))
        if n >= len(frame_images):
            break

        image = frame_images[n]
        video_image.paste(image, (x*width, y*height))
        x += 1
        n += 1

    video_info = {
        'nx': nx,
        'ny': ny,
        'width': width,
        'height': height,
        'numFrames': len(frame_images),
        'framerate': framerate,
        'images': video_images,
    }
    with open(out, 'w') as fp:
        json.dump(video_info, fp, indent=4)


def main():
    assert len(sys.argv) >= 4

    dirname = sys.argv[1]
    pattern = os.path.join(dirname, '[0-9]*.*')
    path_list = glob.glob(pattern)
    path_list = sorted(path_list, key=make_key)
    images = list(filter(is_image, path_list))

    out = sys.argv[2]
    framerate = int(sys.argv[3])
    create_video_data(out, images, framerate)


if __name__ == '__main__':
    main()
