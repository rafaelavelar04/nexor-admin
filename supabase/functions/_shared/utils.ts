import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { subHours } from 'https://esm.sh/date-fns@2.30.0'

export async function createAlertIfNotExists(
  supabaseAdmin: SupabaseClient, 
  rule_id: string, 
  user_id: string, 
  title: string, 
  description: string, 
  link: string
) {
  const unique_description_identifier = description.substring(0, 100);

  const { data: existingAlert, error: checkError } = await supabaseAdmin
    .from('alerts')
    .select('id')
    .eq('rule_id', rule_id)
    .eq('user_id', user_id)
    .like('description', `${unique_description_identifier}%`)
    .eq('archived', false)
    .gte('created_at', subHours(new Date(), 72).toISOString())
    .maybeSingle();

  if (checkError) {
    console.error(`[createAlertIfNotExists] Erro ao verificar alerta existente para a regra ${rule_id}:`, checkError.message);
    return;
  }

  if (!existingAlert) {
    const { error: insertError } = await supabaseAdmin.from('alerts').insert({
      user_id,
      rule_id,
      title,
      description,
      link,
    });
    if (insertError) {
      console.error(`[createAlertIfNotExists] Erro ao criar alerta para a regra ${rule_id}:`, insertError.message);
    } else {
      console.log(`[createAlertIfNotExists] Alerta criado: ${title}`);
    }
  }
}