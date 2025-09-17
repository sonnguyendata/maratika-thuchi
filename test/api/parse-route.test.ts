import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/supabaseServer', () => ({
  supabaseServerAdmin: vi.fn(),
}));

import { POST } from '@/app/api/parse/route';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

const supabaseServerAdminMock = vi.mocked(supabaseServerAdmin);

const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function createRequest(payload: unknown): NextRequest {
  return { json: async () => payload } as unknown as NextRequest;
}

beforeEach(() => {
  supabaseServerAdminMock.mockReset();
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  }
});

afterEach(() => {
  if (originalServiceRoleKey === undefined) {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  } else {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  }

  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  }
});

describe('POST /api/parse', () => {
  it('returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await POST(createRequest({ statementId: 'file.pdf' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'SUPABASE_SERVICE_ROLE_KEY is not configured',
    });
    expect(supabaseServerAdminMock).not.toHaveBeenCalled();
  });

  it('returns 500 when creating the Supabase client throws', async () => {
    supabaseServerAdminMock.mockImplementation(() => {
      throw new Error('client boom');
    });

    const response = await POST(createRequest({ statementId: 'file.pdf' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'client boom' });
  });

  it('returns 500 when downloading the statement throws', async () => {
    supabaseServerAdminMock.mockReturnValue({
      storage: {
        from: () => ({
          download: async () => {
            throw new Error('download failed');
          },
        }),
      },
    } as never);

    const response = await POST(createRequest({ statementId: 'file.pdf' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'download failed' });
  });
});
