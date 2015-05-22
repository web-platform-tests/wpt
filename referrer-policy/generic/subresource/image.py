import array, Image, json, math, os, sys, cStringIO

def encode_string_as_png_image(string_data):
    data_bytes = array.array("B", string_data)
    num_bytes = len(data_bytes)

    # Convert data bytes to color data (RGB).
    color_data = []
    num_components = 3
    rgb = [0] * num_components
    i = 0
    for byte in data_bytes:
        component_index = i % num_components
        rgb[component_index] = byte
        if component_index == (num_components - 1) or i == (num_bytes - 1):
            color_data.append(tuple(rgb))
            rgb = [0] * num_components
        i += 1

    # Render image.
    num_pixels = len(color_data)
    sqrt = int(math.ceil(math.sqrt(num_pixels)))
    img = Image.new("RGB", (sqrt, sqrt), "black")
    img.putdata(color_data)

    # Flush PNG to string.
    f = cStringIO.StringIO()
    img.save(f, "PNG")
    f.seek(0)

    return f.read()

def main(request, response):
    response.add_required_headers = False
    response.writer.write_status(200)
    # Allow cross-origin access to get pixel data via JS.
    response.writer.write_header("access-control-allow-origin", "*")
    response.writer.write_header("content-type", "image/png")
    response.writer.write_header("cache-control", "no-cache; must-revalidate")
    response.writer.end_headers()

    headers_as_json = json.dumps(request.headers)
    body = encode_string_as_png_image(str(headers_as_json))
    response.writer.write(body)
