import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const roomsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rooms?last_activity_at=lt.${thirtyMinutesAgo}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!roomsResponse.ok) {
      throw new Error("Failed to fetch inactive rooms");
    }

    const inactiveRooms = await roomsResponse.json();

    if (inactiveRooms.length === 0) {
      return new Response(
        JSON.stringify({ message: "No inactive rooms to clean up", count: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const roomIds = inactiveRooms.map((room: { id: string }) => room.id);

    for (const roomId of roomIds) {
      await fetch(`${supabaseUrl}/rest/v1/participants?room_id=eq.${roomId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_online: false }),
      });

      await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Inactive rooms cleaned up successfully",
        count: inactiveRooms.length,
        roomIds,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});