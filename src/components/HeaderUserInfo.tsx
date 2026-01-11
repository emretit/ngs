import React from 'react'
import { logger } from '@/utils/logger';
import { Building2, User } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/auth/AuthContext'

export default function HeaderUserInfo() {
  const { userData, loading: userLoading } = useCurrentUser()
  const { user } = useAuth()
  
  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['company', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', userData.company_id)
        .eq('is_active', true)
        .maybeSingle()
      
      if (error) {
        logger.error('Error fetching company:', error)
        return null
      }
      
      return data
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika sonra garbage collect
  })

  const displayName = userData?.full_name || user?.user_metadata?.full_name || user?.email || 'Kullanıcı'
  const companyName = companyData?.name || (user?.user_metadata as any)?.company_name || null

  // Yükleniyor durumunda bile tahmini değerleri göster (flicker'ı azalt)
  // if (userLoading || companyLoading) {
  //   return (
  //     <div className="flex items-center gap-3 text-sm text-muted-foreground">
  //       <div className="animate-pulse">Yükleniyor...</div>
  //     </div>
  //   )
  // }

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* User Info */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {displayName}
        </span>
      </div>
      
      {/* Company Info */}
      {companyName && (
        <>
          <div className="text-muted-foreground">•</div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {companyName}
            </span>
          </div>
        </>
      )}
    </div>
  )
}