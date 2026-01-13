import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      console.error('[create-user] Permission denied for user:', user.id);
      return new Response(JSON.stringify({ error: 'Permission denied. Admin role required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const { email, password, full_name, role, invite } = await req.json()
    if (!email || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, full_name, role' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (!invite && !password) {
        return new Response(JSON.stringify({ error: 'Password is required when not sending an invitation.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let newUser
    if (invite) {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name },
      })
      if (error) throw error
      newUser = data.user
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      })
      if (error) throw error
      newUser = data.user
    }

    if (!newUser) {
        throw new Error('User creation failed in Supabase Auth.');
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', newUser.id)

    if (updateProfileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw updateProfileError;
    }
    
    console.log(`[create-user] Admin ${user.id} successfully created user ${newUser.id}`);

    return new Response(JSON.stringify({ message: 'User created successfully', user: newUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[create-user] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})