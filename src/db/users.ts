import { db } from './index.ts';
import { users } from './schema.ts';
import type { UserRecord } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null
): Promise<UserRecord> {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? null,
        },
      })
      .returning();

    if (!result[0]) {
      throw new Error('Failed to resolve user record');
    }

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Unable to verify user profile right now. Please try again.', {
      cause: error,
    });
  }
}
