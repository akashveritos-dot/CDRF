import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { generateMediaUrl } from '@/lib/media-token';

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

    // Upload directory: public/uploads is the single source of truth.
    // This directory is NEVER wiped by `npm run build` (only .next/ is rebuilt).
    // Do NOT write to .next/standalone/public/uploads — it gets destroyed on every deployment.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Internal storage path for database (always /uploads/filename)
    const internalPath = `/uploads/${safeFileName}`;

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, safeFileName);
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      console.warn(`[UPLOAD WARNING] Failed to write to ${uploadDir}:`, err);
    }

    // Always store the internal /uploads/ path in the database.
    // The URL rewriter will convert it to an opaque media token when serving API responses.
    // For PDFs, the report serve route reads the internal path from DB directly.
    return NextResponse.json({
      success: true,
      url: internalPath,
      // Opaque preview URL for immediate display (if needed)
      secureUrl: generateMediaUrl(safeFileName),
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
