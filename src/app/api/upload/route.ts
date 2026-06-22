import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 100MB limit for video support
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 100MB allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a safe, unique filename
    const fileExtension = path.extname(file.name);
    const fileNameWithoutExt = path.basename(file.name, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
    const safeFileName = `${fileNameWithoutExt}_${Date.now()}${fileExtension}`;

    // Target paths in the public directory and standalone copy
    const uploadDirs = [
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads')
    ];

    let finalUrl = `/uploads/${safeFileName}`;

    for (const dir of uploadDirs) {
      try {
        // Only write to the directory if its parent exists (for standalone builds)
        if (dir.includes('standalone') && !fs.existsSync(path.dirname(path.dirname(dir)))) {
          continue;
        }

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const filePath = path.join(dir, safeFileName);
        fs.writeFileSync(filePath, buffer);
      } catch (err) {
        console.warn(`[UPLOAD WARNING] Failed to write to ${dir}:`, err);
      }
    }

    return NextResponse.json({ success: true, url: finalUrl });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
