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


def create_video_data(out, image_paths, N=2):
    all_images = [Image.open(path) for path in image_paths]
    width, height = all_images[0].size

    video_images = []
    for i in range(N):
        l = int(len(all_images) / N) + 1
        images = all_images[i*l:(i+1)*l]
        video_image = Image.new('RGB', (width, height*len(images)))
        for i, image in enumerate(images):
            video_image.paste(image, (0, i*height))

        m = hashlib.sha1()
        m.update(video_image.tobytes())
        image_name = '{}.jpg'.format(m.hexdigest())
        video_image.save(os.path.join(os.path.dirname(out), image_name))
        video_images.append({
            'name': image_name,
            'numFrames': len(images),
        })

    video_info = {
        'width': width,
        'height': height,
        'numFrames': len(all_images),
        'framerate': 24,
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
    N = int(sys.argv[3])
    create_video_data(out, images, N)


if __name__ == '__main__':
    main()
