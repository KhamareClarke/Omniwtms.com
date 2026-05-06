// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm } from "formidable";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: Request) {
  return new Promise<{ filePath: string; fileName: string }>(
    (resolve, reject) => {
      const form = new IncomingForm({
        uploadDir: "/tmp",
        keepExtensions: true,
      });
      form.parse(req as any, (err, fields, files) => {
        if (err) return reject(err);
        const file = files.file;
        if (!file) return reject(new Error("No file uploaded"));
        resolve({
          filePath: file[0].filepath,
          fileName: file[0].originalFilename,
        });
      });
    }
  );
}

export async function POST(req: Request) {
  try {
    // Parse the uploaded file
    const { filePath, fileName } = await parseForm(req);
    const client = new ImageAnnotatorClient();
    // Send to Google Cloud Vision
    const [result] = await client.documentTextDetection(filePath);
    // Clean up temp file
    await fs.unlink(filePath);
    // Parse Vision API response
    const ocr = [];
    const rects = [];
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      for (const annotation of result.textAnnotations) {
        if (annotation.boundingPoly && annotation.description) {
          const vertices = annotation.boundingPoly.vertices;
          if (vertices.length === 4) {
            const x = vertices[0].x || 0;
            const y = vertices[0].y || 0;
            const width = (vertices[1].x || 0) - x;
            const height = (vertices[2].y || 0) - y;
            ocr.push({ x, y, width, height, text: annotation.description });
            rects.push({ x, y, width, height });
          }
        }
      }
    }
    // Try to get image dimensions from the first annotation
    let width = 1000,
      height = 1000;
    if (
      result.fullTextAnnotation &&
      result.fullTextAnnotation.pages &&
      result.fullTextAnnotation.pages[0]
    ) {
      width = result.fullTextAnnotation.pages[0].width || width;
      height = result.fullTextAnnotation.pages[0].height || height;
    }
    return NextResponse.json({ rects, ocr, width, height });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
