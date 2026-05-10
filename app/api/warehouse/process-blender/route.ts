import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { requireTenantId } from "@/lib/tenants/context";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;

  try {
    const { tenantId } = t;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const tempDir = path.join(process.cwd(), "temp", tenantId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const filePath = path.join(tempDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const outputPath = path.join(tempDir, `${path.parse(file.name).name}.glb`);

    const blenderCommand = `blender --background "${filePath}" --python convert_to_glb.py -- "${outputPath}"`;

    try {
      await execAsync(blenderCommand);
    } catch (error) {
      console.error("Error converting file:", error);
      return NextResponse.json({ error: "Failed to convert file" }, { status: 500 });
    }

    const convertedFile = fs.readFileSync(outputPath);

    fs.unlinkSync(filePath);
    fs.unlinkSync(outputPath);

    return new NextResponse(convertedFile, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `attachment; filename="${path.basename(outputPath)}"`,
      },
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
