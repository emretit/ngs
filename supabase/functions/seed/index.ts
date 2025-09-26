import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting seed function...');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if demo org already exists and get/create it (idempotent)
    let org;
    const { data: existingOrg } = await supabase
      .from('orgs')
      .select('id')
      .eq('name', 'Acme')
      .maybeSingle();

    if (existingOrg) {
      console.log('Demo org already exists, reusing it');
      org = existingOrg;
    } else {
      console.log('Creating demo organization...');
      
      // Create org "Acme"
      const { data: newOrg, error: orgError } = await supabase
        .from('orgs')
        .insert([{ name: 'Acme' }])
        .select('id')
        .single();

      if (orgError) {
        console.error('Error creating org:', orgError);
        throw new Error('Failed to create organization');
      }

      org = newOrg;
      console.log('Organization created:', org.id);
    }

    // Hash password for demo users
    const ownerEmail = 'owner@test.com';
    const memberEmail = 'member@test.com';
    const pwHash = await bcrypt.hash('Passw0rd!Strong', '10');

    console.log('Creating/updating demo users...');

    // Upsert users in public.users table (idempotent by email)
    const { data: ownerRow, error: ownerError } = await supabase
      .from('users')
      .upsert({ 
        email: ownerEmail, 
        password_hash: pwHash,
        full_name: 'Demo Owner'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (ownerError) {
      console.error('Error creating/updating owner user:', ownerError);
      throw new Error('Failed to create owner user');
    }

    const { data: memberRow, error: memberError } = await supabase
      .from('users')
      .upsert({ 
        email: memberEmail, 
        password_hash: pwHash,
        full_name: 'Demo Member'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (memberError) {
      console.error('Error creating/updating member user:', memberError);
      throw new Error('Failed to create member user');
    }

    console.log('Users created/updated:', { ownerId: ownerRow.id, memberId: memberRow.id });

    console.log('Adding org memberships...');

    // Upsert org memberships (idempotent by org_id, user_id)
    const { error: ownerMembershipError } = await supabase
      .from('org_members')
      .upsert({
        org_id: org.id,
        user_id: ownerRow.id,
        role: 'owner'
      }, { onConflict: 'org_id,user_id' });

    if (ownerMembershipError) {
      console.error('Error creating owner membership:', ownerMembershipError);
      throw new Error('Failed to create owner membership');
    }

    const { error: memberMembershipError } = await supabase
      .from('org_members')
      .upsert({
        org_id: org.id,
        user_id: memberRow.id,
        role: 'member'
      }, { onConflict: 'org_id,user_id' });

    if (memberMembershipError) {
      console.error('Error creating member membership:', memberMembershipError);
      throw new Error('Failed to create member membership');
    }

    console.log('Memberships created, adding example items...');

    // Check if items already exist for this org (idempotent)
    const { data: existingItems } = await supabase
      .from('example_items')
      .select('id, title')
      .eq('org_id', org.id);

    let items = existingItems || [];

    if (!existingItems || existingItems.length === 0) {
      console.log('Creating example items...');
      
      // Insert example items for the org
      const { data: newItems, error: itemsError } = await supabase
        .from('example_items')
        .insert([
          {
            org_id: org.id,
            title: 'Demo Item 1',
            created_by: ownerRow.id
          },
          {
            org_id: org.id,
            title: 'Demo Item 2', 
            created_by: ownerRow.id
          }
        ])
        .select('id, title');

      if (itemsError) {
        console.error('Error creating items:', itemsError);
        throw new Error('Failed to create example items');
      }

      items = newItems || [];
    } else {
      console.log('Example items already exist, reusing them');
    }

    console.log('Seed completed successfully');

    return new Response(
      JSON.stringify({
        ok: true,
        org_id: org.id,
        owner_id: ownerRow.id,
        member_id: memberRow.id,
        items: items?.map(item => item.id) || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in seed function:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Seed operation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});