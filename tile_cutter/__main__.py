import math, time, os, argparse, logging
from wand.image import Image

parser = argparse.ArgumentParser(
    prog='tile_cutter',
    description='Cuts large images into tiles.')
parser.add_argument('--tile-size', metavar='SIZE', type=int, default=512,
                    help='Tile size (width and height)')
parser.add_argument('-v', '--verbose', action='store_true',
                    help='Log debugging information')
parser.add_argument('image', type=argparse.FileType('rb'),
                    help='Source image')
args = parser.parse_args()

if args.verbose:
    logging.basicConfig(level=logging.DEBUG)
else:
    logging.basicConfig(level=logging.INFO)

tile_size = args.tile_size
logging.info("tile size: %dx%d", tile_size, tile_size)

with Image(file=args.image) as source:
    logging.info("image size: %dx%d", source.width, source.height)

    # every zoom level has 2x more tiles
    max_zoom = math.ceil(math.log2(max(source.size) / args.tile_size))
    logging.info("zoom levels: 1-%d", max_zoom)

    image_size = args.tile_size * (2 ** max_zoom)
    offset_x, offset_y = tuple((image_size - orig) // 2 for orig in source.size)
    logging.info("tiled size: %dx%d-%d-%d", image_size, image_size, offset_x, offset_y)

    logging.info("GroupXIV options: {imageSize: %d, width: %d, height: %d}",
                 image_size, source.width, source.height)

    square_source = Image(width=image_size, height=image_size)
    square_source.composite(source,
        (square_source.width - source.width) // 2,
        (square_source.height - source.height) // 2)

queue = []
for z in range(1, max_zoom + 1):
    source_size = int(args.tile_size * (2 ** (max_zoom - z)))
    logging.info("zoom level %d: source %dx%d", z, source_size, source_size)

    for y in range(0, image_size // source_size):
        for x in range(0, image_size // source_size):
            crop_x, crop_y = x * source_size, y * source_size
            path = "%s-tiles/%d/%d/%d.png" % (args.image.name, z, x, y)
            logging.debug("tile %s: source %dx%d%+d%+d",
                          path, source_size, source_size, crop_x, crop_y)

            tile = square_source.clone()
            tile.crop(crop_x, crop_y, width=source_size, height=source_size)
            tile.resize(tile_size, tile_size)
            queue.append((tile, path))

current_image = 0
last_report_time = time.clock()
for (tile, path) in queue:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tile.save(filename=path)
    tile.close()

    current_image += 1
    if time.clock() - last_report_time > 1:
        last_report_time = time.clock()
        logging.info("completion: %.2f%%", current_image / len(queue) * 100)

logging.info("done")
