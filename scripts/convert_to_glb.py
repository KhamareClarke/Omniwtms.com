import bpy
import sys
import os

def convert_to_glb(input_file, output_file):
    # Clear existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Import the file
    if input_file.endswith('.blend'):
        bpy.ops.wm.open_mainfile(filepath=input_file)
    else:
        bpy.ops.import_scene.obj(filepath=input_file)

    # Export as GLB
    bpy.ops.export_scene.gltf(
        filepath=output_file,
        export_format='GLB',
        use_selection=False,
        export_animations=True,
        export_materials=True
    )

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: blender --background --python convert_to_glb.py -- input_file output_file")
        sys.exit(1)

    # Get input and output file paths
    input_file = sys.argv[-2]
    output_file = sys.argv[-1]

    # Convert the file
    convert_to_glb(input_file, output_file) 