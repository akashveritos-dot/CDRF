import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAdminAuth } from '@/lib/api-guard';
import { logAction } from '@/lib/audit';
import { z } from 'zod';
import logger from '@/lib/logger';

const reorderSchema = z.object({
  table: z.enum(['news', 'reports', 'gallery_items', 'councils', 'cms_pages']),
  orderedIds: z.array(z.union([z.number(), z.string()]))
});

export const PUT = withAdminAuth(async (req, session) => {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const validationResult = reorderSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Input validation failed.';
      logger.warn({ errors: validationResult.error.format() }, 'Reorder payload validation failure');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { table, orderedIds } = validationResult.data;

    // Execute database updates in parallel over the pool to avoid serial request latency
    const updatePromises = orderedIds.map((id, index) =>
      query(`UPDATE \`${table}\` SET display_order = ? WHERE id = ?`, [index + 1, id])
    );
    await Promise.all(updatePromises);

    await logAction(
      req,
      session,
      'UPDATE',
      table.toUpperCase(),
      `Reordered ${orderedIds.length} items in table "${table}"`
    );

    logger.info({ user: session.email, table, count: orderedIds.length }, 'Successfully reordered table items');

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${orderedIds.length} items in table "${table}".`
    });

  } catch (error: any) {
    logger.error(error, 'Reorder API Error');
    return NextResponse.json(
      { error: 'Failed to complete reordering process' },
      { status: 500 }
    );
  }
});

