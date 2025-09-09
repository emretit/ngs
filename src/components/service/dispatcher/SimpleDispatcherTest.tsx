import React from 'react';
import { Card } from '@/components/ui/card';

export const SimpleDispatcherTest: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dispatcher Console Test</h2>
      <p>Bu basit bir test bileşenidir. Eğer bu görünüyorsa, temel yapı çalışıyor demektir.</p>
    </Card>
  );
};
