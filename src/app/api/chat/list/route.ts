import { headers } from 'next/headers';
import { serverAuth } from '@/lib/client/auth';
import { db, chats, messages } from '@/lib/db';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    // Authenticate user
    const h = await headers();
    const cookies = h.get('cookie') ?? '';

    const session = await serverAuth.getSession({
      fetchOptions: {
        headers: { cookie: cookies },
        credentials: 'include',
      },
    });

    if (!session.data?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mcpServerId = searchParams.get('serverId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    const conditions = [eq(chats.userId, session.data.user.id)];

    if (mcpServerId) {
      conditions.push(eq(chats.mcpServerId, mcpServerId));
    }

    // Query chats with message count
    const conversationsQuery = db
      .select({
        id: chats.id,
        title: chats.title,
        mcpServerId: chats.mcpServerId,
        visibility: chats.visibility,
        model: chats.model,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        messageCount: sql<number>`cast(count(${messages.id}) as integer)`,
      })
      .from(chats)
      .leftJoin(messages, eq(messages.chatId, chats.id))
      .where(and(...conditions))
      .groupBy(chats.id)
      .orderBy(desc(chats.updatedAt))
      .limit(limit)
      .offset(offset);

    const conversations = await conversationsQuery;

    // Get total count for pagination
    const totalCountQuery = db
      .select({
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(chats)
      .where(and(...conditions));

    const [{ count: totalCount }] = await totalCountQuery;

    return Response.json({
      chats: conversations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('List chats API error:', error);
    return Response.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a conversation
export async function DELETE(req: Request) {
  try {
    // Authenticate user
    const h = await headers();
    const cookies = h.get('cookie') ?? '';

    const session = await serverAuth.getSession({
      fetchOptions: {
        headers: { cookie: cookies },
        credentials: 'include',
      },
    });

    if (!session.data?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return Response.json(
        { error: 'Missing chatId parameter' },
        { status: 400 }
      );
    }

    // Verify user owns this chat
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      return Response.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    if (chat.userId !== session.data.user.id) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete chat (cascade will delete messages and tool calls)
    await db.delete(chats).where(eq(chats.id, chatId));

    return Response.json({
      success: true,
      message: 'Chat deleted successfully',
    });

  } catch (error) {
    console.error('Delete chat API error:', error);
    return Response.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
