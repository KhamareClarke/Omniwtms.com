import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create a temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Save the uploaded file
    const filePath = path.join(tempDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Convert the file using Blender
    const outputPath = path.join(tempDir, `${path.parse(file.name).name}.glb`);
    
    // This is a placeholder for the actual Blender conversion command
    // In a real implementation, you would:
    // 1. Use Blender's Python API to convert the file
    // 2. Handle different input formats
    // 3. Apply appropriate conversion settings
    const blenderCommand = `blender --background "${filePath}" --python convert_to_glb.py -- "${outputPath}"`;
    
    try {
      await execAsync(blenderCommand);
    } catch (error) {
      console.error('Error converting file:', error);
      return NextResponse.json(
        { error: 'Failed to convert file' },
        { status: 500 }
      );
    }

    // Read the converted file
    const convertedFile = fs.readFileSync(outputPath);

    // Clean up temporary files
    fs.unlinkSync(filePath);
    fs.unlinkSync(outputPath);

    // Return the converted file
    return new NextResponse(convertedFile, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `attachment; filename="${path.basename(outputPath)}"`,
      },
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 