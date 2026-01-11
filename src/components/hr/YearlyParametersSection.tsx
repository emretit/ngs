import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";

interface YearlyParametersSectionProps {
  companyId: string;
  year: number;
}

const YearlyParametersSection: React.FC<YearlyParametersSectionProps> = ({
  companyId,
  year,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch yearly parameters
  const { data: yearParams } = useQuery({
    queryKey: ["payroll_year_parameters", companyId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_year_parameters")
        .select("*")
        
        .eq("year", year)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const [localParams, setLocalParams] = useState({
    sgk_min_base: 0,
    sgk_max_base: 0,
    sgk_employee_rate: 0.14,
    sgk_employer_rate: 0.205,
    unemployment_employee_rate: 0.01,
    unemployment_employer_rate: 0.02,
    accident_insurance_rate: 0.005,
    stamp_tax_rate: 0.00759,
    income_tax_brackets: [] as Array<{ min: number; max: number; rate: number }>,
  });

  useEffect(() => {
    if (yearParams) {
      setLocalParams({
        sgk_min_base: yearParams.sgk_min_base,
        sgk_max_base: yearParams.sgk_max_base,
        sgk_employee_rate: yearParams.sgk_employee_rate,
        sgk_employer_rate: yearParams.sgk_employer_rate,
        unemployment_employee_rate: yearParams.unemployment_employee_rate,
        unemployment_employer_rate: yearParams.unemployment_employer_rate,
        accident_insurance_rate: yearParams.accident_insurance_rate,
        stamp_tax_rate: yearParams.stamp_tax_rate,
        income_tax_brackets: yearParams.income_tax_brackets || [],
      });
    }
  }, [yearParams]);

  const saveParamsMutation = useMutation({
    mutationFn: async () => {
      const nextVersion = (yearParams?.version || 0) + 1;
      const { data, error } = await supabase
        .from("payroll_year_parameters")
        .insert({
          company_id: companyId,
          year,
          version: nextVersion,
          ...localParams,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_year_parameters"] });
      toast({
        title: "Parameters saved",
        description: `Yearly parameters for ${year} have been saved.`,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Year {year} Parameters</CardTitle>
          {yearParams && (
            <Badge variant="outline">Version {yearParams.version}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SGK Minimum Base</Label>
            <Input
              type="number"
              value={localParams.sgk_min_base}
              onChange={(e) =>
                setLocalParams({ ...localParams, sgk_min_base: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>SGK Maximum Base</Label>
            <Input
              type="number"
              value={localParams.sgk_max_base}
              onChange={(e) =>
                setLocalParams({ ...localParams, sgk_max_base: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>SGK Employee Rate (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={localParams.sgk_employee_rate * 100}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  sgk_employee_rate: (parseFloat(e.target.value) || 0) / 100,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>SGK Employer Rate (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={localParams.sgk_employer_rate * 100}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  sgk_employer_rate: (parseFloat(e.target.value) || 0) / 100,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Unemployment Employee Rate (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={localParams.unemployment_employee_rate * 100}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  unemployment_employee_rate: (parseFloat(e.target.value) || 0) / 100,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Unemployment Employer Rate (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={localParams.unemployment_employer_rate * 100}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  unemployment_employer_rate: (parseFloat(e.target.value) || 0) / 100,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Accident Insurance Rate (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={localParams.accident_insurance_rate * 100}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  accident_insurance_rate: (parseFloat(e.target.value) || 0) / 100,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Stamp Tax Rate (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={localParams.stamp_tax_rate * 100}
              onChange={(e) =>
                setLocalParams({
                  ...localParams,
                  stamp_tax_rate: (parseFloat(e.target.value) || 0) / 100,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Income Tax Brackets</Label>
          <div className="text-sm text-muted-foreground">
            Income tax brackets configuration will be implemented here.
            <br />
            Format: [&#123;"min": 0, "max": 10000, "rate": 0.15&#125;, ...]
          </div>
        </div>

        <Button
          onClick={() => saveParamsMutation.mutate()}
          disabled={saveParamsMutation.isPending}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Parameters
        </Button>
      </CardContent>
    </Card>
  );
};

export default YearlyParametersSection;

