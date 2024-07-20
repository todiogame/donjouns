from PIL import Image, ImageOps
import os

def convert_and_compress_images(input_folder, output_folder, quality=85):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    for filename in os.listdir(input_folder):
        if filename.endswith(".png"):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, os.path.splitext(filename)[0] + ".jpg")
            
            with Image.open(input_path) as img:
                # Convert to 8-bit palette with a reduced number of colors
                img = img.convert("P", palette=Image.ADAPTIVE, colors=128)
                
                # Convert to JPEG
                img = img.convert("RGB")
                
                # Save with optimized quality and strip metadata
                img.save(output_path, "JPEG", quality=quality, optimize=True)
                
                print(f"Converted and compressed: {filename}")

input_folder = "djcartes3i"
output_folder = "src/assets/pics/items"
convert_and_compress_images(input_folder, output_folder)
