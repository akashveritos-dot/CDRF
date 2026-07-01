import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { generateMediaUrl } from '@/lib/media-token';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: "online", message: "Upload API is active" });
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'audio/mp3'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.mp4', '.mp3'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const fileSchema = z.object({
  name: z.string().refine((name) => {
    const ext = path.extname(name).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  }, { message: 'Unsupported file extension.' }),
  type: z.string().refine((type) => ALLOWED_MIME_TYPES.includes(type), {
    message: 'Unsupported MIME type.'
  }),
  size: z.number().max(MAX_FILE_SIZE, { message: 'File too large. Maximum 100MB allowed.' })
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate using Zod schema
    const validationResult = fileSchema.safeParse({
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid file upload.';
      logger.warn({ name: file.name, type: file.type, size: file.size, error: errorMsg }, 'Rejected invalid file upload attempt');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);


    // Create a safe, unique filename
    const fileExtension = path.extname(file.name);
    const fileNameWithoutExt = path.basename(file.name, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
    const safeFileName = `${fileNameWithoutExt}_${Date.now()}${fileExtension}`;

    // -- Persistent upload directory (survives npm run build) ------------------
    // Resolves dynamically to a folder outside the project root directory.
    const getUploadDir = (): string => {
      const cwd = process.cwd();
      let projectRoot = cwd;

      // If we are in standalone mode or inside .next directory, walk up to the project root
      if (projectRoot.includes('.next')) {
        while (projectRoot.includes('.next') && projectRoot !== path.dirname(projectRoot)) {
          projectRoot = path.dirname(projectRoot);
        }
      }

      // Use a folder at the project root level (outside of .next build folder)
      // This ensures write permissions are always available (as the app user owns the project folder).
      return path.join(projectRoot, 'dcrf-persistent-uploads');
    };

    const uploadDir = getUploadDir();

    // Internal storage path for database (always /uploads/filename)
    const internalPath = `/uploads/${safeFileName}`;

    let written = false;
    let writeError = null;

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, safeFileName);
      fs.writeFileSync(filePath, buffer);
      written = true;
      logger.info(`Successfully wrote uploaded file to: ${filePath}`);
    } catch (err: any) {
      writeError = err;
      logger.warn(err, `Failed to write uploaded file to: ${uploadDir}`);
    }

    if (!written) {
      logger.error(writeError, 'All write attempts for file upload failed');
      return NextResponse.json({ error: `Failed to write file to disk: ${writeError?.message || 'Unknown error'}` }, { status: 500 });
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
    logger.error(error, 'File upload error');
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
